-- ============================================
-- Order Creation Transaction (for Edge Function)
-- ============================================
-- Atomic order creation with inventory reservation and price validation

CREATE OR REPLACE FUNCTION create_order_transaction(
    p_user_id UUID,
    p_items JSONB, -- [{ variant_id, quantity, warehouse_id }]
    p_fulfillment fulfillment_type,
    p_shipping_address JSONB,
    p_payment_method payment_method,
    p_payment_proof TEXT,
    p_coupon_code VARCHAR DEFAULT NULL,
    p_is_reservation BOOLEAN DEFAULT false,
    p_reservation_percentage INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_order_number VARCHAR;
    v_subtotal DECIMAL(10, 2) := 0;
    v_delivery_fee DECIMAL(10, 2) := 0;
    v_coupon_discount DECIMAL(10, 2) := 0;
    v_coupon_id UUID := NULL;
    v_total DECIMAL(10, 2);
    v_reservation_fee DECIMAL(10, 2) := NULL;
    v_item JSONB;
    v_variant RECORD;
    v_product RECORD;
BEGIN
    -- Generate order number
    v_order_number := generate_order_number();
    
    -- Calculate subtotal and validate stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Get variant and product details with current prices
        SELECT 
            pv.id,
            pv.sku,
            pv.size,
            COALESCE(pv.price, p.price) as price,
            pv.color_id,
            p.id as product_id,
            p.name,
            p.description,
            p.category_id,
            p.material_id,
            p.image_url
        INTO v_variant
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = (v_item->>'variant_id')::UUID
            AND pv.active = true 
            AND p.active = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product variant % not found or inactive', v_item->>'variant_id';
        END IF;
        
        -- Reserve stock using FIFO
        PERFORM reserve_stock(
            (v_item->>'variant_id')::UUID,
            (v_item->>'warehouse_id')::UUID,
            (v_item->>'quantity')::INTEGER
        );
        
        -- Add to subtotal
        v_subtotal := v_subtotal + (v_variant.price * (v_item->>'quantity')::INTEGER);
    END LOOP;
    
    -- Calculate delivery fee (₱500 for delivery, ₱0 for pickup)
    IF p_fulfillment = 'delivery' THEN
        v_delivery_fee := 500.00;
    END IF;
    
    -- Apply coupon if provided
    IF p_coupon_code IS NOT NULL THEN
        DECLARE
            v_coupon_result RECORD;
        BEGIN
            SELECT * INTO v_coupon_result
            FROM apply_coupon(p_coupon_code, v_subtotal + v_delivery_fee);
            
            IF v_coupon_result.success THEN
                v_coupon_id := v_coupon_result.coupon_id;
                v_coupon_discount := v_coupon_result.discount_amount;
            END IF;
        END;
    END IF;
    
    -- Calculate total
    v_total := v_subtotal + v_delivery_fee - v_coupon_discount;
    
    -- Calculate reservation fee if applicable
    IF p_is_reservation AND p_reservation_percentage IS NOT NULL THEN
        v_reservation_fee := v_total * (p_reservation_percentage / 100.0);
    END IF;
    
    -- Create order
    INSERT INTO orders (
        order_number,
        user_id,
        status,
        subtotal,
        delivery_fee,
        coupon_discount,
        coupon_id,
        total,
        is_reservation,
        reservation_fee,
        reservation_percentage,
        fulfillment,
        shipping_address,
        payment_method,
        payment_status,
        payment_proof,
        is_manual_order
    ) VALUES (
        v_order_number,
        p_user_id,
        'pending',
        v_subtotal,
        v_delivery_fee,
        v_coupon_discount,
        v_coupon_id,
        v_total,
        p_is_reservation,
        v_reservation_fee,
        p_reservation_percentage,
        p_fulfillment,
        p_shipping_address,
        p_payment_method,
        'pending',
        p_payment_proof,
        false
    ) RETURNING id INTO v_order_id;
    
    -- Create order items with snapshots
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Re-fetch variant details for snapshot
        SELECT 
            pv.id,
            pv.sku,
            pv.size,
            COALESCE(pv.price, p.price) as price,
            p.id as product_id,
            p.name,
            p.description,
            p.image_url,
            c.name as color_name,
            c.hex_code as color_hex,
            m.name as material_name,
            mc.name as category_name,
            sc.name as sub_category_name
        INTO v_variant
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        LEFT JOIN colors c ON pv.color_id = c.id
        LEFT JOIN materials m ON p.material_id = m.id
        LEFT JOIN main_categories mc ON p.category_id = mc.id
        LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
        WHERE pv.id = (v_item->>'variant_id')::UUID;
        
        INSERT INTO order_items (
            order_id,
            product_id,
            variant_id,
            sku,
            name,
            description,
            price,
            quantity,
            size,
            color_name,
            color_hex,
            material_name,
            category_name,
            sub_category_name,
            image_url,
            warehouse_source
        ) VALUES (
            v_order_id,
            v_variant.product_id,
            v_variant.id,
            v_variant.sku,
            v_variant.name,
            v_variant.description,
            v_variant.price,
            (v_item->>'quantity')::INTEGER,
            v_variant.size,
            v_variant.color_name,
            v_variant.color_hex,
            v_variant.material_name,
            v_variant.category_name,
            v_variant.sub_category_name,
            v_variant.image_url,
            (v_item->>'warehouse_id')::UUID
        );
    END LOOP;
    
    -- Create shipping address record if delivery
    IF p_fulfillment = 'delivery' AND p_shipping_address IS NOT NULL THEN
        INSERT INTO order_shipping_addresses (
            order_id,
            first_name,
            last_name,
            address,
            barangay,
            city,
            state,
            zip_code,
            country,
            phone
        ) VALUES (
            v_order_id,
            p_shipping_address->>'first_name',
            p_shipping_address->>'last_name',
            p_shipping_address->>'address',
            p_shipping_address->>'barangay',
            p_shipping_address->>'city',
            p_shipping_address->>'state',
            p_shipping_address->>'zip_code',
            COALESCE(p_shipping_address->>'country', 'Philippines'),
            p_shipping_address->>'phone'
        );
    END IF;
    
    -- Return order details
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'subtotal', v_subtotal,
        'delivery_fee', v_delivery_fee,
        'coupon_discount', v_coupon_discount,
        'total', v_total
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback is automatic
        RAISE EXCEPTION 'Order creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
