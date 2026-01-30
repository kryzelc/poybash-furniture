-- ============================================
-- Script 7: Create RLS Policies
-- ============================================
-- Run this after enabling RLS on all tables (Script 6)
-- These policies enforce role-based access control for all 20 tables

-- ============================================
-- HELPER FUNCTIONS FOR RLS (In public schema)
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
    SELECT role FROM public.users WHERE id = auth.uid() AND active = true
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Check if user is staff or above
CREATE OR REPLACE FUNCTION public.is_staff_or_above()
RETURNS boolean AS $$
    SELECT COALESCE(
        public.user_role() IN ('staff', 'inventory-clerk', 'admin', 'owner'),
        false
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Check if user is admin or owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean AS $$
    SELECT COALESCE(
        public.user_role() IN ('admin', 'owner'),
        false
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean AS $$
    SELECT COALESCE(
        public.user_role() = 'owner',
        false
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Check if user can manage inventory
CREATE OR REPLACE FUNCTION public.can_manage_inventory()
RETURNS boolean AS $$
    SELECT COALESCE(
        public.user_role() IN ('inventory-clerk', 'admin', 'owner'),
        false
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;


-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Everyone can view active users
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
CREATE POLICY "Users are viewable by authenticated users"
ON users FOR SELECT
TO authenticated
USING (active = true);

-- Users can update their own profile (but not their role)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid() 
    AND role = (SELECT role FROM users WHERE id = auth.uid())
);

-- Staff can create customer accounts
DROP POLICY IF EXISTS "Staff can create customer accounts" ON users;
CREATE POLICY "Staff can create customer accounts"
ON users FOR INSERT
TO authenticated
WITH CHECK (
    public.is_staff_or_above() 
    AND role = 'customer'
);

-- Admin can create staff and clerk accounts
DROP POLICY IF EXISTS "Admin can create staff accounts" ON users;
CREATE POLICY "Admin can create staff accounts"
ON users FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin_or_owner() 
    AND role IN ('staff', 'inventory-clerk')
);

-- Owner can create any account except owner
DROP POLICY IF EXISTS "Owner can create any account except owner" ON users;
CREATE POLICY "Owner can create any account except owner"
ON users FOR INSERT
TO authenticated
WITH CHECK (
    public.is_owner() 
    AND role IN ('customer', 'staff', 'inventory-clerk', 'admin')
);

-- Admin/Owner can update user accounts
DROP POLICY IF EXISTS "Admin can update users" ON users;
CREATE POLICY "Admin can update users"
ON users FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (
    CASE
        -- Owner can update anyone but cannot demote themselves
        WHEN public.is_owner() THEN (
            (id != auth.uid()) OR (id = auth.uid() AND role = 'owner')
        )
        -- Admin can only update non-admin/owner accounts
        WHEN public.user_role() = 'admin' THEN role NOT IN ('admin', 'owner')
        ELSE false
    END
);

-- Staff can update customer accounts
DROP POLICY IF EXISTS "Staff can update customer accounts" ON users;
CREATE POLICY "Staff can update customer accounts"
ON users FOR UPDATE
TO authenticated
USING (
    public.is_staff_or_above()
    AND role = 'customer'
)
WITH CHECK (
    public.is_staff_or_above()
    AND role = 'customer'
    AND id != auth.uid()
);

-- ============================================
-- ADDRESSES TABLE POLICIES
-- ============================================

-- Users can view their own addresses
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
CREATE POLICY "Users can view own addresses"
ON addresses FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND active = true);

-- Staff can view all addresses
DROP POLICY IF EXISTS "Staff can view all addresses" ON addresses;
CREATE POLICY "Staff can view all addresses"
ON addresses FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

-- Users can manage their own addresses
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
CREATE POLICY "Users can insert own addresses"
ON addresses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
CREATE POLICY "Users can update own addresses"
ON addresses FOR UPDATE
TO authenticated
USING (user_id = auth.uid());


-- ============================================
-- PRODUCT TAXONOMY POLICIES
-- ============================================

-- Categories viewable by everyone
DROP POLICY IF EXISTS "Categories viewable by everyone" ON main_categories;
CREATE POLICY "Categories viewable by everyone"
ON main_categories FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Staff can view all categories" ON main_categories;
CREATE POLICY "Staff can view all categories"
ON main_categories FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

DROP POLICY IF EXISTS "Admin can manage categories" ON main_categories;
CREATE POLICY "Admin can manage categories"
ON main_categories FOR ALL
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- Sub-categories (same pattern)
DROP POLICY IF EXISTS "Sub-categories viewable by everyone" ON sub_categories;
CREATE POLICY "Sub-categories viewable by everyone"
ON sub_categories FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Staff can view all sub-categories" ON sub_categories;
CREATE POLICY "Staff can view all sub-categories"
ON sub_categories FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

DROP POLICY IF EXISTS "Admin can manage sub-categories" ON sub_categories;
CREATE POLICY "Admin can manage sub-categories"
ON sub_categories FOR ALL
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- Materials
DROP POLICY IF EXISTS "Materials viewable by everyone" ON materials;
CREATE POLICY "Materials viewable by everyone"
ON materials FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Staff can view all materials" ON materials;
CREATE POLICY "Staff can view all materials"
ON materials FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

DROP POLICY IF EXISTS "Admin can manage materials" ON materials;
CREATE POLICY "Admin can manage materials"
ON materials FOR ALL
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- Colors
DROP POLICY IF EXISTS "Colors viewable by everyone" ON colors;
CREATE POLICY "Colors viewable by everyone"
ON colors FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Staff can view all colors" ON colors;
CREATE POLICY "Staff can view all colors"
ON colors FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

DROP POLICY IF EXISTS "Admin can manage colors" ON colors;
CREATE POLICY "Admin can manage colors"
ON colors FOR ALL
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- ============================================
-- PRODUCTS TABLE POLICIES
-- ============================================

-- Everyone can view active products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT
TO anon, authenticated
USING (active = true);

-- Staff can view all products
DROP POLICY IF EXISTS "Staff can view all products" ON products;
CREATE POLICY "Staff can view all products"
ON products FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

-- Only Admin/Owner can manage products
DROP POLICY IF EXISTS "Admin can insert products" ON products;
CREATE POLICY "Admin can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_owner());

DROP POLICY IF EXISTS "Admin can update products" ON products;
CREATE POLICY "Admin can update products"
ON products FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner());


