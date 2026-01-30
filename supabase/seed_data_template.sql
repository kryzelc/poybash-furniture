-- ============================================
-- SEED DATA TEMPLATE - Real Products Only
-- ============================================
-- Instructions:
-- 1. Replace placeholder values with your ACTUAL furniture data
-- 2. Upload images to Supabase Storage first
-- 3. Use real image URLs from your storage bucket
-- 4. Run this script after all migrations complete

-- ============================================
-- STEP 1: Create Warehouses
-- ============================================

INSERT INTO warehouses (id, name, address, active) VALUES
('11111111-1111-1111-1111-111111111111', 'Lorenzo Warehouse', 'Lorenzo, Ozamiz City', true),
('22222222-2222-2222-2222-222222222222', 'Oroquieta Warehouse', 'Oroquieta City', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: Create Categories
-- ============================================

INSERT INTO main_categories (name, display_name, description, active) VALUES
('living-room', 'Living Room', 'Sofas, coffee tables, entertainment centers', true),
('bedroom', 'Bedroom', 'Beds, dressers, nightstands', true),
('dining', 'Dining', 'Dining tables, chairs, cabinets', true),
('office', 'Office', 'Desks, office chairs, storage', true),
('outdoor', 'Outdoor', 'Patio furniture, garden sets', true)
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name;

-- Get category IDs for reference
DO $$
DECLARE
    v_living_room_id UUID;
    v_bedroom_id UUID;
    v_dining_id UUID;
BEGIN
    SELECT id INTO v_living_room_id FROM main_categories WHERE name = 'living-room';
    SELECT id INTO v_bedroom_id FROM main_categories WHERE name = 'bedroom';
    SELECT id INTO v_dining_id FROM main_categories WHERE name = 'dining';
END $$;

-- Sub-categories
INSERT INTO sub_categories (category_id, name, description, active) 
SELECT 
    (SELECT id FROM main_categories WHERE name = 'living-room'),
    'sofas',
    'Comfortable seating for your living space',
    true
WHERE NOT EXISTS (SELECT 1 FROM sub_categories WHERE name = 'sofas');

INSERT INTO sub_categories (category_id, name, description, active)
SELECT 
    (SELECT id FROM main_categories WHERE name = 'bedroom'),
    'beds',
    'Quality beds for a good nights sleep',
    true
WHERE NOT EXISTS (SELECT 1 FROM sub_categories WHERE name = 'beds');

-- ============================================
-- STEP 3: Create Materials
-- ============================================

INSERT INTO materials (name, description, active) VALUES
('solid-wood', 'Premium solid hardwood construction', true),
('engineered-wood', 'Durable engineered wood', true),
('metal', 'Powder-coated metal frame', true),
('rattan', 'Natural rattan weaving', true),
('fabric', 'High-quality upholstery fabric', true),
('leather', 'Genuine leather upholstery', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 4: Create Colors
-- ============================================

INSERT INTO colors (name, hex_code, active) VALUES
('Natural Wood', '#D2B48C', true),
('Dark Walnut', '#3D2817', true),
('White', '#FFFFFF', true),
('Black', '#000000', true),
('Gray', '#808080', true),
('Brown', '#8B4513', true),
('Beige', '#F5F5DC', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 5: Add YOUR REAL PRODUCTS
-- ============================================
-- **IMPORTANT**: Replace these with your actual furniture!
-- 
-- Image Upload Instructions:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a bucket called "products" (make it public)
-- 3. Upload your product images
-- 4. Copy the public URL (format: https://your-project.supabase.co/storage/v1/object/public/products/image.jpg)
-- 5. Use those URLs below

-- Example Product 1: Classic Wooden Sofa
INSERT INTO products (
    name, 
    price, 
    description, 
    category_id,
    sub_category_id,
    image_url,
    images,
    material_id,
    dimensions,
    in_stock,
    featured,
    active
) VALUES (
    'Classic Wooden Sofa - 3 Seater', -- YOUR PRODUCT NAME
    28500.00, -- YOUR PRICE in Philippine Pesos
    'Beautiful handcrafted wooden sofa with comfortable cushions. Perfect for modern Filipino homes.', -- YOUR DESCRIPTION
    (SELECT id FROM main_categories WHERE name = 'living-room'),
    (SELECT id FROM sub_categories WHERE name = 'sofas'),
    'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/products/sofa-1.jpg', -- YOUR IMAGE URL
    ARRAY[
        'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/products/sofa-1.jpg',
        'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/products/sofa-1-side.jpg',
        'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/products/sofa-1-detail.jpg'
    ], -- MULTIPLE ANGLES
    (SELECT id FROM materials WHERE name = 'solid-wood'),
    jsonb_build_object(
        'length', '210cm',
        'width', '90cm',
        'height', '85cm',
        'seat_height', '45cm'
    ), -- YOUR DIMENSIONS
    true,
    true, -- Set to true if you want this on homepage
    true
);

-- Example Product 2: Add your next product
INSERT INTO products (
    name, 
    price, 
    description, 
    category_id,
    image_url,
    material_id,
    in_stock,
    featured,
    active
) VALUES (
    'YOUR SECOND PRODUCT NAME',
    15000.00,
    'YOUR DESCRIPTION',
    (SELECT id FROM main_categories WHERE name = 'dining'),
    'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/products/YOUR-IMAGE.jpg',
    (SELECT id FROM materials WHERE name = 'solid-wood'),
    true,
    false,
    true
);

-- Add more products by copying the template above

-- ============================================
-- STEP 6: Create Product Variants (Colors/Sizes)
-- ============================================
-- Only if your products come in different colors/sizes

-- Example: Sofa in different colors
INSERT INTO product_variants (
    product_id,
    size,
    color_id,
    sku,
    price,
    active
) VALUES
(
    (SELECT id FROM products WHERE name LIKE '%Classic Wooden Sofa%' LIMIT 1),
    'Standard',
    (SELECT id FROM colors WHERE name = 'Natural Wood'),
    'SOFA-3SEAT-NAT-001',
    28500.00,
    true
),
(
    (SELECT id FROM products WHERE name LIKE '%Classic Wooden Sofa%' LIMIT 1),
    'Standard',
    (SELECT id FROM colors WHERE name = 'Dark Walnut'),
    'SOFA-3SEAT-WALNUT-001',
    29500.00,
    true
);

-- ============================================
-- STEP 7: Add Initial Inventory
-- ============================================
-- Set starting stock levels for each variant at each warehouse

-- Get variant and warehouse IDs
DO $$
DECLARE
    v_sofa_natural_variant_id UUID;
    v_sofa_walnut_variant_id UUID;
    v_lorenzo_warehouse_id UUID := '11111111-1111-1111-1111-111111111111';
    v_oroquieta_warehouse_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
    -- Get variant IDs
    SELECT id INTO v_sofa_natural_variant_id 
    FROM product_variants 
    WHERE sku = 'SOFA-3SEAT-NAT-001';
    
    SELECT id INTO v_sofa_walnut_variant_id 
    FROM product_variants 
    WHERE sku = 'SOFA-3SEAT-WALNUT-001';
    
    -- Add stock to Lorenzo warehouse
    IF v_sofa_natural_variant_id IS NOT NULL THEN
        INSERT INTO warehouse_stock (variant_id, warehouse_id, quantity, reserved)
        VALUES (v_sofa_natural_variant_id, v_lorenzo_warehouse_id, 15, 0)
        ON CONFLICT (variant_id, warehouse_id) DO NOTHING;
        
        -- Add batch tracking (FIFO)
        INSERT INTO inventory_batches (
            warehouse_stock_id,
            batch_id,
            received_at,
            quantity,
            reserved,
            notes
        )
        SELECT 
            ws.id,
            'BATCH-JAN2026-001',
            NOW(),
            15,
            0,
            'Initial inventory - January 2026'
        FROM warehouse_stock ws
        WHERE ws.variant_id = v_sofa_natural_variant_id 
            AND ws.warehouse_id = v_lorenzo_warehouse_id
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Repeat for walnut variant
    IF v_sofa_walnut_variant_id IS NOT NULL THEN
        INSERT INTO warehouse_stock (variant_id, warehouse_id, quantity, reserved)
        VALUES (v_sofa_walnut_variant_id, v_lorenzo_warehouse_id, 10, 0)
        ON CONFLICT (variant_id, warehouse_id) DO NOTHING;
        
        INSERT INTO inventory_batches (
            warehouse_stock_id,
            batch_id,
            received_at,
            quantity,
            reserved,
            notes
        )
        SELECT 
            ws.id,
            'BATCH-JAN2026-002',
            NOW(),
            10,
            0,
            'Initial inventory - January 2026'
        FROM warehouse_stock ws
        WHERE ws.variant_id = v_sofa_walnut_variant_id 
            AND ws.warehouse_id = v_lorenzo_warehouse_id
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- STEP 8: Add Sample Coupons (Optional)
-- ============================================

INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_discount, expiry_date, usage_limit, is_active)
VALUES
('WELCOME2026', 'New customer welcome discount', 'percentage', 10.00, 5000.00, 2000.00, '2026-12-31', NULL, true),
('FIRST500', '₱500 off your first purchase', 'fixed', 500.00, 3000.00, NULL, '2026-06-30', 100, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify your data was inserted correctly

-- Check products
SELECT 
    p.name,
    p.price,
    mc.display_name as category,
    m.name as material,
    p.featured,
    p.in_stock
FROM products p
LEFT JOIN main_categories mc ON p.category_id = mc.id
LEFT JOIN materials m ON p.material_id = m.id
ORDER BY p.created_at DESC;

-- Check inventory levels
SELECT 
    p.name as product,
    pv.sku,
    c.name as color,
    w.name as warehouse,
    ws.quantity,
    ws.reserved,
    (ws.quantity - ws.reserved) as available
FROM warehouse_stock ws
JOIN product_variants pv ON ws.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
LEFT JOIN colors c ON pv.color_id = c.id
JOIN warehouses w ON ws.warehouse_id = w.id
ORDER BY p.name, w.name;

-- ============================================
-- NEXT STEPS
-- ============================================
-- 1. Upload your product images to Supabase Storage
-- 2. Replace all placeholder values above with real data
-- 3. Run this script in Supabase SQL Editor
-- 4. Verify using the queries at the bottom
-- 5. Your store is ready to go live! 🚀
