-- ============================================
-- Script 2: Create Tables and Schema
-- ============================================
-- Run this after creating custom types
-- Creates all tables with their columns and basic constraints

-- ============================================
-- USER AND AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) CHECK (phone ~* '^[+0-9() -]+$'),
    role user_role NOT NULL DEFAULT 'customer',
    active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    barangay VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Philippines',
    phone VARCHAR(20) NOT NULL CHECK (phone ~* '^[+0-9() -]+$'),
    is_default BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS AND TAXONOMY
-- ============================================

CREATE TABLE main_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES main_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    hex_code VARCHAR(7),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    category_id UUID REFERENCES main_categories(id) ON DELETE RESTRICT,
    sub_category_id UUID REFERENCES sub_categories(id) ON DELETE RESTRICT,
    image_url TEXT,
    images TEXT[],
    material_id UUID REFERENCES materials(id) ON DELETE RESTRICT,
    dimensions JSONB,
    in_stock BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(50),
    color_id UUID REFERENCES colors(id) ON DELETE RESTRICT,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10, 2) CHECK (price >= 0),
    dimensions JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (product_id, size, color_id)
);

-- ============================================
-- INVENTORY AND WAREHOUSES
-- ============================================

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE warehouse_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= quantity),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (variant_id, warehouse_id)
);

CREATE TABLE inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_stock_id UUID NOT NULL REFERENCES warehouse_stock(id) ON DELETE CASCADE,
    batch_id VARCHAR(100),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= quantity),
    available INTEGER GENERATED ALWAYS AS (quantity - reserved) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (reserved <= quantity)
);

-- ============================================
-- COUPONS
-- ============================================

CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    min_purchase DECIMAL(10, 2) DEFAULT 0 CHECK (min_purchase >= 0),
    max_discount DECIMAL(10, 2),
    expiry_date DATE,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (discount_type = 'percentage' AND discount_value <= 100) OR
        discount_type = 'fixed'
    ),
    CHECK (usage_limit IS NULL OR used_count <= usage_limit)
);

-- ============================================
-- SHOPPING CART
-- ============================================

CREATE TABLE shopping_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    CONSTRAINT cart_user_or_session CHECK (
        (user_id IS NOT NULL AND session_id IS NULL) OR
        (user_id IS NULL AND session_id IS NOT NULL)
    )
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cart_id, variant_id)
);

-- ============================================
-- ORDERS AND TRANSACTIONS
-- ============================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee DECIMAL(10, 2) DEFAULT 0 CHECK (delivery_fee >= 0),
    coupon_discount DECIMAL(10, 2) DEFAULT 0 CHECK (coupon_discount >= 0),
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    is_reservation BOOLEAN DEFAULT false,
    reservation_fee DECIMAL(10, 2),
    reservation_percentage INTEGER,
    fulfillment fulfillment_type NOT NULL,
    pickup_details JSONB,
    shipping_address JSONB,
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    payment_proof TEXT,
    payment_details JSONB,
    payment_verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_manual_order BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (is_reservation = false AND reservation_fee IS NULL AND reservation_percentage IS NULL) OR
        (is_reservation = true AND reservation_fee >= 0 AND reservation_percentage BETWEEN 1 AND 100)
    )
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- References (can be NULL if product deleted)
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- SNAPSHOT: Complete product data at time of purchase (immutable)
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    
    -- SNAPSHOT: Variant details
    size VARCHAR(50),
    color_name VARCHAR(50),
    color_hex VARCHAR(7),
    material_name VARCHAR(100),
    dimensions JSONB,
    
    -- SNAPSHOT: Category for historical reporting
    category_name VARCHAR(100),
    sub_category_name VARCHAR(100),
    
    -- Display
    image_url TEXT,
    
    -- Fulfillment
    warehouse_source UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    
    -- Refunds
    refund_requested BOOLEAN DEFAULT false,
    refund_reason TEXT,
    refund_status refund_status,
    refund_proof TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_by_name VARCHAR(200),
    processed_at TIMESTAMPTZ,
    refund_method refund_method,
    refund_amount DECIMAL(10, 2),
    refund_reason TEXT,
    refund_proof TEXT,
    admin_notes TEXT,
    items_refunded UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_shipping_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    barangay VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Philippines',
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGGING
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action_type VARCHAR(100) NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    performer_info JSONB,
    entity_type VARCHAR(100),
    entity_id UUID,
    entity_name VARCHAR(255),
    previous_value JSONB,
    new_value JSONB,
    order_number VARCHAR(50),
    product_sku VARCHAR(100),
    coupon_code VARCHAR(50),
    notes TEXT,
    ip_address INET,
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_main_categories_updated_at BEFORE UPDATE ON main_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_categories_updated_at BEFORE UPDATE ON sub_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_colors_updated_at BEFORE UPDATE ON colors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON user_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ORDER COMPLETION TRACKING
-- ============================================

-- Function to set completed_at when order status changes to 'completed'
CREATE OR REPLACE FUNCTION set_order_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is changing to 'completed' and completed_at is not set
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.completed_at IS NULL THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_set_order_completed_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_order_completed_at();

-- ============================================
-- PRICE VALIDATION (SECURITY)
-- ============================================

-- Validate order total matches items (prevents price manipulation)
CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
    v_calculated_subtotal DECIMAL(10, 2);
BEGIN
    -- Calculate subtotal from order items
    SELECT COALESCE(SUM(price * quantity), 0) INTO v_calculated_subtotal
    FROM order_items
    WHERE order_id = NEW.id;
    
    -- Validate subtotal matches (allow 1 cent rounding difference)
    IF ABS(v_calculated_subtotal - NEW.subtotal) > 0.01 THEN
        RAISE EXCEPTION 'Order subtotal mismatch. Expected: %, Got: %', 
            v_calculated_subtotal, NEW.subtotal;
    END IF;
    
    -- Validate total calculation
    IF ABS((NEW.subtotal + NEW.delivery_fee - NEW.coupon_discount) - NEW.total) > 0.01 THEN
        RAISE EXCEPTION 'Order total calculation error';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_validate_order_total 
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION validate_order_total();

-- ============================================
-- REFUND VALIDATION (SECURITY)
-- ============================================

-- Prevent refund amount exceeding order total
CREATE OR REPLACE FUNCTION validate_refund_amount()
RETURNS TRIGGER AS $$
DECLARE
    v_order_total DECIMAL(10, 2);
    v_total_refunded DECIMAL(10, 2);
BEGIN
    -- Get order total
    SELECT total INTO v_order_total FROM orders WHERE id = NEW.order_id;
    
    -- Calculate total already refunded
    SELECT COALESCE(SUM(refund_amount), 0) INTO v_total_refunded
    FROM order_refunds
    WHERE order_id = NEW.order_id AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    -- Validate refund amount is positive
    IF NEW.refund_amount <= 0 THEN
        RAISE EXCEPTION 'Refund amount must be positive';
    END IF;
    
    -- Validate total refunds don't exceed order total
    IF (v_total_refunded + NEW.refund_amount) > v_order_total THEN
        RAISE EXCEPTION 'Total refunds (%) cannot exceed order total (%)', 
            v_total_refunded + NEW.refund_amount, v_order_total;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_validate_refund_amount
    BEFORE INSERT OR UPDATE ON order_refunds
    FOR EACH ROW EXECUTE FUNCTION validate_refund_amount();