-- ============================================
-- PRODUCT VARIANTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Variants are viewable by everyone" ON product_variants;
CREATE POLICY "Variants are viewable by everyone"
ON product_variants FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Staff can view all variants" ON product_variants;
CREATE POLICY "Staff can view all variants"
ON product_variants FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

DROP POLICY IF EXISTS "Admin can manage variants" ON product_variants;
CREATE POLICY "Admin can manage variants"
ON product_variants FOR ALL
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- ============================================
-- WAREHOUSE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Active warehouses are viewable by everyone" ON warehouses;
CREATE POLICY "Active warehouses are viewable by everyone"
ON warehouses FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "Staff can view all warehouses" ON warehouses;
CREATE POLICY "Staff can view all warehouses"
ON warehouses FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

DROP POLICY IF EXISTS "Admin can manage warehouses" ON warehouses;
CREATE POLICY "Admin can manage warehouses"
ON warehouses FOR ALL
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- ============================================
-- WAREHOUSE STOCK POLICIES
-- ============================================

DROP POLICY IF EXISTS "Stock is viewable by everyone" ON warehouse_stock;
CREATE POLICY "Stock is viewable by everyone"
ON warehouse_stock FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Inventory managers can update stock" ON warehouse_stock;
CREATE POLICY "Inventory managers can update stock"
ON warehouse_stock FOR UPDATE
TO authenticated
USING (public.can_manage_inventory())
WITH CHECK (public.can_manage_inventory());

