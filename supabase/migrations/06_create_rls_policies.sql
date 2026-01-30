-- ============================================
-- Script 6: Create RLS Policies
-- ============================================
-- Run this after enabling RLS on all tables
-- These policies enforce role-based access control

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
    SELECT role FROM public.users WHERE id = auth.uid() AND active = true
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is staff or above
CREATE OR REPLACE FUNCTION auth.is_staff_or_above()
RETURNS boolean AS $$
    SELECT COALESCE(
        auth.user_role() IN ('staff', 'inventory-clerk', 'admin', 'owner'),
        false
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is admin or owner
CREATE OR REPLACE FUNCTION auth.is_admin_or_owner()
RETURNS boolean AS $$
    SELECT COALESCE(
        auth.user_role() IN ('admin', 'owner'),
        false
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is owner
CREATE OR REPLACE FUNCTION auth.is_owner()
RETURNS boolean AS $$
    SELECT COALESCE(
        auth.user_role() = 'owner',
        false
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user can manage inventory
CREATE OR REPLACE FUNCTION auth.can_manage_inventory()
RETURNS boolean AS $$
    SELECT COALESCE(
        auth.user_role() IN ('inventory-clerk', 'admin', 'owner'),
        false
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Everyone can view active users
CREATE POLICY "Users are viewable by authenticated users"
ON users FOR SELECT
TO authenticated
USING (active = true);

-- Users can update their own profile (but not their role)
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid() 
    AND role = (SELECT role FROM users WHERE id = auth.uid())
);

-- Staff can create customer accounts
CREATE POLICY "Staff can create customer accounts"
ON users FOR INSERT
TO authenticated
WITH CHECK (
    auth.is_staff_or_above() 
    AND NEW.role = 'customer'
);

-- Admin can create staff and clerk accounts
CREATE POLICY "Admin can create staff accounts"
ON users FOR INSERT
TO authenticated
WITH CHECK (
    auth.is_admin_or_owner() 
    AND NEW.role IN ('customer', 'staff', 'inventory-clerk')
);

-- Owner can create any account
CREATE POLICY "Owner can create any account"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.is_owner());

-- Admin/Owner can update user accounts
CREATE POLICY "Admin can update users"
ON users FOR UPDATE
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (
    CASE
        WHEN auth.is_owner() THEN true
        WHEN auth.user_role() = 'admin' THEN NEW.role NOT IN ('admin', 'owner')
        ELSE false
    END
);

-- ============================================
-- ADDRESSES TABLE POLICIES
-- ============================================

-- Users can view their own addresses
CREATE POLICY "Users can view own addresses"
ON addresses FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND active = true);

-- Staff can view all addresses
CREATE POLICY "Staff can view all addresses"
ON addresses FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

-- Users can manage their own addresses
CREATE POLICY "Users can insert own addresses"
ON addresses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
ON addresses FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
ON addresses FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- PRODUCT TAXONOMY POLICIES
-- ============================================

-- Categories viewable by everyone
CREATE POLICY "Categories viewable by everyone"
ON main_categories FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Staff can view all categories"
ON main_categories FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

CREATE POLICY "Admin can manage categories"
ON main_categories FOR ALL
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (auth.is_admin_or_owner());

-- Sub-categories (same pattern)
CREATE POLICY "Sub-categories viewable by everyone"
ON sub_categories FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Staff can view all sub-categories"
ON sub_categories FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

CREATE POLICY "Admin can manage sub-categories"
ON sub_categories FOR ALL
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (auth.is_admin_or_owner());

-- Materials
CREATE POLICY "Materials viewable by everyone"
ON materials FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Staff can view all materials"
ON materials FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

CREATE POLICY "Admin can manage materials"
ON materials FOR ALL
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (auth.is_admin_or_owner());

-- Colors
CREATE POLICY "Colors viewable by everyone"
ON colors FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Staff can view all colors"
ON colors FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

CREATE POLICY "Admin can manage colors"
ON colors FOR ALL
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (auth.is_admin_or_owner());

-- ============================================
-- PRODUCTS TABLE POLICIES
-- ============================================

-- Everyone can view active products
CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT
TO anon, authenticated
USING (active = true);

-- Staff can view all products
CREATE POLICY "Staff can view all products"
ON products FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

-- Only Admin/Owner can manage products
CREATE POLICY "Admin can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (auth.is_admin_or_owner());

CREATE POLICY "Admin can update products"
ON products FOR UPDATE
TO authenticated
USING (auth.is_admin_or_owner());

CREATE POLICY "Admin can delete products"
ON products FOR DELETE
TO authenticated
USING (auth.is_admin_or_owner());

-- ============================================
-- PRODUCT VARIANTS TABLE POLICIES
-- ============================================

CREATE POLICY "Variants are viewable by everyone"
ON product_variants FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Staff can view all variants"
ON product_variants FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

CREATE POLICY "Admin can manage variants"
ON product_variants FOR ALL
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (auth.is_admin_or_owner());

-- ============================================
-- WAREHOUSE POLICIES
-- ============================================

CREATE POLICY "Active warehouses are viewable by everyone"
ON warehouses FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Staff can view all warehouses"
ON warehouses FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

CREATE POLICY "Admin can manage warehouses"
ON warehouses FOR ALL
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (auth.is_admin_or_owner());

-- ============================================
-- WAREHOUSE STOCK POLICIES
-- ============================================

CREATE POLICY "Stock is viewable by everyone"
ON warehouse_stock FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Inventory managers can update stock"
ON warehouse_stock FOR UPDATE
TO authenticated
USING (auth.can_manage_inventory())
WITH CHECK (auth.can_manage_inventory());

CREATE POLICY "Inventory managers can insert stock"
ON warehouse_stock FOR INSERT
TO authenticated
WITH CHECK (auth.can_manage_inventory());

-- ============================================
-- INVENTORY BATCHES POLICIES
-- ============================================

CREATE POLICY "Inventory managers can view batches"
ON inventory_batches FOR SELECT
TO authenticated
USING (auth.can_manage_inventory());

CREATE POLICY "Inventory managers can insert batches"
ON inventory_batches FOR INSERT
TO authenticated
WITH CHECK (auth.can_manage_inventory());

CREATE POLICY "Inventory managers can update batches"
ON inventory_batches FOR UPDATE
TO authenticated
USING (auth.can_manage_inventory())
WITH CHECK (auth.can_manage_inventory());

CREATE POLICY "Inventory managers can delete batches"
ON inventory_batches FOR DELETE
TO authenticated
USING (auth.can_manage_inventory());

-- ============================================
-- ORDERS TABLE POLICIES
-- ============================================

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Staff can view all orders
CREATE POLICY "Staff can view all orders"
ON orders FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

-- Customers can place orders
CREATE POLICY "Customers can place orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() 
    AND is_manual_order = false
);

