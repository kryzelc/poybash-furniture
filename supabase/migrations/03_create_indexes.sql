-- ============================================
-- Script 3: Create Indexes for Performance
-- ============================================
-- Run this after creating tables
-- These indexes optimize common query patterns

-- ============================================
-- USER AND AUTHENTICATION INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role, active);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- ============================================
-- PRODUCT INDEXES (CRITICAL for browsing)
-- ============================================

CREATE INDEX idx_products_category_active ON products(category_id, active);
CREATE INDEX idx_products_sub_category_active ON products(sub_category_id, active);
CREATE INDEX idx_products_featured_active ON products(featured, active) WHERE featured = true;
CREATE INDEX idx_products_in_stock ON products(in_stock, active) WHERE in_stock = true;

-- Product Variants
CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_color_id ON product_variants(color_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

-- ============================================
-- ORDER INDEXES (CRITICAL for dashboard)
-- ============================================

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status) WHERE payment_status = 'pending';

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

-- Refund status indexes (CRITICAL for dashboard filtering)
CREATE INDEX idx_order_items_refund_requested ON order_items(refund_status, updated_at DESC) 
    WHERE refund_status = 'requested';
CREATE INDEX idx_order_items_refund_under_review ON order_items(refund_status, updated_at DESC) 
    WHERE refund_status = 'under_review';
CREATE INDEX idx_order_items_refund_status_all ON order_items(refund_status, updated_at DESC) 
    WHERE refund_status IS NOT NULL;

-- Order Refunds
CREATE INDEX idx_order_refunds_order_id ON order_refunds(order_id);
CREATE INDEX idx_order_refunds_processed_by ON order_refunds(processed_by);

-- ============================================
-- INVENTORY INDEXES (CRITICAL for stock checks)
-- ============================================

CREATE INDEX idx_warehouse_stock_variant ON warehouse_stock(variant_id);
CREATE INDEX idx_warehouse_stock_warehouse ON warehouse_stock(warehouse_id);
CREATE INDEX idx_warehouse_stock_variant_warehouse ON warehouse_stock(variant_id, warehouse_id);

-- Inventory Batches (CRITICAL for FIFO)
CREATE INDEX idx_batches_warehouse_stock_received ON inventory_batches(warehouse_stock_id, received_at ASC);
CREATE INDEX idx_batches_available ON inventory_batches(warehouse_stock_id) WHERE available > 0;

-- ============================================
-- COUPON INDEXES
-- ============================================

CREATE INDEX idx_coupons_code_active ON coupons(code, is_active);
CREATE INDEX idx_coupons_active_expiry ON coupons(is_active, expiry_date) WHERE is_active = true;

-- ============================================
-- AUDIT LOG INDEXES (CRITICAL for owner queries)
-- ============================================

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_performed_by ON audit_logs(performed_by, timestamp DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action_type ON audit_logs(action_type, timestamp DESC);

-- ============================================
-- NOTIFICATION INDEXES
-- ============================================

CREATE INDEX idx_notifications_user_read ON user_notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_unread ON user_notifications(user_id, created_at DESC) WHERE read = false;

-- ============================================
-- COMPOSITE INDEXES (CRITICAL FOR PERFORMANCE)
-- ============================================

-- Order queries by user and status (VERY common pattern)
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at DESC);

-- Product browsing with filters
CREATE INDEX idx_products_category_featured_active ON products(category_id, featured, active) 
    WHERE active = true;
CREATE INDEX idx_products_material_active ON products(material_id, active) 
    WHERE active = true;

-- Variant lookups by product and color
CREATE INDEX idx_variants_product_color ON product_variants(product_id, color_id) 
    WHERE active = true;

-- Stock lookups (critical for checkout)
CREATE INDEX idx_warehouse_stock_variant_available ON warehouse_stock(variant_id, (quantity - reserved)) 
    WHERE (quantity - reserved) > 0;

-- Refund queries (dashboard filtering by status)
CREATE INDEX idx_order_items_order_refund ON order_items(order_id, refund_status, updated_at DESC) 
    WHERE refund_status IS NOT NULL;

-- Coupon validation (high traffic)
CREATE INDEX idx_coupons_code_active_expiry ON coupons(code, is_active, expiry_date) 
    WHERE is_active = true;

-- Audit log queries by date range
CREATE INDEX idx_audit_logs_timestamp_action ON audit_logs(timestamp DESC, action_type);
CREATE INDEX idx_audit_logs_entity_timestamp ON audit_logs(entity_type, entity_id, timestamp DESC);

-- ============================================
-- FOREIGN KEY INDEXES (CRITICAL FOR JOINS)
-- ============================================

-- Every FK should have an index for fast JOINs and DELETEs
CREATE INDEX idx_sub_categories_category_id ON sub_categories(category_id);
CREATE INDEX idx_products_material_id ON products(material_id);
CREATE INDEX idx_order_items_warehouse_source ON order_items(warehouse_source);
CREATE INDEX idx_order_shipping_addresses_order_id ON order_shipping_addresses(order_id);

-- ============================================
-- SHOPPING CART INDEXES
-- ============================================

CREATE INDEX idx_carts_user_id ON shopping_carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_carts_session_id ON shopping_carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_carts_expires_at ON shopping_carts(expires_at);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_variant_id ON cart_items(variant_id);