DROP POLICY IF EXISTS "Inventory managers can insert stock" ON warehouse_stock;
CREATE POLICY "Inventory managers can insert stock"
ON warehouse_stock FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_inventory());

-- ============================================
-- INVENTORY BATCHES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Inventory managers can view batches" ON inventory_batches;
CREATE POLICY "Inventory managers can view batches"
ON inventory_batches FOR SELECT
TO authenticated
USING (public.can_manage_inventory());

DROP POLICY IF EXISTS "Inventory managers can insert batches" ON inventory_batches;
CREATE POLICY "Inventory managers can insert batches"
ON inventory_batches FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_inventory());

DROP POLICY IF EXISTS "Inventory managers can update batches" ON inventory_batches;
CREATE POLICY "Inventory managers can update batches"
ON inventory_batches FOR UPDATE
TO authenticated
USING (public.can_manage_inventory())
WITH CHECK (public.can_manage_inventory());


-- ============================================
-- ORDERS TABLE POLICIES
-- ============================================

-- Customers can view their own orders
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Staff can view all orders
DROP POLICY IF EXISTS "Staff can view all orders" ON orders;
CREATE POLICY "Staff can view all orders"
ON orders FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

-- Customers can place orders
DROP POLICY IF EXISTS "Customers can place orders" ON orders;
CREATE POLICY "Customers can place orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() 
    AND is_manual_order = false
);

-- Staff can create manual orders
DROP POLICY IF EXISTS "Staff can create manual orders" ON orders;
CREATE POLICY "Staff can create manual orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
    public.is_staff_or_above() 
    AND is_manual_order = true
);

-- Customers can cancel their pending orders
DROP POLICY IF EXISTS "Customers can cancel own pending orders" ON orders;
CREATE POLICY "Customers can cancel own pending orders"
ON orders FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() 
    AND status = 'pending'
)
WITH CHECK (
    user_id = auth.uid() 
    AND status = 'cancelled'
);

-- Staff can update order status forward only
DROP POLICY IF EXISTS "Staff can update order status forward" ON orders;
CREATE POLICY "Staff can update order status forward"
ON orders FOR UPDATE
TO authenticated
USING (public.user_role() IN ('staff', 'inventory-clerk'))
WITH CHECK (
    public.user_role() IN ('staff', 'inventory-clerk')
    AND (
        (status = 'pending' AND status IN ('confirmed', 'cancelled'))
        OR (status = 'confirmed' AND status = 'processing')
        OR (status = 'processing' AND status = 'ready')
        OR (status = 'ready' AND status = 'completed')
    )
);

-- Admin/Owner can update orders in any direction
DROP POLICY IF EXISTS "Admin can update orders any direction" ON orders;
CREATE POLICY "Admin can update orders any direction"
ON orders FOR UPDATE
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- ============================================
-- ORDER ITEMS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
TO authenticated
USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff can view all order items" ON order_items;
CREATE POLICY "Staff can view all order items"
ON order_items FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

DROP POLICY IF EXISTS "Order items created with order" ON order_items;
CREATE POLICY "Order items created with order"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    OR public.is_staff_or_above()
);

DROP POLICY IF EXISTS "Customers can request item refunds" ON order_items;
CREATE POLICY "Customers can request item refunds"
ON order_items FOR UPDATE
TO authenticated
USING (
    order_id IN (
        SELECT id FROM orders 
        WHERE user_id = auth.uid() 
        AND status = 'completed'
        AND public.is_within_refund_window(id)
    )
)
WITH CHECK (
    refund_requested = true 
    AND refund_status = 'requested'
);

