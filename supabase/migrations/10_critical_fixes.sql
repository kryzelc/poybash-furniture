-- ============================================
-- Script 10: Critical Fixes and Missing Functions
-- ============================================
-- Run this after all other migrations
-- Fixes critical bugs and adds missing functionality

-- ============================================
-- FIX 1: Missing log_security_event Function
-- ============================================

CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_severity TEXT,
    p_details JSONB
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_user_info JSONB;
BEGIN
    -- Get user info if available
    IF p_user_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', id,
            'email', email,
            'name', first_name || ' ' || last_name,
            'role', role
        ) INTO v_user_info
        FROM users
        WHERE id = p_user_id;
    ELSE
        v_user_info := jsonb_build_object('type', 'anonymous');
    END IF;

    -- Insert security event into audit logs
    INSERT INTO audit_logs (
        action_type,
        performed_by,
        performer_info,
        entity_type,
        entity_name,
        new_value,
        notes,
        ip_address
    ) VALUES (
        'UPDATE'::audit_action, -- Use UPDATE as proxy for security events
        p_user_id,
        v_user_info,
        'SECURITY_EVENT',
        p_event_type,
        jsonb_build_object(
            'severity', p_severity,
            'details', p_details
        ),
        'Security Event: ' || p_event_type || ' [' || p_severity || ']',
        CASE 
            WHEN p_details ? 'ip' THEN (p_details->>'ip')::INET
            ELSE public.get_client_ip()::INET
        END
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FIX 2: Update audit_critical_changes to handle DELETE
-- ============================================

CREATE OR REPLACE FUNCTION public.audit_critical_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_action audit_action;
    v_entity_name VARCHAR;
    v_entity_id UUID;
BEGIN
    v_action := CASE 
        WHEN TG_OP = 'INSERT' THEN 'CREATE'::audit_action
        WHEN TG_OP = 'UPDATE' THEN 'UPDATE'::audit_action
        WHEN TG_OP = 'DELETE' THEN 'DELETE'::audit_action
    END;

    -- Handle entity_id for both NEW and OLD
    v_entity_id := CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
    END;

    -- Determine entity name based on table
    v_entity_name := CASE TG_TABLE_NAME
        WHEN 'products' THEN CASE WHEN TG_OP = 'DELETE' THEN OLD.name ELSE NEW.name END
        WHEN 'orders' THEN CASE WHEN TG_OP = 'DELETE' THEN OLD.order_number ELSE NEW.order_number END
        WHEN 'users' THEN CASE WHEN TG_OP = 'DELETE' THEN OLD.email ELSE NEW.email END
        WHEN 'inventory_batches' THEN CASE WHEN TG_OP = 'DELETE' THEN OLD.batch_id ELSE NEW.batch_id END
        ELSE v_entity_id::text
    END;

    -- Log based on operation type
    IF TG_OP = 'DELETE' THEN
        PERFORM create_audit_log(
            v_action,
            TG_TABLE_NAME,
            v_entity_id,
            v_entity_name,
            to_jsonb(OLD),
            NULL,
            'Record deleted'
        );
    ELSIF TG_OP = 'INSERT' THEN
        PERFORM create_audit_log(
            v_action,
            TG_TABLE_NAME,
            v_entity_id,
            v_entity_name,
            NULL,
            to_jsonb(NEW),
            'Record created'
        );
    ELSE -- UPDATE
        -- Only log if sensitive fields changed
        IF (TG_TABLE_NAME = 'products' AND (OLD.price != NEW.price OR OLD.active != NEW.active)) OR
           (TG_TABLE_NAME = 'orders' AND OLD.status != NEW.status) OR
           (TG_TABLE_NAME = 'users' AND (OLD.role != NEW.role OR OLD.active != NEW.active)) OR
           (TG_TABLE_NAME = 'inventory_batches' AND OLD.quantity != NEW.quantity)
        THEN
            PERFORM create_audit_log(
                v_action,
                TG_TABLE_NAME,
                v_entity_id,
                v_entity_name,
                to_jsonb(OLD),
                to_jsonb(NEW),
                'Sensitive field updated'
            );
        END IF;
    END IF;

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Reapply triggers with DELETE support
DROP TRIGGER IF EXISTS trigger_audit_products ON products;
CREATE TRIGGER trigger_audit_products
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_critical_changes();

DROP TRIGGER IF EXISTS trigger_audit_orders ON orders;
CREATE TRIGGER trigger_audit_orders
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_critical_changes();

DROP TRIGGER IF EXISTS trigger_audit_users ON users;
CREATE TRIGGER trigger_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_critical_changes();

DROP TRIGGER IF EXISTS trigger_audit_inventory ON inventory_batches;
CREATE TRIGGER trigger_audit_inventory
    AFTER INSERT OR UPDATE OR DELETE ON inventory_batches
    FOR EACH ROW EXECUTE FUNCTION audit_critical_changes();

-- ============================================
-- FIX 3: Fix get_client_ip() volatility
-- ============================================

CREATE OR REPLACE FUNCTION public.get_client_ip()
RETURNS TEXT AS $$
DECLARE
    v_headers JSONB;
BEGIN
    -- Supabase stores request headers in this config variable
    v_headers := current_setting('request.headers', true)::jsonb;
    -- x-forwarded-for typically contains the real client IP in Supabase/PostgREST
    RETURN COALESCE(v_headers->>'x-forwarded-for', '0.0.0.0');
EXCEPTION
    WHEN OTHERS THEN RETURN '0.0.0.0';
END;
$$ LANGUAGE plpgsql VOLATILE SET search_path = public; -- Changed from STABLE to VOLATILE

-- ============================================
-- FIX 4: Remove Problematic Coupon Throttle RLS
-- ============================================

-- This RLS policy throttles ALL coupon reads, including legitimate browsing
-- Replace with application-level throttling for validation only
DROP POLICY IF EXISTS "Coupon Throttling Policy" ON coupons;

-- ============================================
-- FIX 5: Add Missing Audit Log Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_timestamp ON audit_logs(entity_type, timestamp DESC);

-- ============================================
-- FIX 6: Add Cart Cleanup Function
-- ============================================

-- Function to clean up expired shopping carts
CREATE OR REPLACE FUNCTION public.cleanup_expired_carts()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete expired carts and cascade to cart_items
    DELETE FROM shopping_carts
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    IF v_deleted_count > 0 THEN
        PERFORM create_audit_log(
            'DELETE'::audit_action,
            'shopping_carts',
            NULL,
            'CART_CLEANUP',
            NULL,
            jsonb_build_object('deleted_count', v_deleted_count),
            'Automated cleanup of ' || v_deleted_count || ' expired carts'
        );
    END IF;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FIX 7: Add Cart Merge Function for Login
-- ============================================

-- Merge anonymous session cart into user cart when they log in
CREATE OR REPLACE FUNCTION public.merge_carts(
    p_session_id VARCHAR,
    p_user_id UUID
) RETURNS VOID AS $$
DECLARE
    v_session_cart_id UUID;
    v_user_cart_id UUID;
    v_item RECORD;
BEGIN
    -- Get session cart
    SELECT id INTO v_session_cart_id
    FROM shopping_carts
    WHERE session_id = p_session_id;
    
    IF v_session_cart_id IS NULL THEN
        RETURN; -- No session cart to merge
    END IF;
    
    -- Get or create user cart
    INSERT INTO shopping_carts (user_id, session_id)
    VALUES (p_user_id, NULL)
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO v_user_cart_id
    FROM shopping_carts
    WHERE user_id = p_user_id;
    
    -- Merge items from session cart to user cart
    FOR v_item IN
        SELECT variant_id, quantity
        FROM cart_items
        WHERE cart_id = v_session_cart_id
    LOOP
        -- Upsert: Add quantity if item exists, insert if new
        INSERT INTO cart_items (cart_id, variant_id, quantity)
        VALUES (v_user_cart_id, v_item.variant_id, v_item.quantity)
        ON CONFLICT (cart_id, variant_id)
        DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity;
    END LOOP;
    
    -- Delete session cart
    DELETE FROM shopping_carts WHERE id = v_session_cart_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FIX 8: Add RLS Policies for Materialized Views
-- ============================================

-- Only configure if materialized views exist (from script 05)
DO $$ 
BEGIN
    -- Check if materialized views exist before configuring them
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'daily_sales_summary') THEN
        ALTER MATERIALIZED VIEW daily_sales_summary OWNER TO postgres;
        GRANT SELECT ON daily_sales_summary TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'product_performance') THEN
        ALTER MATERIALIZED VIEW product_performance OWNER TO postgres;
        GRANT SELECT ON product_performance TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'low_stock_alerts') THEN
        ALTER MATERIALIZED VIEW low_stock_alerts OWNER TO postgres;
        GRANT SELECT ON low_stock_alerts TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'customer_lifetime_value') THEN
        ALTER MATERIALIZED VIEW customer_lifetime_value OWNER TO postgres;
        GRANT SELECT ON customer_lifetime_value TO authenticated;
    END IF;
