-- ============================================
-- Script 8: Seed Sample Data
-- ============================================
-- Run this after seeding users
-- Creates sample products, categories, and inventory

-- ============================================
-- WAREHOUSES
-- ============================================

INSERT INTO warehouses (id, name, address, active) VALUES
('10000000-0000-0000-0000-000000000001'::uuid, 'Lorenzo Warehouse', 'Lorenzo, Ozamiz City', true),
('10000000-0000-0000-0000-000000000002'::uuid, 'Oroquieta Warehouse', 'Oroquieta City, Misamis Occidental', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PRODUCT TAXONOMY
-- ============================================

-- Main Categories
INSERT INTO main_categories (id, name, display_name, description, active) VALUES
('20000000-0000-0000-0000-000000000001'::uuid, 'living-room', 'Living Room', 'Furniture for your living space', true),
('20000000-0000-0000-0000-000000000002'::uuid, 'bedroom', 'Bedroom', 'Bedroom furniture and accessories', true),
('20000000-0000-0000-0000-000000000003'::uuid, 'dining', 'Dining', 'Dining tables and chairs', true),
('20000000-0000-0000-0000-000000000004'::uuid, 'office', 'Office', 'Home office furniture', true),
('20000000-0000-0000-0000-000000000005'::uuid, 'outdoor', 'Outdoor', 'Outdoor and patio furniture', true)
ON CONFLICT (name) DO NOTHING;

-- Sub Categories
INSERT INTO sub_categories (id, category_id, name, description, active) VALUES
('21000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'Sofas', 'Comfortable sofas and couches', true),
('21000000-0000-0000-0000-000000000002'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'Coffee Tables', 'Living room tables', true),
('21000000-0000-0000-0000-000000000003'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'Beds', 'Bed frames and headboards', true),
('21000000-0000-0000-0000-000000000004'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'Wardrobes', 'Closets and storage', true),
('21000000-0000-0000-0000-000000000005'::uuid, '20000000-0000-0000-0000-000000000003'::uuid, 'Dining Tables', 'Tables for dining', true),
('21000000-0000-0000-0000-000000000006'::uuid, '20000000-0000-0000-0000-000000000003'::uuid, 'Dining Chairs', 'Chairs for dining', true)
ON CONFLICT DO NOTHING;

-- Materials
INSERT INTO materials (id, name, description, active) VALUES
('30000000-0000-0000-0000-000000000001'::uuid, 'Solid Wood', 'Premium solid wood construction', true),
('30000000-0000-0000-0000-000000000002'::uuid, 'Engineered Wood', 'Durable engineered wood', true),
('30000000-0000-0000-0000-000000000003'::uuid, 'Metal', 'Steel and metal frames', true),
('30000000-0000-0000-0000-000000000004'::uuid, 'Fabric', 'Upholstered fabric', true),
('30000000-0000-0000-0000-000000000005'::uuid, 'Leather', 'Genuine and faux leather', true),
('30000000-0000-0000-0000-000000000006'::uuid, 'Rattan', 'Natural rattan weave', true)
ON CONFLICT (name) DO NOTHING;

-- Colors
INSERT INTO colors (id, name, hex_code, active) VALUES
('40000000-0000-0000-0000-000000000001'::uuid, 'Natural Wood', '#D2B48C', true),
('40000000-0000-0000-0000-000000000002'::uuid, 'Walnut', '#5C4033', true),
('40000000-0000-0000-0000-000000000003'::uuid, 'White', '#FFFFFF', true),
('40000000-0000-0000-0000-000000000004'::uuid, 'Black', '#000000', true),
('40000000-0000-0000-0000-000000000005'::uuid, 'Gray', '#808080', true),
('40000000-0000-0000-0000-000000000006'::uuid, 'Beige', '#F5F5DC', true),
('40000000-0000-0000-0000-000000000007'::uuid, 'Navy Blue', '#000080', true),
('40000000-0000-0000-0000-000000000008'::uuid, 'Brown', '#8B4513', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SAMPLE PRODUCTS
-- ============================================

-- Product 1: Modern Sofa
INSERT INTO products (id, name, price, description, category_id, sub_category_id, material_id, in_stock, featured, active, dimensions) VALUES
(1, 'Modern 3-Seater Sofa', 25999.00, 'Comfortable modern sofa with premium fabric upholstery', 
 '20000000-0000-0000-0000-000000000001'::uuid, 
 '21000000-0000-0000-0000-000000000001'::uuid,
 '30000000-0000-0000-0000-000000000004'::uuid,
 true, true, true,
 '{"width": "210cm", "depth": "90cm", "height": "85cm"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Product 2: Coffee Table
INSERT INTO products (id, name, price, description, category_id, sub_category_id, material_id, in_stock, featured, active, dimensions) VALUES
(2, 'Minimalist Coffee Table', 8999.00, 'Sleek wooden coffee table with storage', 
 '20000000-0000-0000-0000-000000000001'::uuid, 
 '21000000-0000-0000-0000-000000000002'::uuid,
 '30000000-0000-0000-0000-000000000001'::uuid,
 true, true, true,
 '{"width": "120cm", "depth": "60cm", "height": "45cm"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Product 3: Queen Bed Frame
INSERT INTO products (id, name, price, description, category_id, sub_category_id, material_id, in_stock, featured, active, dimensions) VALUES
(3, 'Queen Size Bed Frame', 18999.00, 'Solid wood queen bed frame with headboard', 
 '20000000-0000-0000-0000-000000000002'::uuid, 
 '21000000-0000-0000-0000-000000000003'::uuid,
 '30000000-0000-0000-0000-000000000001'::uuid,
 true, true, true,
 '{"width": "160cm", "length": "200cm", "height": "120cm"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Product 4: Dining Table
INSERT INTO products (id, name, price, description, category_id, sub_category_id, material_id, in_stock, featured, active, dimensions) VALUES
(4, '6-Seater Dining Table', 22999.00, 'Elegant wooden dining table for 6 people', 
 '20000000-0000-0000-0000-000000000003'::uuid, 
 '21000000-0000-0000-0000-000000000005'::uuid,
 '30000000-0000-0000-0000-000000000001'::uuid,
 true, false, true,
 '{"width": "180cm", "depth": "90cm", "height": "75cm"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Product 5: Dining Chair
INSERT INTO products (id, name, price, description, category_id, sub_category_id, material_id, in_stock, featured, active, dimensions) VALUES
(5, 'Upholstered Dining Chair', 3999.00, 'Comfortable padded dining chair', 
 '20000000-0000-0000-0000-000000000003'::uuid, 
 '21000000-0000-0000-0000-000000000006'::uuid,
 '30000000-0000-0000-0000-000000000004'::uuid,
 true, false, true,
 '{"width": "45cm", "depth": "50cm", "height": "95cm"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PRODUCT VARIANTS
-- ============================================

-- Sofa variants
INSERT INTO product_variants (id, product_id, size, color_id, sku, price, active) VALUES
('50000000-0000-0000-0000-000000000001'::uuid, 1, 'Standard', '40000000-0000-0000-0000-000000000005'::uuid, 'SOFA-MOD-GRAY-STD', 25999.00, true),
('50000000-0000-0000-0000-000000000002'::uuid, 1, 'Standard', '40000000-0000-0000-0000-000000000007'::uuid, 'SOFA-MOD-NAVY-STD', 25999.00, true),
('50000000-0000-0000-0000-000000000003'::uuid, 1, 'Standard', '40000000-0000-0000-0000-000000000006'::uuid, 'SOFA-MOD-BEIGE-STD', 25999.00, true)
ON CONFLICT (sku) DO NOTHING;

-- Coffee table variants
INSERT INTO product_variants (id, product_id, size, color_id, sku, price, active) VALUES
('50000000-0000-0000-0000-000000000004'::uuid, 2, 'Standard', '40000000-0000-0000-0000-000000000001'::uuid, 'TABLE-COF-NAT-STD', 8999.00, true),
('50000000-0000-0000-0000-000000000005'::uuid, 2, 'Standard', '40000000-0000-0000-0000-000000000002'::uuid, 'TABLE-COF-WAL-STD', 8999.00, true)
ON CONFLICT (sku) DO NOTHING;

-- Bed frame variants
INSERT INTO product_variants (id, product_id, size, color_id, sku, price, active) VALUES
('50000000-0000-0000-0000-000000000006'::uuid, 3, 'Queen', '40000000-0000-0000-0000-000000000001'::uuid, 'BED-QUEEN-NAT', 18999.00, true),
('50000000-0000-0000-0000-000000000007'::uuid, 3, 'Queen', '40000000-0000-0000-0000-000000000002'::uuid, 'BED-QUEEN-WAL', 18999.00, true)
ON CONFLICT (sku) DO NOTHING;

-- Dining table variants
INSERT INTO product_variants (id, product_id, size, color_id, sku, price, active) VALUES
('50000000-0000-0000-0000-000000000008'::uuid, 4, '6-Seater', '40000000-0000-0000-0000-000000000001'::uuid, 'TABLE-DIN-NAT-6', 22999.00, true),
('50000000-0000-0000-0000-000000000009'::uuid, 4, '6-Seater', '40000000-0000-0000-0000-000000000002'::uuid, 'TABLE-DIN-WAL-6', 22999.00, true)
ON CONFLICT (sku) DO NOTHING;

-- Dining chair variants
INSERT INTO product_variants (id, product_id, size, color_id, sku, price, active) VALUES
('50000000-0000-0000-0000-000000000010'::uuid, 5, 'Standard', '40000000-0000-0000-0000-000000000005'::uuid, 'CHAIR-DIN-GRAY-STD', 3999.00, true),
('50000000-0000-0000-0000-000000000011'::uuid, 5, 'Standard', '40000000-0000-0000-0000-000000000006'::uuid, 'CHAIR-DIN-BEIGE-STD', 3999.00, true),
('50000000-0000-0000-0000-000000000012'::uuid, 5, 'Standard', '40000000-0000-0000-0000-000000000008'::uuid, 'CHAIR-DIN-BROWN-STD', 3999.00, true)
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- WAREHOUSE STOCK
-- ============================================

-- Lorenzo Warehouse stock
INSERT INTO warehouse_stock (variant_id, warehouse_id, quantity, reserved) VALUES
('50000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 15, 0),
('50000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 10, 0),
('50000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 12, 0),
('50000000-0000-0000-0000-000000000004'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 25, 0),
('50000000-0000-0000-0000-000000000005'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 20, 0),
('50000000-0000-0000-0000-000000000006'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 8, 0),
('50000000-0000-0000-0000-000000000007'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 6, 0),
('50000000-0000-0000-0000-000000000008'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 5, 0),
('50000000-0000-0000-0000-000000000009'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 4, 0),
('50000000-0000-0000-0000-000000000010'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 50, 0),
('50000000-0000-0000-0000-000000000011'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 45, 0),
('50000000-0000-0000-0000-000000000012'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 40, 0)
ON CONFLICT (variant_id, warehouse_id) DO NOTHING;

-- Oroquieta Warehouse stock
INSERT INTO warehouse_stock (variant_id, warehouse_id, quantity, reserved) VALUES
('50000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 10, 0),
('50000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 8, 0),
('50000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 7, 0),
('50000000-0000-0000-0000-000000000004'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 18, 0),
('50000000-0000-0000-0000-000000000005'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 15, 0),
('50000000-0000-0000-0000-000000000006'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 5, 0),
('50000000-0000-0000-0000-000000000007'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 4, 0),
('50000000-0000-0000-0000-000000000008'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 3, 0),
('50000000-0000-0000-0000-000000000009'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 2, 0),
('50000000-0000-0000-0000-000000000010'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 35, 0),
('50000000-0000-0000-0000-000000000011'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 30, 0),
('50000000-0000-0000-0000-000000000012'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 28, 0)
ON CONFLICT (variant_id, warehouse_id) DO NOTHING;

-- ============================================
-- SAMPLE COUPONS
-- ============================================

INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_discount, expiry_date, usage_limit, is_active) VALUES
('WELCOME10', '10% off for new customers', 'percentage', 10, 5000, 2000, CURRENT_DATE + INTERVAL '30 days', 100, true),
('SAVE500', '₱500 off on orders above ₱10,000', 'fixed', 500, 10000, NULL, CURRENT_DATE + INTERVAL '60 days', 50, true),
('FREESHIP', 'Free shipping on all orders', 'fixed', 0, 0, NULL, CURRENT_DATE + INTERVAL '90 days', NULL, true)
ON CONFLICT (code) DO NOTHING;