DROP POLICY IF EXISTS "Staff can process refunds" ON order_items;
CREATE POLICY "Staff can process refunds"
ON order_items FOR UPDATE
TO authenticated
USING (public.is_staff_or_above())
WITH CHECK (public.is_staff_or_above());

-- ============================================
-- ORDER REFUNDS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Customers can view own refunds" ON order_refunds;
CREATE POLICY "Customers can view own refunds"
ON order_refunds FOR SELECT
TO authenticated
USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff can view all refunds" ON order_refunds;
CREATE POLICY "Staff can view all refunds"
ON order_refunds FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

DROP POLICY IF EXISTS "Staff can create refunds" ON order_refunds;
CREATE POLICY "Staff can create refunds"
ON order_refunds FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_above());

-- ============================================
-- COUPONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Active coupons are viewable" ON coupons;
CREATE POLICY "Active coupons are viewable"
ON coupons FOR SELECT
TO anon, authenticated
USING (is_active = true AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE));

DROP POLICY IF EXISTS "Admin can view all coupons" ON coupons;
CREATE POLICY "Admin can view all coupons"
ON coupons FOR SELECT
TO authenticated
USING (public.is_admin_or_owner());

DROP POLICY IF EXISTS "Admin can manage coupons" ON coupons;
CREATE POLICY "Admin can manage coupons"
ON coupons FOR ALL
TO authenticated
USING (public.is_admin_or_owner())
WITH CHECK (public.is_admin_or_owner());

-- ============================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================

-- ONLY Owner can view audit logs
DROP POLICY IF EXISTS "Only owner can view audit logs" ON audit_logs;
CREATE POLICY "Only owner can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (public.is_owner());

-- No direct inserts allowed
DROP POLICY IF EXISTS "No direct inserts to audit logs" ON audit_logs;
CREATE POLICY "No direct inserts to audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (false);

-- Audit logs are immutable
DROP POLICY IF EXISTS "Audit logs are immutable" ON audit_logs;
CREATE POLICY "Audit logs are immutable"
ON audit_logs FOR UPDATE
TO authenticated
USING (false);


-- ============================================
-- USER NOTIFICATIONS TABLE POLICIES
-- ============================================

-- Notifications can be viewed by the user they belong to
DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;
CREATE POLICY "Users can view own notifications"
ON user_notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Notifications don't have CRUD (System-only via triggers/functions)
-- No direct INSERT, UPDATE, or DELETE access for users or staff
-- but user can view their alert history as per standard UX.

-- ============================================
-- SHOPPING CARTS TABLE POLICIES
-- ============================================

-- Users can view their own cart
DROP POLICY IF EXISTS "Users can view own cart" ON shopping_carts;
CREATE POLICY "Users can view own cart"
ON shopping_carts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Anonymous users can view their session cart
DROP POLICY IF EXISTS "Anonymous users can view session cart" ON shopping_carts;
CREATE POLICY "Anonymous users can view session cart"
ON shopping_carts FOR SELECT
TO anon
USING (session_id IS NOT NULL);

-- Users can create their own cart
DROP POLICY IF EXISTS "Users can create own cart" ON shopping_carts;
CREATE POLICY "Users can create own cart"
ON shopping_carts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND session_id IS NULL);

-- Anonymous users can create session cart
DROP POLICY IF EXISTS "Anonymous users can create session cart" ON shopping_carts;
CREATE POLICY "Anonymous users can create session cart"
ON shopping_carts FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- Users can update their own cart
DROP POLICY IF EXISTS "Users can update own cart" ON shopping_carts;
CREATE POLICY "Users can update own cart"
ON shopping_carts FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Anonymous users can update session cart
DROP POLICY IF EXISTS "Anonymous users can update session cart" ON shopping_carts;
CREATE POLICY "Anonymous users can update session cart"
ON shopping_carts FOR UPDATE
TO anon
USING (session_id IS NOT NULL)
WITH CHECK (session_id IS NOT NULL);