END $$;

-- Note: Materialized views don't support RLS directly in PostgreSQL
-- Access control must be enforced at application layer or via wrapper functions

-- ============================================
-- FIX 9: Add Stock Reservation via FIFO Integration
-- ============================================

-- Enhanced reserve_stock that uses FIFO batches
CREATE OR REPLACE FUNCTION reserve_stock_with_fifo(
    p_variant_id UUID,
    p_warehouse_id UUID,
    p_quantity INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_available INTEGER;
    v_warehouse_stock_id UUID;
    v_batch_allocations JSONB;
BEGIN
    -- Lock warehouse_stock row
    SELECT id, (quantity - reserved) INTO v_warehouse_stock_id, v_available
    FROM warehouse_stock
    WHERE variant_id = p_variant_id 
        AND warehouse_id = p_warehouse_id
    FOR UPDATE;
    
    -- Check availability
    IF v_available IS NULL THEN
        RAISE EXCEPTION 'Stock record not found for variant % at warehouse %', p_variant_id, p_warehouse_id;
    END IF;
    
    IF v_available < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_available, p_quantity;
    END IF;
    
    -- Allocate from FIFO batches
    v_batch_allocations := (
        SELECT jsonb_agg(jsonb_build_object(
            'batch_id', batch_id,
            'batch_number', batch_number,
            'allocated', allocated_quantity
        ))
        FROM allocate_fifo_stock(v_warehouse_stock_id, p_quantity)
    );
    
    -- Update warehouse_stock reserved count
    UPDATE warehouse_stock
    SET reserved = reserved + p_quantity,
        updated_at = NOW()
    WHERE id = v_warehouse_stock_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'allocated', p_quantity,
        'batches', v_batch_allocations
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FIX 10: Add User Notifications Management
-- ============================================

-- Function for users to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_notifications
    SET read = true,
        updated_at = NOW()
    WHERE id = p_notification_id
        AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE user_notifications
    SET read = true,
        updated_at = NOW()
    WHERE user_id = auth.uid()
        AND read = false;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Allow users to update their own notifications (for marking as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;
CREATE POLICY "Users can update own notifications"
ON user_notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND read = true); -- Can only mark as read

-- ============================================
-- VALIDATION COMPLETE
-- ============================================
-- All critical issues have been addressed.
-- Review remaining recommendations in documentation.
