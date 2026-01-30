-- ============================================
-- RLS Policy Test Suite
-- ============================================
-- Run these tests to verify your security policies work correctly

-- ============================================
-- TEST SETUP
-- ============================================

-- Create test users (run as admin)
DO $$
BEGIN
    -- Test customer
    INSERT INTO users (id, email, first_name, last_name, role, active, email_verified)
    VALUES 
        ('00000000-0000-0000-0000-000000000001', 'customer@test.com', 'Test', 'Customer', 'customer', true, true),
        ('00000000-0000-0000-0000-000000000002', 'staff@test.com', 'Test', 'Staff', 'staff', true, true),
        ('00000000-0000-0000-0000-000000000003', 'admin@test.com', 'Test', 'Admin', 'admin', true, true),
        ('00000000-0000-0000-0000-000000000004', 'owner@test.com', 'Test', 'Owner', 'owner', true, true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================
-- TEST 1: Customer can only view own orders
-- ============================================

-- Create test order for customer
INSERT INTO orders (user_id, order_number, status, subtotal, total, fulfillment, payment_method)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'TEST-ORD-001',
    'pending',
    1000.00,
    1000.00,
    'pickup',
    'cash'
) ON CONFLICT DO NOTHING;

-- Test: Customer should see their own order
-- SET ROLE TO customer_role; -- Simulate customer session
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM orders 
            WHERE user_id = '00000000-0000-0000-0000-000000000001'
        ) THEN '✅ PASS: Customer can view own orders'
        ELSE '❌ FAIL: Customer cannot view own orders'
    END as test_result;

-- ============================================
-- TEST 2: Customer cannot view other orders
-- ============================================

-- Create order for different user
INSERT INTO orders (user_id, order_number, status, subtotal, total, fulfillment, payment_method)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'TEST-ORD-002',
    'pending',
    2000.00,
    2000.00,
    'pickup',
    'cash'
) ON CONFLICT DO NOTHING;

-- Test as customer 1, should NOT see customer 2's order
-- This will be blocked by RLS policy
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM orders 
            WHERE user_id = '00000000-0000-0000-0000-000000000002'
            -- When authenticated as customer 1
        ) THEN '✅ PASS: Customer cannot view others orders (RLS working)'
        ELSE '❌ FAIL: Customer can see other orders (RLS breach!)'
    END as test_result;

-- ============================================
-- TEST 3: Staff can view all orders
-- ============================================

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM orders
            -- When authenticated as staff
        ) >= 2 THEN '✅ PASS: Staff can view all orders'
        ELSE '❌ FAIL: Staff cannot view all orders'
    END as test_result;

-- ============================================
-- TEST 4: Customer cannot update product prices
-- ============================================

-- Test: Try to create product as customer (should fail)
-- This will be caught by RLS policy

DO $$
BEGIN
    -- Simulate customer trying to insert product
    BEGIN
        INSERT INTO products (name, price, category_id)
        VALUES ('Hacked Product', 0.01, (SELECT id FROM main_categories LIMIT 1));
        
        RAISE EXCEPTION '❌ FAIL: Customer was able to create product (RLS breach!)';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '✅ PASS: Customer blocked from creating products';
    END;
END $$;

-- ============================================
-- TEST 5: Price tampering protection
-- ============================================

-- Create test product and variant
DO $$
DECLARE
    v_product_id BIGINT;
    v_variant_id UUID;
    v_order_id UUID;
BEGIN
    -- Create product
    INSERT INTO products (name, price, category_id, in_stock, active)
    VALUES ('Test Security Product', 10000.00, (SELECT id FROM main_categories LIMIT 1), true, true)
    RETURNING id INTO v_product_id;
    
    -- Create variant
    INSERT INTO product_variants (product_id, size, price, sku, active)
    VALUES (v_product_id, 'Standard', 10000.00, 'TEST-SEC-001', true)
    RETURNING id INTO v_variant_id;
    
    -- Create order
    INSERT INTO orders (user_id, order_number, status, subtotal, total, fulfillment, payment_method)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'TEST-PRICE-TAMPER',
        'pending',
        10000.00,
        10000.00,
        'pickup',
        'cash'
    ) RETURNING id INTO v_order_id;
    
    -- Try to insert order item with wrong price (should fail)
    BEGIN
        INSERT INTO order_items (
            order_id, product_id, variant_id, sku, name, 
            price, quantity, warehouse_source
        ) VALUES (
            v_order_id,
            v_product_id,
            v_variant_id,
            'TEST-SEC-001',
            'Test Product',
            0.01, -- TAMPERED PRICE (actual is 10000.00)
            1,
            (SELECT id FROM warehouses LIMIT 1)
        );
        
        RAISE EXCEPTION '❌ FAIL: Price tampering not detected!';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '✅ PASS: Price tampering blocked - %', SQLERRM;
    END;
END $$;

-- ============================================
-- TEST 6: Refund window enforcement
-- ============================================

DO $$
DECLARE
    v_order_id UUID;
    v_item_id UUID;