-- Staff can create manual orders
CREATE POLICY "Staff can create manual orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
    auth.is_staff_or_above() 
    AND is_manual_order = true
);

-- Customers can cancel their pending orders
CREATE POLICY "Customers can cancel own pending orders"
ON orders FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() 
    AND status = 'pending'
)
WITH CHECK (
    user_id = auth.uid() 
    AND NEW.status = 'cancelled'
);

-- Staff can update order status forward only
CREATE POLICY "Staff can update order status forward"
ON orders FOR UPDATE
TO authenticated
USING (auth.user_role() IN ('staff', 'inventory-clerk'))
WITH CHECK (
    auth.user_role() IN ('staff', 'inventory-clerk')
    AND (
        (status = 'pending' AND NEW.status IN ('confirmed', 'cancelled'))
        OR (status = 'confirmed' AND NEW.status = 'processing')
        OR (status = 'processing' AND NEW.status = 'ready')
        OR (status = 'ready' AND NEW.status = 'completed')
    )
);

-- Admin/Owner can update orders in any direction
CREATE POLICY "Admin can update orders any direction"
ON orders FOR UPDATE
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (auth.is_admin_or_owner());

-- ============================================
-- ORDER ITEMS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
TO authenticated
USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

CREATE POLICY "Staff can view all order items"
ON order_items FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

CREATE POLICY "Order items created with order"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    OR auth.is_staff_or_above()
);

CREATE POLICY "Customers can request item refunds"
ON order_items FOR UPDATE
TO authenticated
USING (
    order_id IN (
        SELECT id FROM orders 
        WHERE user_id = auth.uid() 
        AND status = 'completed'
    )
)
WITH CHECK (
    refund_requested = true 
    AND refund_status = 'pending'
);

CREATE POLICY "Staff can process refunds"
ON order_items FOR UPDATE
TO authenticated
USING (auth.is_staff_or_above())
WITH CHECK (auth.is_staff_or_above());

-- ============================================
-- ORDER REFUNDS TABLE POLICIES
-- ============================================

CREATE POLICY "Customers can view own refunds"
ON order_refunds FOR SELECT
TO authenticated
USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

CREATE POLICY "Staff can view all refunds"
ON order_refunds FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

CREATE POLICY "Staff can create refunds"
ON order_refunds FOR INSERT
TO authenticated
WITH CHECK (auth.is_staff_or_above());

-- ============================================
-- COUPONS TABLE POLICIES
-- ============================================

CREATE POLICY "Active coupons are viewable"
ON coupons FOR SELECT
TO anon, authenticated
USING (is_active = true AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE));

CREATE POLICY "Admin can view all coupons"
ON coupons FOR SELECT
TO authenticated
USING (auth.is_admin_or_owner());

CREATE POLICY "Admin can manage coupons"
ON coupons FOR ALL
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (auth.is_admin_or_owner());

-- ============================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================

-- ONLY Owner can view audit logs
CREATE POLICY "Only owner can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (auth.is_owner());

-- No direct inserts allowed
CREATE POLICY "No direct inserts to audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (false);

-- Only owner can delete old logs
CREATE POLICY "Only owner can delete audit logs"
ON audit_logs FOR DELETE
TO authenticated
USING (auth.is_owner());

-- Audit logs are immutable
CREATE POLICY "Audit logs are immutable"
ON audit_logs FOR UPDATE
TO authenticated
USING (false);

-- ============================================
-- USER NOTIFICATIONS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own notifications"
ON user_notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON user_notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can insert notifications"
ON user_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.is_staff_or_above());