-- Staff can view all carts (for support)
DROP POLICY IF EXISTS "Staff can view all carts" ON shopping_carts;
CREATE POLICY "Staff can view all carts"
ON shopping_carts FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

-- ============================================
-- CART ITEMS TABLE POLICIES
-- ============================================

-- Users can view items in their cart
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
CREATE POLICY "Users can view own cart items"
ON cart_items FOR SELECT
TO authenticated
USING (
    cart_id IN (SELECT id FROM shopping_carts WHERE user_id = auth.uid())
);

-- Anonymous users can view items in session cart
DROP POLICY IF EXISTS "Anonymous users can view session cart items" ON cart_items;
CREATE POLICY "Anonymous users can view session cart items"
ON cart_items FOR SELECT
TO anon
USING (
    cart_id IN (SELECT id FROM shopping_carts WHERE session_id IS NOT NULL)
);

-- Users can add items to their cart
DROP POLICY IF EXISTS "Users can add items to own cart" ON cart_items;
CREATE POLICY "Users can add items to own cart"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (
    cart_id IN (SELECT id FROM shopping_carts WHERE user_id = auth.uid())
);

-- Anonymous users can add items to session cart
DROP POLICY IF EXISTS "Anonymous users can add items to session cart" ON cart_items;
CREATE POLICY "Anonymous users can add items to session cart"
ON cart_items FOR INSERT
TO anon
WITH CHECK (
    cart_id IN (SELECT id FROM shopping_carts WHERE session_id IS NOT NULL)
);

-- Users can update items in their cart
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
CREATE POLICY "Users can update own cart items"
ON cart_items FOR UPDATE
TO authenticated
USING (
    cart_id IN (SELECT id FROM shopping_carts WHERE user_id = auth.uid())
)
WITH CHECK (
    cart_id IN (SELECT id FROM shopping_carts WHERE user_id = auth.uid())
);

-- Anonymous users can update items in session cart
DROP POLICY IF EXISTS "Anonymous users can update session cart items" ON cart_items;
CREATE POLICY "Anonymous users can update session cart items"
ON cart_items FOR UPDATE
TO anon
USING (
    cart_id IN (SELECT id FROM shopping_carts WHERE session_id IS NOT NULL)
)
WITH CHECK (
    cart_id IN (SELECT id FROM shopping_carts WHERE session_id IS NOT NULL)
);


-- Staff can view all cart items (for support)
DROP POLICY IF EXISTS "Staff can view all cart items" ON cart_items;
CREATE POLICY "Staff can view all cart items"
ON cart_items FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

-- ============================================
-- ORDER SHIPPING ADDRESSES TABLE POLICIES
-- ============================================

-- Customers can view shipping address for their own orders
DROP POLICY IF EXISTS "Customers can view own order shipping addresses" ON order_shipping_addresses;
CREATE POLICY "Customers can view own order shipping addresses"
ON order_shipping_addresses FOR SELECT
TO authenticated
USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

-- Staff can view all shipping addresses
DROP POLICY IF EXISTS "Staff can view all shipping addresses" ON order_shipping_addresses;
CREATE POLICY "Staff can view all shipping addresses"
ON order_shipping_addresses FOR SELECT
TO authenticated
USING (public.is_staff_or_above());

-- Shipping address created with order
DROP POLICY IF EXISTS "Shipping address created with order" ON order_shipping_addresses;
CREATE POLICY "Shipping address created with order"
ON order_shipping_addresses FOR INSERT
TO authenticated
WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    OR public.is_staff_or_above()
);

-- Only staff can update shipping addresses (for corrections)
DROP POLICY IF EXISTS "Staff can update shipping addresses" ON order_shipping_addresses;
CREATE POLICY "Staff can update shipping addresses"
ON order_shipping_addresses FOR UPDATE
TO authenticated
USING (public.is_staff_or_above())
WITH CHECK (public.is_staff_or_above());