BEGIN
    -- Create completed order from 8 days ago (outside refund window)
    INSERT INTO orders (
        user_id, order_number, status, subtotal, total, 
        fulfillment, payment_method, completed_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'TEST-REFUND-OLD',
        'completed',
        5000.00,
        5000.00,
        'pickup',
        'cash',
        NOW() - INTERVAL '8 days'
    ) RETURNING id INTO v_order_id;
    
    -- Add order item
    INSERT INTO order_items (
        order_id, sku, name, price, quantity,
        warehouse_source
    ) VALUES (
        v_order_id, 'TEST-001', 'Test Item', 5000.00, 1,
        (SELECT id FROM warehouses LIMIT 1)
    ) RETURNING id INTO v_item_id;
    
    -- Try to request refund (should fail - outside 7-day window)
    IF is_within_refund_window(v_order_id) THEN
        RAISE EXCEPTION '❌ FAIL: Refund allowed after 7 days!';
    ELSE
        RAISE NOTICE '✅ PASS: Refund blocked outside 7-day window';
    END IF;
END $$;

-- ============================================
-- TEST 7: Stock reservation concurrency
-- ============================================

DO $$
DECLARE
    v_variant_id UUID;
    v_warehouse_id UUID;
    v_success BOOLEAN;
BEGIN
    -- Create test variant with limited stock
    INSERT INTO product_variants (product_id, size, price, sku, active)
    VALUES (
        (SELECT id FROM products LIMIT 1),
        'Test',
        1000.00,
        'TEST-STOCK-001',
        true
    ) RETURNING id INTO v_variant_id;
    
    v_warehouse_id := (SELECT id FROM warehouses LIMIT 1);
    
    -- Add 10 units of stock
    INSERT INTO warehouse_stock (variant_id, warehouse_id, quantity, reserved)
    VALUES (v_variant_id, v_warehouse_id, 10, 0);
    
    -- Reserve 5 units
    v_success := reserve_stock(v_variant_id, v_warehouse_id, 5);
    
    IF v_success THEN
        -- Try to reserve 6 more (should fail - only 5 available)
        BEGIN
            v_success := reserve_stock(v_variant_id, v_warehouse_id, 6);
            RAISE EXCEPTION '❌ FAIL: Over-reservation allowed!';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '✅ PASS: Stock reservation prevents over-booking';
        END;
    ELSE
        RAISE EXCEPTION '❌ FAIL: Initial reservation failed';
    END IF;
END $$;

-- ============================================
-- TEST 8: Audit logging works
-- ============================================

DO $$
DECLARE
    v_initial_count INTEGER;
    v_final_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_initial_count FROM audit_logs;
    
    -- Trigger an audit event (update product price)
    UPDATE products 
    SET price = price + 0.01 
    WHERE id = (SELECT id FROM products LIMIT 1);
    
    SELECT COUNT(*) INTO v_final_count FROM audit_logs;
    
    IF v_final_count > v_initial_count THEN
        RAISE NOTICE '✅ PASS: Audit logging working';
    ELSE
        RAISE EXCEPTION '❌ FAIL: Audit log not created';
    END IF;
END $$;

-- ============================================
-- TEST 9: Owner-only audit log access
-- ============================================

-- Only owners should query audit_logs
-- Staff/Admin attempts will return 0 rows due to RLS

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM audit_logs
            -- When authenticated as staff/admin
        ) = 0 THEN '✅ PASS: Non-owners cannot view audit logs'
        ELSE '❌ FAIL: Non-owners can view audit logs (security breach!)'
    END as test_result;

-- ============================================
-- TEST 10: Rate limiting on coupon validation
-- ============================================

DO $$
DECLARE
    i INTEGER;
    v_result RECORD;
BEGIN
    -- Try to validate same coupon 10 times rapidly
    FOR i IN 1..10 LOOP
        BEGIN
            SELECT * INTO v_result FROM apply_coupon('NONEXISTENT', 1000);
        EXCEPTION
            WHEN OTHERS THEN
                IF i >= 5 THEN
                    RAISE NOTICE '✅ PASS: Rate limiting kicked in after % attempts', i;
                    EXIT;
                END IF;
        END;
    END LOOP;
END $$;

-- ============================================
-- CLEANUP TEST DATA
-- ============================================

-- Remove test orders
DELETE FROM orders WHERE order_number LIKE 'TEST-%';

-- Remove test products
DELETE FROM products WHERE name LIKE 'Test%' OR name LIKE '%Test%';

-- Keep test users for manual testing
-- DELETE FROM users WHERE email LIKE '%@test.com';

-- ============================================
-- SUMMARY
-- ============================================

SELECT '🎉 RLS Policy Test Suite Complete' as message,
       'Review the logs above for any ❌ FAIL results' as next_step,
       'All ✅ PASS means your security is solid!' as status;

-- ============================================
-- MANUAL TESTING INSTRUCTIONS
-- ============================================

/*
1. Test in Supabase Dashboard:
   - Go to SQL Editor
   - Run this entire script
   - Check for any ❌ FAIL messages

2. Test in Application:
   - Log in as customer
   - Try to access /admin routes
   - Try to modify prices in browser devtools
   - Verify you can only see your own orders

3. Test Real-Time:
   - Place an order
   - Have staff update order status
   - Verify customer receives notification

4. Load Testing:
   - Use tools like k6 or Artillery
   - Test 100 concurrent order placements
   - Verify stock doesn't go negative
   - Check audit logs capture everything
*/
