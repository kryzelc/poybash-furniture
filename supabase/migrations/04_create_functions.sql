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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value FROM users WHERE id = auth.uid();
    RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql;

-- ============================================
-- AUDIT LOG HELPER
-- ============================================

-- Create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
    p_action_type VARCHAR,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
