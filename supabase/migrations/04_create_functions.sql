-- ============================================
-- Script 4: Create Helper Functions
-- ============================================
-- Run this after creating tables and indexes
-- These functions handle stock management and coupon validation

-- ============================================
-- ROLE HELPER FUNCTIONS
-- ============================================

-- Check if user has specific role or higher
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value FROM users WHERE id = auth.uid();
    
    -- Role hierarchy: customer < staff < inventory-clerk < admin < owner
    CASE required_role
        WHEN 'customer' THEN RETURN user_role_value IN ('customer', 'staff', 'inventory-clerk', 'admin', 'owner');
        WHEN 'staff' THEN RETURN user_role_value IN ('staff', 'inventory-clerk', 'admin', 'owner');
        WHEN 'inventory-clerk' THEN RETURN user_role_value IN ('inventory-clerk', 'admin', 'owner');
        WHEN 'admin' THEN RETURN user_role_value IN ('admin', 'owner');
        WHEN 'owner' THEN RETURN user_role_value = 'owner';
        ELSE RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value FROM users WHERE id = auth.uid();
    RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if order is within 7-day refund window
CREATE OR REPLACE FUNCTION is_within_refund_window(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_completed_at TIMESTAMPTZ;
    v_days_since_completion NUMERIC;
BEGIN
    -- Get the order completion timestamp
    SELECT completed_at INTO v_completed_at
    FROM orders
    WHERE id = p_order_id;
    
    -- If order is not completed yet, refund not allowed
    IF v_completed_at IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate days since completion
    v_days_since_completion := EXTRACT(EPOCH FROM (NOW() - v_completed_at)) / 86400;
    
    -- Return true if within 7 days
    RETURN v_days_since_completion <= 7;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- STOCK MANAGEMENT FUNCTIONS
-- ============================================

-- Reserve stock for an order (prevents race conditions)
CREATE OR REPLACE FUNCTION reserve_stock(
    p_variant_id UUID,
    p_warehouse_id UUID,
    p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_available INTEGER;
BEGIN
    -- Lock the row to prevent concurrent modifications
    SELECT (quantity - reserved) INTO v_available
    FROM warehouse_stock
    WHERE variant_id = p_variant_id 
        AND warehouse_id = p_warehouse_id
    FOR UPDATE;
    
    -- Check if enough stock is available
    IF v_available IS NULL THEN
        RAISE EXCEPTION 'Stock record not found for variant % at warehouse %', p_variant_id, p_warehouse_id;
    END IF;
    
    IF v_available >= p_quantity THEN
        -- Reserve the stock
        UPDATE warehouse_stock
        SET reserved = reserved + p_quantity,
            updated_at = NOW()
        WHERE variant_id = p_variant_id 
            AND warehouse_id = p_warehouse_id;
        RETURN TRUE;
    ELSE
        -- Not enough stock
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Release reserved stock (for cancellations)
CREATE OR REPLACE FUNCTION release_stock(
    p_variant_id UUID,
    p_warehouse_id UUID,
    p_quantity INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE warehouse_stock
    SET reserved = GREATEST(0, reserved - p_quantity),
        updated_at = NOW()
    WHERE variant_id = p_variant_id 
        AND warehouse_id = p_warehouse_id;
        
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock record not found for variant % at warehouse %', p_variant_id, p_warehouse_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Convert reserved stock to sold (when order is completed)
CREATE OR REPLACE FUNCTION confirm_stock_sale(
    p_variant_id UUID,
    p_warehouse_id UUID,
    p_quantity INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE warehouse_stock
    SET quantity = quantity - p_quantity,
        reserved = GREATEST(0, reserved - p_quantity),
        updated_at = NOW()
    WHERE variant_id = p_variant_id 
        AND warehouse_id = p_warehouse_id;
        
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock record not found for variant % at warehouse %', p_variant_id, p_warehouse_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- COUPON VALIDATION FUNCTION
-- ============================================

-- Safely apply a coupon with usage limit enforcement
CREATE OR REPLACE FUNCTION apply_coupon(
    p_coupon_code VARCHAR,
    p_order_total DECIMAL
) RETURNS TABLE(
    success BOOLEAN,
    coupon_id UUID,
    discount_amount DECIMAL,
    message TEXT
) AS $$
DECLARE
    v_coupon RECORD;
    v_discount DECIMAL;
BEGIN
    -- Lock the coupon row to prevent concurrent usage
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = p_coupon_code
    FOR UPDATE;
    
    -- Validate coupon exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Coupon code not found';
        RETURN;
    END IF;
    
    -- Validate coupon is active
    IF NOT v_coupon.is_active THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Coupon is not active';
        RETURN;
    END IF;
    
    -- Validate expiry date
    IF v_coupon.expiry_date IS NOT NULL AND v_coupon.expiry_date < CURRENT_DATE THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Coupon has expired';
        RETURN;
    END IF;
    
    -- Validate usage limit
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Coupon usage limit reached';
        RETURN;
    END IF;
    
    -- Validate minimum purchase
    IF p_order_total < v_coupon.min_purchase THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 
            'Order total does not meet minimum purchase requirement of ₱' || v_coupon.min_purchase;
        RETURN;
    END IF;
    
    -- Calculate discount
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := p_order_total * (v_coupon.discount_value / 100);
    ELSE
        v_discount := v_coupon.discount_value;
    END IF;
    
    -- Apply max discount cap if set
    IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
        v_discount := v_coupon.max_discount;
    END IF;
    
    -- Increment usage count
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE id = v_coupon.id;
    
    -- Return success
    RETURN QUERY SELECT true, v_coupon.id, v_discount, 'Coupon applied successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- ORDER NUMBER GENERATOR
-- ============================================

-- Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
    v_order_number VARCHAR;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Format: ORD-YYYYMMDD-XXXX (e.g., ORD-20260123-0001)
        v_order_number := 'ORD-' || 
                         TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Check if it exists
        SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = v_order_number) INTO v_exists;
        
        -- If unique, return it
        IF NOT v_exists THEN
            RETURN v_order_number;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- AUDIT LOG HELPER
-- ============================================

-- Create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
    p_action_type audit_action,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_entity_name VARCHAR,
    p_previous_value JSONB,
    p_new_value JSONB,
    p_notes TEXT
) RETURNS UUID AS $$
DECLARE
    v_user_info JSONB;
    v_audit_id UUID;
BEGIN
    -- Get current user info
    SELECT jsonb_build_object(
        'id', id,
        'email', email,
        'name', first_name || ' ' || last_name,
        'role', role
    ) INTO v_user_info
    FROM users
    WHERE id = auth.uid();
    
    -- Insert audit log
    INSERT INTO audit_logs (
        action_type,
        performed_by,
        performer_info,
        entity_type,
        entity_id,
        entity_name,
        previous_value,
        new_value,
        notes
    ) VALUES (
        p_action_type,
        auth.uid(),
        v_user_info,
        p_entity_type,
        p_entity_id,
        p_entity_name,
        p_previous_value,
        p_new_value,
        p_notes
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FIFO BATCH ALLOCATION
-- ============================================

-- Allocate stock from batches using FIFO (First In, First Out)
CREATE OR REPLACE FUNCTION allocate_fifo_stock(
    p_warehouse_stock_id UUID,
    p_quantity INTEGER
) RETURNS TABLE(
    batch_id UUID,
    batch_number VARCHAR,
    allocated_quantity INTEGER
) AS $$
DECLARE
    v_remaining INTEGER := p_quantity;
    v_batch RECORD;
    v_allocate INTEGER;
BEGIN
    -- Process batches in FIFO order (oldest first)
    FOR v_batch IN
        SELECT id, inventory_batches.batch_id, available
        FROM inventory_batches
        WHERE warehouse_stock_id = p_warehouse_stock_id
            AND available > 0
        ORDER BY received_at ASC
        FOR UPDATE
    LOOP
        IF v_remaining <= 0 THEN
            EXIT;
        END IF;
        
        -- Calculate how much to allocate from this batch
        v_allocate := LEAST(v_batch.available, v_remaining);
        
        -- Reserve from this batch
        UPDATE inventory_batches
        SET reserved = reserved + v_allocate
        WHERE id = v_batch.id;
        
        -- Return allocation info
        RETURN QUERY SELECT v_batch.id, v_batch.batch_id, v_allocate;
        
        v_remaining := v_remaining - v_allocate;
    END LOOP;
    
    -- Check if we allocated enough
    IF v_remaining > 0 THEN
        RAISE EXCEPTION 'Insufficient stock in batches. Needed %, allocated %', 
            p_quantity, p_quantity - v_remaining;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- AUTOMATED NOTIFICATION TRIGGERS
-- ============================================

-- Function to notify on order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS NULL OR OLD.status != NEW.status) THEN
        INSERT INTO user_notifications (user_id, type, message, details)
        VALUES (
            NEW.user_id,
            CASE 
                WHEN NEW.status = 'confirmed' THEN 'order_confirmed'::notification_type
                WHEN NEW.status = 'processing' THEN 'order_processing'::notification_type
                WHEN NEW.status = 'ready' THEN 'order_ready'::notification_type
                WHEN NEW.status = 'completed' THEN 'order_completed'::notification_type
                WHEN NEW.status = 'cancelled' THEN 'order_cancelled'::notification_type
                ELSE 'order_update'::notification_type
            END,
            'Your order ' || NEW.order_number || ' is now ' || NEW.status || '.',
            jsonb_build_object('order_id', NEW.id, 'status', NEW.status)::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify on payment verification
CREATE OR REPLACE FUNCTION notify_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.payment_status IS NULL OR OLD.payment_status != NEW.payment_status) THEN
        INSERT INTO user_notifications (user_id, type, message, details)
        VALUES (
            NEW.user_id,
            CASE 
                WHEN NEW.payment_status = 'verified' THEN 'payment_verified'::notification_type
                WHEN NEW.payment_status = 'rejected' THEN 'payment_rejected'::notification_type
                ELSE 'order_update'::notification_type
            END,
            CASE 
                WHEN NEW.payment_status = 'verified' THEN 'Payment for order ' || NEW.order_number || ' has been verified.'
                WHEN NEW.payment_status = 'rejected' THEN 'Payment for order ' || NEW.order_number || ' was rejected. Please check your payment proof.'
                ELSE 'Payment status updated for ' || NEW.order_number
            END,
            jsonb_build_object('order_id', NEW.id, 'payment_status', NEW.payment_status)::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify on user role changes
CREATE OR REPLACE FUNCTION notify_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role IS NULL OR OLD.role != NEW.role) THEN
        INSERT INTO user_notifications (user_id, type, message, details)
        VALUES (
            NEW.id,
            'role_changed',
            'Your account role has been updated to ' || NEW.role || '.',
            jsonb_build_object('new_role', NEW.role)::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify on refund status updates (from order_items)
CREATE OR REPLACE FUNCTION notify_refund_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_order_number VARCHAR;
BEGIN
    IF (OLD.refund_status IS NULL OR OLD.refund_status != NEW.refund_status) THEN
        -- Get user_id and order_number from the parent order
        SELECT user_id, order_number INTO v_user_id, v_order_number
        FROM orders WHERE id = NEW.order_id;

        INSERT INTO user_notifications (user_id, type, message, details)
        VALUES (
            v_user_id,
            CASE 
                WHEN NEW.refund_status = 'approved' THEN 'refund_approved'::notification_type
                WHEN NEW.refund_status = 'rejected' THEN 'refund_rejected'::notification_type
                WHEN NEW.refund_status = 'processed' THEN 'refund_processed'::notification_type
                ELSE 'refund_update'::notification_type
            END,
            'Refund for item ' || NEW.name || ' (Order: ' || v_order_number || ') is now ' || NEW.refund_status || '.',
            jsonb_build_object('order_id', NEW.order_id, 'item_id', NEW.id, 'status', NEW.refund_status)::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- APPLY NOTIFICATION TRIGGERS
-- ============================================

-- Trigger for order status
DROP TRIGGER IF EXISTS trigger_notify_order_status ON orders;
CREATE TRIGGER trigger_notify_order_status
    AFTER UPDATE OF status ON orders
    FOR EACH ROW EXECUTE FUNCTION notify_order_status_change();

-- Trigger for payment status
DROP TRIGGER IF EXISTS trigger_notify_payment_status ON orders;
CREATE TRIGGER trigger_notify_payment_status
    AFTER UPDATE OF payment_status ON orders
    FOR EACH ROW EXECUTE FUNCTION notify_payment_status_change();

-- Trigger for role changes
DROP TRIGGER IF EXISTS trigger_notify_role_change ON users;
CREATE TRIGGER trigger_notify_role_change
    AFTER UPDATE OF role ON users
    FOR EACH ROW EXECUTE FUNCTION notify_user_role_change();

-- Trigger for refund status (on order_items)
DROP TRIGGER IF EXISTS trigger_notify_refund_status ON order_items;
CREATE TRIGGER trigger_notify_refund_status
    AFTER UPDATE OF refund_status ON order_items
    FOR EACH ROW EXECUTE FUNCTION notify_refund_status_change();

-- Function to notify on initial order placement
CREATE OR REPLACE FUNCTION notify_order_placement()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_notifications (user_id, type, message, details)
    VALUES (
        NEW.user_id,
        'order_placed',
        'Thank you! Your order ' || NEW.order_number || ' has been placed successfully.',
        jsonb_build_object('order_id', NEW.id, 'total', NEW.total)::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for order placement
DROP TRIGGER IF EXISTS trigger_notify_order_placement ON orders;
CREATE TRIGGER trigger_notify_order_placement
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION notify_order_placement();

-- ============================================
-- AUTOMATED AUDIT LOGGING TRIGGERS
-- ============================================

-- Function to automatically log critical changes
CREATE OR REPLACE FUNCTION audit_critical_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_action audit_action;
    v_entity_name VARCHAR;
BEGIN
    v_action := CASE 
        WHEN TG_OP = 'INSERT' THEN 'CREATE'::audit_action
        WHEN TG_OP = 'UPDATE' THEN 'UPDATE'::audit_action
        WHEN TG_OP = 'DELETE' THEN 'DELETE'::audit_action
    END;

    -- Determine entity name based on table
    v_entity_name := CASE TG_TABLE_NAME
        WHEN 'products' THEN NEW.name
        WHEN 'orders' THEN NEW.order_number
        WHEN 'users' THEN NEW.email
        WHEN 'inventory_batches' THEN NEW.batch_id
        ELSE NEW.id::text
    END;

    -- Only log if sensitive fields changed or on insert/delete
    IF (TG_OP = 'INSERT' OR TG_OP = 'DELETE') OR 
       (TG_TABLE_NAME = 'products' AND (OLD.price != NEW.price OR OLD.active != NEW.active)) OR
       (TG_TABLE_NAME = 'orders' AND OLD.status != NEW.status) OR
       (TG_TABLE_NAME = 'users' AND (OLD.role != NEW.role OR OLD.active != NEW.active)) OR
       (TG_TABLE_NAME = 'inventory_batches' AND OLD.quantity != NEW.quantity)
    THEN
        PERFORM create_audit_log(
            v_action,
            TG_TABLE_NAME,
            NEW.id,
            v_entity_name,
            CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
            to_jsonb(NEW),
            'Automated audit log'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS trigger_audit_products ON products;
CREATE TRIGGER trigger_audit_products
    AFTER INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_critical_changes();

DROP TRIGGER IF EXISTS trigger_audit_orders ON orders;
CREATE TRIGGER trigger_audit_orders
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_critical_changes();

DROP TRIGGER IF EXISTS trigger_audit_users ON users;
CREATE TRIGGER trigger_audit_users
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_critical_changes();

DROP TRIGGER IF EXISTS trigger_audit_inventory ON inventory_batches;
CREATE TRIGGER trigger_audit_inventory
    AFTER INSERT OR UPDATE ON inventory_batches
    FOR EACH ROW EXECUTE FUNCTION audit_critical_changes();
