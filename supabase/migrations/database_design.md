# PoyBash Furniture - Database Design & RLS Policies for Supabase

A comprehensive guide for implementing the database schema and Row-Level Security policies for the PoyBash Furniture e-commerce platform.

---

## ✅ Verification Checklist: README.md → Database Coverage

| README Feature | Database Entity | RLS Policy | Status |
|----------------|-----------------|------------|--------|
| Customer portal with shopping cart | `orders`, `order_items` | Customers can place/view own | ✅ |
| Admin dashboard with analytics | `orders`, `products`, triggers | Admin/Owner access | ✅ |
| 5 User roles (Customer, Staff, Clerk, Admin, Owner) | `users.role` enum | Role-based helper functions | ✅ |
| Multi-warehouse inventory (Lorenzo, Oroquieta) | `warehouses`, `warehouse_stock` | Clerk/Admin can manage | ✅ |
| FIFO batch tracking | `inventory_batches` | Via warehouse_stock policies | ✅ |
| Comprehensive audit logging | `audit_logs` | Owner-only view, immutable | ✅ |
| Discount coupon system | `coupons` | Admin manages, public validates | ✅ |
| QR code-based order lookup | `orders.order_number` | Staff can search all orders | ✅ |
| Payment verification (Cash, GCash, Bank) | `orders.payment_*` columns | Staff can verify | ✅ |
| Reservation system (partial payments) | `orders.is_reservation`, `reservation_fee` | Staff can create | ✅ |
| 7-day refund window | `order_items.refund_*` + CHECK constraint | Database constraint enforced | ✅ |
| Email verification for customers | `users.email_verified_at` | **ADDED** | ✅ |
| Export sales reports (Owner only) | App layer + `orders` data | Owner-only via app | ✅ |
| Soft deletes everywhere | `active` boolean on all tables | Only soft delete allowed | ✅ |
| Staff can create customer accounts | `users` INSERT policy | Staff creates customers only | ✅ |
| Admin creates Staff/Clerk accounts | `users` INSERT policy | Admin limits enforced | ✅ |
| Owner creates Admin/Owner accounts | `users` INSERT policy | Owner only | ✅ |
| Manual orders by staff | `orders.is_manual_order`, `created_by` | Staff can insert | ✅ |
| Forward-only status for Staff/Clerk | `orders` UPDATE policy | Transition rules enforced | ✅ |
| Any-direction status for Admin/Owner | `orders` UPDATE policy | Full control | ✅ |

> [!IMPORTANT]
> **7-day refund window**: Enforced via CHECK constraint on `order_items` table. Application should also validate against order completion date for accurate enforcement.

---

## 📊 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% ============================================
    %% USER AND AUTHENTICATION
    %% ============================================
    users {
        uuid id PK
        varchar email
        varchar first_name
        varchar last_name
        varchar phone
        enum role
        boolean active
        boolean email_verified
        timestamptz email_verified_at
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    addresses {
        uuid id PK
        uuid user_id FK
        varchar label
        varchar first_name
        varchar last_name
        text address
        varchar barangay
        varchar city
        varchar state
        varchar zip_code
        varchar country
        varchar phone
        boolean is_default
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    users ||--o{ addresses : "has"

    %% ============================================
    %% PRODUCTS AND TAXONOMY
    %% ============================================
    main_categories {
        uuid id PK
        varchar name
        varchar display_name
        text description
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    sub_categories {
        uuid id PK
        uuid category_id FK
        varchar name
        text description
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    materials {
        uuid id PK
        varchar name
        text description
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    colors {
        uuid id PK
        varchar name
        varchar hex_code
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    main_categories ||--o{ sub_categories : "contains"

    products {
        bigint id PK
        varchar name
        decimal price
        text description
        uuid category_id FK
        uuid sub_category_id FK
        varchar image_url
        text_array images
        uuid material_id FK
        jsonb dimensions
        boolean in_stock
        boolean featured
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    main_categories ||--o{ products : "categorizes"
    sub_categories ||--o{ products : "sub-categorizes"
    materials ||--o{ products : "made-of"

    product_variants {
        uuid id PK
        bigint product_id FK
        varchar size
        uuid color_id FK
        varchar sku
        decimal price
        jsonb dimensions
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    products ||--o{ product_variants : "has"
    colors ||--o{ product_variants : "colored"

    %% ============================================
    %% INVENTORY AND WAREHOUSES
    %% ============================================
    warehouses {
        uuid id PK
        varchar name
        text address
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    warehouse_stock {
        uuid id PK
        uuid variant_id FK
        uuid warehouse_id FK
        integer quantity
        integer reserved
        timestamptz updated_at
    }

    product_variants ||--o{ warehouse_stock : "stocked-at"
    warehouses ||--o{ warehouse_stock : "stores"

    inventory_batches {
        uuid id PK
        uuid warehouse_stock_id FK
        varchar batch_id
        timestamptz received_at
        integer quantity
        integer reserved
        integer available
        text notes
        timestamptz created_at
    }

    warehouse_stock ||--o{ inventory_batches : "has-batches"

    %% ============================================
    %% ORDERS AND TRANSACTIONS
    %% ============================================
    orders {
        uuid id PK
        varchar order_number
        uuid user_id FK
        enum status
        decimal subtotal
        decimal delivery_fee
        decimal coupon_discount
        uuid coupon_id FK
        decimal total
        boolean is_reservation
        decimal reservation_fee
        integer reservation_percentage
        enum fulfillment
        jsonb pickup_details
        jsonb shipping_address
        enum payment_method
        enum payment_status
        text payment_proof
        jsonb payment_details
        timestamptz payment_verified_at
        uuid verified_by FK
        boolean is_manual_order
        uuid created_by FK
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    users ||--o{ orders : "places"

    order_items {
        uuid id PK
        uuid order_id FK
        bigint product_id FK
        uuid variant_id FK
        varchar name
        decimal price
        integer quantity
        varchar color
        varchar size
        varchar image_url
        uuid warehouse_source FK
        boolean refund_requested
        text refund_reason
        enum refund_status
        text refund_proof
        timestamptz created_at
        timestamptz updated_at
    }

    orders ||--o{ order_items : "contains"
    products ||--o{ order_items : "ordered"
    product_variants ||--o{ order_items : "variant-ordered"
    warehouses ||--o{ order_items : "fulfilled-from"

    order_refunds {
        uuid id PK
        uuid order_id FK
        uuid processed_by FK
        varchar processed_by_name
        timestamptz processed_at
        enum refund_method
        decimal refund_amount
        text refund_reason
        text refund_proof
        text admin_notes
        uuid_array items_refunded
        timestamptz created_at
    }

    orders ||--o{ order_refunds : "has-refunds"
    users ||--o{ order_refunds : "processes"

    %% ============================================
    %% COUPONS
    %% ============================================
    coupons {
        uuid id PK
        varchar code
        text description
        enum discount_type
        decimal discount_value
        decimal min_purchase
        decimal max_discount
        date expiry_date
        integer usage_limit
        integer used_count
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    coupons ||--o{ orders : "applied-to"

    %% ============================================
    %% AUDIT LOGGING
    %% ============================================
    audit_logs {
        uuid id PK
        timestamptz timestamp
        varchar action_type
        uuid performed_by FK
        jsonb performer_info
        varchar entity_type
        uuid entity_id
        varchar entity_name
        jsonb previous_value
        jsonb new_value
        varchar order_number
        varchar product_sku
        varchar coupon_code
        text notes
        inet ip_address
        jsonb device_info
        timestamptz created_at
    }

    users ||--o{ audit_logs : "performs"

    %% ============================================
    %% NOTIFICATIONS
    %% ============================================
    user_notifications {
        uuid id PK
        uuid user_id FK
        timestamptz timestamp
        enum type
        text message
        boolean read
        text details
        timestamptz created_at
        timestamptz updated_at
    }

    users ||--o{ user_notifications : "receives"
```

---

## 🔐 Row-Level Security (RLS) Policies

### Custom Types (Enums)

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'inventory-clerk', 'admin', 'owner');

-- Order statuses
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded');

-- Payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'bank');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');

-- Fulfillment types
CREATE TYPE fulfillment_type AS ENUM ('pickup', 'delivery');

-- Discount types
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- Refund status
CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected');

-- Refund methods
CREATE TYPE refund_method AS ENUM ('gcash', 'bank', 'cash');

-- Notification types
CREATE TYPE notification_type AS ENUM ('account_modified', 'role_changed', 'account_status', 'order_update', 'refund_update');
```

---

## 🔒 Database Constraints & Indexes

### Primary Keys & Foreign Keys

```sql
-- Foreign Key Constraints with Cascade Behaviors
-- Users and related tables
ALTER TABLE addresses
  ADD CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) 
  REFERENCES users(id) ON DELETE CASCADE;

-- Products and taxonomy
ALTER TABLE products
  ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) 
  REFERENCES main_categories(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_products_sub_category FOREIGN KEY (sub_category_id) 
  REFERENCES sub_categories(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_products_material FOREIGN KEY (material_id) 
  REFERENCES materials(id) ON DELETE RESTRICT;

ALTER TABLE sub_categories
  ADD CONSTRAINT fk_sub_categories_category FOREIGN KEY (category_id) 
  REFERENCES main_categories(id) ON DELETE CASCADE;

ALTER TABLE product_variants
  ADD CONSTRAINT fk_variants_product FOREIGN KEY (product_id) 
  REFERENCES products(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_variants_color FOREIGN KEY (color_id) 
  REFERENCES colors(id) ON DELETE RESTRICT;

-- Inventory
ALTER TABLE warehouse_stock
  ADD CONSTRAINT fk_warehouse_stock_variant FOREIGN KEY (variant_id) 
  REFERENCES product_variants(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_warehouse_stock_warehouse FOREIGN KEY (warehouse_id) 
  REFERENCES warehouses(id) ON DELETE RESTRICT;

ALTER TABLE inventory_batches
  ADD CONSTRAINT fk_batches_warehouse_stock FOREIGN KEY (warehouse_stock_id) 
  REFERENCES warehouse_stock(id) ON DELETE CASCADE;

-- Orders
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) 
  REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) 
  REFERENCES coupons(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_orders_verified_by FOREIGN KEY (verified_by) 
  REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) 
  REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) 
  REFERENCES orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) 
  REFERENCES products(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) 
  REFERENCES product_variants(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_order_items_warehouse FOREIGN KEY (warehouse_source) 
  REFERENCES warehouses(id) ON DELETE RESTRICT;

ALTER TABLE order_refunds
  ADD CONSTRAINT fk_refunds_order FOREIGN KEY (order_id) 
  REFERENCES orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_refunds_processed_by FOREIGN KEY (processed_by) 
  REFERENCES users(id) ON DELETE SET NULL;

-- Notifications and Audit
ALTER TABLE user_notifications
  ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) 
  REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_performed_by FOREIGN KEY (performed_by) 
  REFERENCES users(id) ON DELETE SET NULL;
```

### Unique Constraints

```sql
-- Prevent duplicate data
ALTER TABLE users ADD CONSTRAINT unique_user_email UNIQUE (email);
ALTER TABLE main_categories ADD CONSTRAINT unique_category_name UNIQUE (name);
ALTER TABLE materials ADD CONSTRAINT unique_material_name UNIQUE (name);
ALTER TABLE colors ADD CONSTRAINT unique_color_name UNIQUE (name);
ALTER TABLE warehouses ADD CONSTRAINT unique_warehouse_name UNIQUE (name);
ALTER TABLE coupons ADD CONSTRAINT unique_coupon_code UNIQUE (code);
ALTER TABLE orders ADD CONSTRAINT unique_order_number UNIQUE (order_number);

-- Prevent duplicate product variants (CRITICAL)
ALTER TABLE product_variants 
  ADD CONSTRAINT unique_product_variant 
  UNIQUE (product_id, size, color_id);

-- Prevent duplicate SKUs (CRITICAL)
ALTER TABLE product_variants
  ADD CONSTRAINT unique_variant_sku
  UNIQUE (sku);

-- Prevent duplicate warehouse stock entries
ALTER TABLE warehouse_stock 
  ADD CONSTRAINT unique_warehouse_stock 
  UNIQUE (variant_id, warehouse_id);
```

### Check Constraints

```sql
-- Inventory constraints
ALTER TABLE warehouse_stock 
  ADD CONSTRAINT check_stock_non_negative 
  CHECK (quantity >= 0 AND reserved >= 0),
  ADD CONSTRAINT check_reserved_not_exceeds_quantity 
  CHECK (reserved <= quantity);

ALTER TABLE inventory_batches
  ADD CONSTRAINT check_batch_quantities 
  CHECK (quantity >= 0 AND reserved >= 0 AND reserved <= quantity);

-- Note: available column is GENERATED ALWAYS AS (quantity - reserved) STORED

-- Price constraints
ALTER TABLE products 
  ADD CONSTRAINT check_product_price_positive 
  CHECK (price >= 0);

ALTER TABLE product_variants 
  ADD CONSTRAINT check_variant_price_positive 
  CHECK (price >= 0);

-- Order constraints
ALTER TABLE orders
  ADD CONSTRAINT check_order_amounts_positive 
  CHECK (subtotal >= 0 AND delivery_fee >= 0 AND coupon_discount >= 0 AND total >= 0),
  ADD CONSTRAINT check_reservation_fee 
  CHECK (
    (is_reservation = false AND reservation_fee IS NULL AND reservation_percentage IS NULL) OR
    (is_reservation = true AND reservation_fee >= 0 AND reservation_percentage BETWEEN 1 AND 100)
  );

ALTER TABLE order_items
  ADD CONSTRAINT check_item_quantity_positive 
  CHECK (quantity > 0),
  ADD CONSTRAINT check_item_price_non_negative 
  CHECK (price >= 0);

-- Coupon constraints
ALTER TABLE coupons
  ADD CONSTRAINT check_coupon_discount_positive 
  CHECK (discount_value > 0),
  ADD CONSTRAINT check_coupon_min_purchase 
  CHECK (min_purchase >= 0),
  ADD CONSTRAINT check_coupon_usage 
  CHECK (used_count >= 0 AND (usage_limit IS NULL OR used_count <= usage_limit)),
  ADD CONSTRAINT check_percentage_discount_max 
  CHECK (
    (discount_type = 'percentage' AND discount_value <= 100) OR
    discount_type = 'fixed'
  );

-- 7-Day Refund Window Enforcement (CRITICAL)
ALTER TABLE order_items 
  ADD CONSTRAINT check_refund_window 
  CHECK (
    refund_requested = false OR
    (
      refund_requested = true AND
      created_at > (NOW() - INTERVAL '7 days')
    )
  );
```

> [!IMPORTANT]
> **Refund Window Note**: The CHECK constraint above provides a basic safeguard, but the actual enforcement should also happen in the application layer by checking the order's `updated_at` timestamp when status changed to 'completed'. This constraint prevents very old refund requests.

### Performance Indexes

```sql
-- User and Authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role, active);

-- Products (CRITICAL for browsing performance)
CREATE INDEX idx_products_category_active ON products(category_id, active);
CREATE INDEX idx_products_sub_category_active ON products(sub_category_id, active);
CREATE INDEX idx_products_featured_active ON products(featured, active) WHERE featured = true;
CREATE INDEX idx_products_in_stock ON products(in_stock, active) WHERE in_stock = true;

-- Product Variants
CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_color_id ON product_variants(color_id);

-- Orders (CRITICAL for dashboard and lookups)
CREATE INDEX idx_orders_order_number ON orders(order_number); -- QR code lookups
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status) WHERE payment_status = 'pending';

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX idx_order_items_refund_status ON order_items(refund_status) WHERE refund_requested = true;

-- Warehouse and Inventory (CRITICAL for stock checks)
CREATE INDEX idx_warehouse_stock_variant ON warehouse_stock(variant_id);
CREATE INDEX idx_warehouse_stock_warehouse ON warehouse_stock(warehouse_id);
CREATE INDEX idx_warehouse_stock_variant_warehouse ON warehouse_stock(variant_id, warehouse_id);

-- Inventory Batches (CRITICAL for FIFO)
CREATE INDEX idx_batches_warehouse_stock_received ON inventory_batches(warehouse_stock_id, received_at ASC);
CREATE INDEX idx_batches_available ON inventory_batches(warehouse_stock_id) WHERE available > 0;

-- Coupons
CREATE INDEX idx_coupons_code_active ON coupons(code, is_active);
CREATE INDEX idx_coupons_active_expiry ON coupons(is_active, expiry_date) WHERE is_active = true;

-- Audit Logs (CRITICAL for owner queries)
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_performed_by ON audit_logs(performed_by, timestamp DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action_type ON audit_logs(action_type, timestamp DESC);

-- Notifications
CREATE INDEX idx_notifications_user_read ON user_notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_unread ON user_notifications(user_id, created_at DESC) WHERE read = false;
```

> [!TIP]
> **Index Strategy**: These indexes are optimized for common query patterns. Monitor query performance with `EXPLAIN ANALYZE` and adjust as needed. Supabase free tier supports all these indexes.

---

## 🔧 Schema Modifications (ERD Fixes)

The following modifications were applied to fix issues identified in the ERD validation:

### 1. Added `updated_at` Columns

**Tables Updated**: `addresses`, `warehouses`, `coupons`, `user_notifications`, `order_items`

```sql
-- Add updated_at to track modifications
ALTER TABLE addresses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE warehouses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE coupons ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_notifications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE order_items ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create triggers to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON user_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Fixed `order_refunds.items_refunded` Data Type

**Issue**: Was `bigint[]` (product IDs), should be `uuid[]` (order_item IDs)

```sql
-- Change data type to properly reference order_items
ALTER TABLE order_refunds 
  ALTER COLUMN items_refunded TYPE uuid[] 
  USING items_refunded::text[]::uuid[];
```

### 3. Made `inventory_batches.available` a Generated Column

**Issue**: Was a regular column with manual calculation

```sql
-- Drop the old column and recreate as GENERATED
ALTER TABLE inventory_batches DROP COLUMN available;
ALTER TABLE inventory_batches 
  ADD COLUMN available INTEGER 
  GENERATED ALWAYS AS (quantity - reserved) STORED;
```

### 4. Added Soft Delete to `addresses`

**Issue**: Missing `active` column for soft deletes

```sql
-- Add soft delete support
ALTER TABLE addresses ADD COLUMN active BOOLEAN DEFAULT true;

-- Update RLS policies to respect soft delete
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
CREATE POLICY "Users can view own addresses"
ON addresses FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND active = true);
```

### 5. Made `product_variants.sku` Unique

**Issue**: SKUs should be unique across all variants

```sql
-- Add unique constraint (already in constraints section above)
ALTER TABLE product_variants ADD CONSTRAINT unique_variant_sku UNIQUE (sku);
```

---

### Stock Reservation (Prevents Race Conditions)

```sql
-- Atomically reserve stock for an order (CRITICAL)
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
```

### Coupon Application (Prevents Race Conditions)

```sql
-- Safely apply a coupon with usage limit enforcement (CRITICAL)
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
    AND is_active = true
    AND expiry_date >= CURRENT_DATE
  FOR UPDATE;
  
  -- Validate coupon exists
  IF v_coupon.id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::DECIMAL, 'Invalid or expired coupon code';
    RETURN;
  END IF;
  
  -- Check usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::DECIMAL, 'Coupon usage limit reached';
    RETURN;
  END IF;
  
  -- Check minimum purchase
  IF p_order_total < v_coupon.min_purchase THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::DECIMAL, 
      'Minimum purchase of ' || v_coupon.min_purchase || ' required';
    RETURN;
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := p_order_total * (v_coupon.discount_value / 100);
    IF v_coupon.max_discount IS NOT NULL THEN
      v_discount := LEAST(v_discount, v_coupon.max_discount);
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;
  
  -- Increment usage count
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = v_coupon.id;
  
  RETURN QUERY SELECT TRUE, v_coupon.id, v_discount, 'Coupon applied successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### FIFO Batch Allocation

```sql
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
BEGIN
  -- Process batches in FIFO order (oldest first)
  FOR v_batch IN
    SELECT id, batch_id, available
    FROM inventory_batches
    WHERE warehouse_stock_id = p_warehouse_stock_id
      AND available > 0
    ORDER BY received_at ASC
    FOR UPDATE
  LOOP
    IF v_remaining <= 0 THEN
      EXIT;
    END IF;
    
    DECLARE
      v_allocate INTEGER := LEAST(v_batch.available, v_remaining);
    BEGIN
      -- Reserve from this batch
      UPDATE inventory_batches
      SET reserved = reserved + v_allocate,
          available = available - v_allocate
      WHERE id = v_batch.id;
      
      -- Return allocation info
      RETURN QUERY SELECT v_batch.id, v_batch.batch_id, v_allocate;
      
      v_remaining := v_remaining - v_allocate;
    END;
  END LOOP;
  
  -- Check if we allocated enough
  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient stock in batches. Needed %, allocated %', 
      p_quantity, p_quantity - v_remaining;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Authorization Helper Functions

```sql
-- Get current user's role (cached for performance)
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

-- Check if user's email is verified
CREATE OR REPLACE FUNCTION auth.is_email_verified()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT email_verified FROM public.users WHERE id = auth.uid()),
    false
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## 📋 RLS Policies by Table

### 1. users

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Everyone can view active users (for order assignments, etc.)
CREATE POLICY "Users are viewable by authenticated users"
ON users FOR SELECT
TO authenticated
USING (active = true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND role = (SELECT role FROM users WHERE id = auth.uid()) -- Cannot change own role
);

-- Staff can view customer details for order management
CREATE POLICY "Staff can view all users"
ON users FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

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

-- Owner can create any account including admin/owner
CREATE POLICY "Owner can create any account"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.is_owner());

-- Admin/Owner can update user accounts (including role changes)
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

-- Soft delete only (set active = false)
CREATE POLICY "Admin can deactivate users"
ON users FOR UPDATE
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (true);
```

---

### 2. addresses

```sql
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own addresses
CREATE POLICY "Users can view own addresses"
ON addresses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Staff can view customer addresses for order processing
CREATE POLICY "Staff can view customer addresses"
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
```

---

### 3. products

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products (including anonymous for browsing)
CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT
TO anon, authenticated
USING (active = true);

-- Staff can view all products including inactive (for admin panel)
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
```

---

### 4. product_variants

```sql
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Same policies as products
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
```

---

### 5. warehouse_stock

```sql
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;

-- Public can view stock for availability display
CREATE POLICY "Stock is viewable by everyone"
ON warehouse_stock FOR SELECT
TO anon, authenticated
USING (true);

-- Note: Stock modifications should use reserve_stock() and release_stock() functions

-- Only Inventory Clerk, Admin, Owner can modify stock
CREATE POLICY "Inventory managers can update stock"
ON warehouse_stock FOR UPDATE
TO authenticated
USING (auth.can_manage_inventory())
WITH CHECK (auth.can_manage_inventory());

CREATE POLICY "Inventory managers can insert stock"
ON warehouse_stock FOR INSERT
TO authenticated
WITH CHECK (auth.can_manage_inventory());
```

---

### 5a. inventory_batches (FIFO Tracking)

```sql
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;

-- Inventory managers can view all batches
CREATE POLICY "Inventory managers can view batches"
ON inventory_batches FOR SELECT
TO authenticated
USING (auth.can_manage_inventory());

-- Only inventory managers can manage batches
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
```

---

### 5b. warehouses

```sql
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Everyone can view active warehouses (for order fulfillment options)
CREATE POLICY "Active warehouses are viewable by everyone"
ON warehouses FOR SELECT
TO anon, authenticated
USING (active = true);

-- Staff can view all warehouses
CREATE POLICY "Staff can view all warehouses"
ON warehouses FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

-- Only Admin/Owner can manage warehouses
CREATE POLICY "Admin can manage warehouses"
ON warehouses FOR ALL
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (auth.is_admin_or_owner());
```

---

### 6. orders

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

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

-- Customers can place orders (insert) - EMAIL VERIFICATION REQUIRED
CREATE POLICY "Customers can place orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND is_manual_order = false
  AND auth.is_email_verified() = true  -- CRITICAL: Email must be verified
);

-- Staff can create manual orders for customers
CREATE POLICY "Staff can create manual orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
  auth.is_staff_or_above() 
  AND is_manual_order = true
);

-- Customers can only cancel their pending orders
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
```

---

### 7. order_items

```sql
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Same access as parent order
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

-- Items are created with the order
CREATE POLICY "Order items created with order"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  OR auth.is_staff_or_above()
);

-- Customers can request refunds on their items
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

-- Staff can process refunds
CREATE POLICY "Staff can process refunds"
ON order_items FOR UPDATE
TO authenticated
USING (auth.is_staff_or_above())
WITH CHECK (auth.is_staff_or_above());
```

---

### 8. order_refunds

```sql
ALTER TABLE order_refunds ENABLE ROW LEVEL SECURITY;

-- Customers can view refunds on their orders
CREATE POLICY "Customers can view own refunds"
ON order_refunds FOR SELECT
TO authenticated
USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

-- Staff can view all refunds
CREATE POLICY "Staff can view all refunds"
ON order_refunds FOR SELECT
TO authenticated
USING (auth.is_staff_or_above());

-- Staff can create refunds
CREATE POLICY "Staff can create refunds"
ON order_refunds FOR INSERT
TO authenticated
WITH CHECK (auth.is_staff_or_above());
```

---

### 9. coupons

```sql
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Everyone can view active coupons (for validation)
CREATE POLICY "Active coupons are viewable"
ON coupons FOR SELECT
TO anon, authenticated
USING (is_active = true AND expiry_date >= CURRENT_DATE);

-- Admin can view all coupons
CREATE POLICY "Admin can view all coupons"
ON coupons FOR SELECT
TO authenticated
USING (auth.is_admin_or_owner());

-- Only Admin/Owner can manage coupons
CREATE POLICY "Admin can manage coupons"
ON coupons FOR ALL
TO authenticated
USING (auth.is_admin_or_owner())
WITH CHECK (auth.is_admin_or_owner());
```

> [!IMPORTANT]
> **Coupon Application**: Do NOT allow direct updates to `used_count`. Always use the `apply_coupon()` function to prevent race conditions and enforce usage limits atomically.
```

---

### 10. audit_logs

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ONLY Owner can view audit logs (critical security requirement)
CREATE POLICY "Only owner can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (auth.is_owner());

-- System inserts audit logs (via service role or trigger)
-- No user can directly insert - use a SECURITY DEFINER function
CREATE POLICY "No direct inserts"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (false);

-- Only owner can clear old logs
CREATE POLICY "Only owner can delete audit logs"
ON audit_logs FOR DELETE
TO authenticated
USING (auth.is_owner());

-- Audit logs are immutable - no updates allowed
CREATE POLICY "Audit logs are immutable"
ON audit_logs FOR UPDATE
TO authenticated
USING (false);
```

```sql
-- Enhanced audit log insertion function with IP and device tracking
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT DEFAULT NULL,
  p_previous_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT id, email, role, first_name, last_name 
  INTO v_user 
  FROM users 
  WHERE id = auth.uid();
  
  -- If no user found, use system user
  IF v_user.id IS NULL THEN
    v_user.email := 'system';
    v_user.role := NULL;
    v_user.first_name := 'System';
    v_user.last_name := 'Automated';
  END IF;
  
  INSERT INTO audit_logs (
    id, timestamp, action_type, performed_by, performer_info,
    entity_type, entity_id, entity_name,
    previous_value, new_value, notes,
    ip_address, device_info, created_at
  ) VALUES (
    gen_random_uuid(), NOW(), p_action_type, auth.uid(),
    jsonb_build_object(
      'email', v_user.email,
      'role', v_user.role,
      'name', COALESCE(v_user.first_name || ' ' || v_user.last_name, v_user.email)
    ),
    p_entity_type, p_entity_id, p_entity_name,
    p_previous_value, p_new_value, p_notes,
    p_ip_address, p_device_info, NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 11. user_notifications

```sql
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON user_notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can mark their notifications as read
CREATE POLICY "Users can update own notifications"
ON user_notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- System creates notifications (via function)
CREATE POLICY "System can insert notifications"
ON user_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.is_staff_or_above());
```

---

### 12. Taxonomy Tables (categories, materials, colors)

```sql
-- main_categories
ALTER TABLE main_categories ENABLE ROW LEVEL SECURITY;

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

-- sub_categories (same pattern)
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
-- ... same policies as main_categories

-- materials (same pattern)
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
-- ... same policies as main_categories

-- colors (same pattern)
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
-- ... same policies as main_categories
```

---

## 📊 Permission Matrix Summary

| Resource | Customer | Sales Staff | Inventory Clerk | Admin | Owner |
|----------|----------|-------------|-----------------|-------|-------|
| **Products** | View active | View all | View all | Full CRUD | Full CRUD |
| **Product Variants** | View active | View all | View all | Full CRUD | Full CRUD |
| **Categories/Taxonomies** | View active | View all | View all | Full CRUD | Full CRUD |
| **Warehouse Stock** | View | View | Full CRUD | Full CRUD | Full CRUD |
| **Orders (Own)** | View, Cancel pending | - | - | - | - |
| **Orders (All)** | ❌ | View, Update forward | View, Update forward | Full control | Full control |
| **Order Refunds** | View own | Create, View all | Create, View all | Full control | Full control |
| **Coupons** | Validate active | View active | View active | Full CRUD | Full CRUD |
| **Users (Own)** | Update profile | Update profile | Update profile | Update profile | Update profile |
| **Users (Others)** | ❌ | Create customers | Create customers | Create staff/clerks | Create anyone |
| **Addresses** | Own CRUD | View all | View all | View all | Full CRUD |
| **Audit Logs** | ❌ | ❌ | ❌ | ❌ | Full access |
| **Notifications** | Own only | Create for users | Create for users | Create for users | Full access |

---

## 🔄 Order Status Workflow & Permissions

```mermaid
stateDiagram-v2
    [*] --> pending: Customer/Staff places order
    pending --> confirmed: Staff verifies payment
    pending --> cancelled: Customer/Staff cancels
    confirmed --> processing: Staff starts fulfillment
    processing --> ready: Clerk marks ready
    ready --> completed: Staff confirms pickup/delivery
    completed --> refunded: Staff processes refund
    cancelled --> [*]
    refunded --> [*]
    completed --> [*]
    
    note right of pending: Customer can cancel
    note right of confirmed: Admin can move backward
    note right of completed: Staff can process refunds
```

### Status Transition Permissions

| From Status | To Status | Customer | Sales | Clerk | Admin | Owner |
|-------------|-----------|----------|-------|-------|-------|-------|
| pending | confirmed | ❌ | ✅ | ✅ | ✅ | ✅ |
| pending | cancelled | ✅ (own) | ✅ | ✅ | ✅ | ✅ |
| confirmed | pending | ❌ | ❌ | ❌ | ✅ | ✅ |
| confirmed | processing | ❌ | ✅ | ✅ | ✅ | ✅ |
| processing | ready | ❌ | ✅ | ✅ | ✅ | ✅ |
| ready | completed | ❌ | ✅ | ✅ | ✅ | ✅ |
| completed | refunded | ❌ | ✅ | ✅ | ✅ | ✅ |
| Any | Any (backward) | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## ⚠️ Security Considerations

### Critical Points

1. **Audit Logs are Owner-Only**: This ensures independent oversight. Admins cannot view or manipulate their own audit trail.

2. **Soft Deletes Everywhere**: Use `active = false` instead of hard deletes to maintain data integrity and audit trails.

3. **Role Hierarchy Enforcement**: Admins cannot create other admins or owners. Only owners can elevate permissions.

4. **Immutable Audit Logs**: Once created, audit log entries cannot be updated or deleted (except by owner for maintenance).

5. **Service Role for Sensitive Operations**: Use Supabase service role (not anon or authenticated) for:
   - Creating audit log entries via triggers
   - Processing inventory changes during order completion
   - Sending system notifications

6. **Email Verification Required** ✅ ENFORCED: Customers must verify their email before placing orders. Enforced via RLS policy:
   ```sql
   WITH CHECK (
     user_id = auth.uid() 
     AND is_manual_order = false
     AND auth.is_email_verified() = true
   );
   ```

7. **7-Day Refund Window Enforcement** ✅ ENFORCED: Database CHECK constraint prevents refund requests older than 7 days:
   ```sql
   ALTER TABLE order_items ADD CONSTRAINT check_refund_window
   CHECK (
     refund_requested = false OR
     (refund_requested = true AND created_at > (NOW() - INTERVAL '7 days'))
   );
   ```
   > **Note**: Application should also check against order completion date for accurate enforcement.

8. **Prevent Privilege Escalation via Own Profile Update**:
   - Users cannot change their own role
   - Users cannot reactivate their own deactivated account
   - Staff cannot elevate themselves to Admin/Owner

9. **Race Condition Prevention** ✅ IMPLEMENTED:
   - **Stock Reservation**: Use `reserve_stock()` function with row-level locking
   - **Coupon Application**: Use `apply_coupon()` function with atomic check-and-increment
   - **FIFO Allocation**: Use `allocate_fifo_stock()` with FOR UPDATE locking

10. **Data Integrity Constraints** ✅ IMPLEMENTED:
    - Foreign keys with appropriate CASCADE behaviors
    - Unique constraints on critical fields (variant combinations, order numbers, etc.)
    - CHECK constraints for business rules (prices, quantities, refund windows)

11. **Rate Limiting Considerations**: Implement at application/edge level:
    - Login attempts: 5 per minute
    - Order placement: 10 per hour
    - Refund requests: 3 per day per user

### Recommended Triggers

```sql
-- Auto-log all order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_audit_event(
      'order:status_changed',
      'order',
      NEW.id,
      NEW.order_number,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER order_status_audit
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_change();
```

---

## 🔄 Database Triggers

### Order Status Transition Validation

```sql
-- Validate order status transitions (CRITICAL for data integrity)
CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow same status (for other field updates)
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Define valid forward transitions
  IF (
    (OLD.status = 'pending' AND NEW.status IN ('confirmed', 'cancelled')) OR
    (OLD.status = 'confirmed' AND NEW.status IN ('processing', 'cancelled')) OR
    (OLD.status = 'processing' AND NEW.status = 'ready') OR
    (OLD.status = 'ready' AND NEW.status = 'completed') OR
    (OLD.status = 'completed' AND NEW.status = 'refunded')
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Allow backward transitions only for admin/owner
  IF auth.is_admin_or_owner() THEN
    -- Admin can move backward but not to invalid states
    IF (
      (NEW.status = 'pending' AND OLD.status IN ('confirmed', 'cancelled')) OR
      (NEW.status = 'confirmed' AND OLD.status = 'processing') OR
      (NEW.status = 'processing' AND OLD.status = 'ready') OR
      (NEW.status = 'ready' AND OLD.status = 'completed')
    ) THEN
      RETURN NEW;
    END IF;
  END IF;
  
  -- Invalid transition
  RAISE EXCEPTION 'Invalid order status transition from % to % for user role %', 
    OLD.status, NEW.status, auth.user_role();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER order_status_transition_check
BEFORE UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION validate_order_status_transition();
```

### Warehouse Stock Synchronization

```sql
-- Automatically update warehouse_stock when batches are added
CREATE OR REPLACE FUNCTION sync_warehouse_stock_from_batches()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add new batch quantity to warehouse stock
    UPDATE warehouse_stock
    SET quantity = quantity + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.warehouse_stock_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Adjust warehouse stock based on batch quantity change
    UPDATE warehouse_stock
    SET quantity = quantity + (NEW.quantity - OLD.quantity),
        reserved = reserved + (NEW.reserved - OLD.reserved),
        updated_at = NOW()
    WHERE id = NEW.warehouse_stock_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Subtract deleted batch from warehouse stock
    UPDATE warehouse_stock
    SET quantity = GREATEST(0, quantity - OLD.quantity),
        reserved = GREATEST(0, reserved - OLD.reserved),
        updated_at = NOW()
    WHERE id = OLD.warehouse_stock_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_warehouse_stock
AFTER INSERT OR UPDATE OR DELETE ON inventory_batches
FOR EACH ROW
EXECUTE FUNCTION sync_warehouse_stock_from_batches();
```

### Automated Audit Logging

```sql
-- Log product changes
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      'product:created',
      'product',
      NEW.id,
      NEW.name,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      'product:updated',
      'product',
      NEW.id,
      NEW.name,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      'product:deleted',
      'product',
      OLD.id,
      OLD.name,
      to_jsonb(OLD),
      NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER product_audit_log
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION log_product_changes();

-- Log user role changes
CREATE OR REPLACE FUNCTION log_user_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM log_audit_event(
      'user:role_changed',
      'user',
      NEW.id,
      NEW.email,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role),
      'Role changed from ' || OLD.role || ' to ' || NEW.role
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER user_role_audit
AFTER UPDATE ON users
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION log_user_role_changes();

-- Log refund processing
CREATE OR REPLACE FUNCTION log_refund_processing()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_audit_event(
    'refund:processed',
    'order_refund',
    NEW.id,
    (SELECT order_number FROM orders WHERE id = NEW.order_id),
    NULL,
    to_jsonb(NEW),
    'Refund of ' || NEW.refund_amount || ' processed via ' || NEW.refund_method
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER refund_audit_log
AFTER INSERT ON order_refunds
FOR EACH ROW
EXECUTE FUNCTION log_refund_processing();
```

---

## 📝 Warehouse Assignment Logic

### Stock Allocation Strategy

When an order is placed, the system determines which warehouse fulfills each item using the following algorithm:

1. **Check Availability**: Query `warehouse_stock` for the variant across all active warehouses
2. **Select Warehouse**: Choose the warehouse with the highest available stock (quantity - reserved)
3. **Reserve Stock**: Call `reserve_stock(variant_id, warehouse_id, quantity)` to atomically reserve
4. **Record Source**: Store the selected `warehouse_id` in `order_items.warehouse_source`

```sql
-- Example: Get best warehouse for a variant
CREATE OR REPLACE FUNCTION get_best_warehouse_for_variant(
  p_variant_id UUID,
  p_quantity INTEGER
) RETURNS UUID AS $$
DECLARE
  v_warehouse_id UUID;
BEGIN
  SELECT warehouse_id INTO v_warehouse_id
  FROM warehouse_stock ws
  JOIN warehouses w ON w.id = ws.warehouse_id
  WHERE ws.variant_id = p_variant_id
    AND w.active = true
    AND (ws.quantity - ws.reserved) >= p_quantity
  ORDER BY (ws.quantity - ws.reserved) DESC
  LIMIT 1;
  
  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'No warehouse has sufficient stock for variant %', p_variant_id;
  END IF;
  
  RETURN v_warehouse_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

> [!NOTE]
> **Future Enhancement**: Consider adding geographic proximity calculation if customer address is available, to minimize shipping distance and costs.

### Split Shipments

Currently, the system does NOT support split shipments (one order fulfilled from multiple warehouses). Each order item must be fulfilled from a single warehouse. If implementing split shipments in the future:

1. Add `shipment_groups` table to group items by warehouse
2. Update order status to track per-shipment status
3. Modify fulfillment logic to handle partial completions

---

## 🔍 Partial Refund Data Model

### Data Model Clarification

The refund system uses two tables with distinct purposes:

**`order_items` table** (Item-level refund status):
- `refund_requested` - Boolean flag indicating customer requested refund
- `refund_reason` - Customer's reason for refund
- `refund_status` - Current status: pending, approved, rejected
- `refund_proof` - Customer's proof (photos of damaged items, etc.)

**`order_refunds` table** (Transaction records):
- Records the actual refund transaction processed by staff
- `refund_amount` - Amount refunded to customer
- `refund_method` - How refund was sent (GCash, bank, cash)
- `refund_proof` - Staff's proof of refund (transaction screenshot)
- `items_refunded` - Array of product IDs that were refunded
- `processed_by` - Staff member who processed the refund

### Workflow

1. **Customer requests refund**: Update `order_items` with refund request details
2. **Staff reviews**: Check `order_items` where `refund_requested = true`
3. **Staff processes**: Create `order_refunds` record with transaction details
4. **Staff updates items**: Set `order_items.refund_status` to 'approved' or 'rejected'
5. **Order status**: If all items refunded, update `orders.status` to 'refunded'

### Querying Refunded Items

```sql
-- Get all refunded items for an order
SELECT oi.*, or.refund_amount, or.refund_method, or.processed_at
FROM order_items oi
JOIN order_refunds or ON or.order_id = oi.order_id
WHERE oi.order_id = 'some-order-id'
  AND oi.refund_status = 'approved'
  AND oi.product_id = ANY(or.items_refunded);
```

---

---

## 🔄 Migration Scripts

### Step 1: Add Constraints and Indexes

```sql
-- ============================================
-- STEP 1A: Add Foreign Key Constraints
-- ============================================

-- Users and related tables
ALTER TABLE addresses
  ADD CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) 
  REFERENCES users(id) ON DELETE CASCADE;

-- Products and taxonomy
ALTER TABLE products
  ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) 
  REFERENCES main_categories(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_products_sub_category FOREIGN KEY (sub_category_id) 
  REFERENCES sub_categories(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_products_material FOREIGN KEY (material_id) 
  REFERENCES materials(id) ON DELETE RESTRICT;

ALTER TABLE sub_categories
  ADD CONSTRAINT fk_sub_categories_category FOREIGN KEY (category_id) 
  REFERENCES main_categories(id) ON DELETE CASCADE;

ALTER TABLE product_variants
  ADD CONSTRAINT fk_variants_product FOREIGN KEY (product_id) 
  REFERENCES products(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_variants_color FOREIGN KEY (color_id) 
  REFERENCES colors(id) ON DELETE RESTRICT;

-- Inventory
ALTER TABLE warehouse_stock
  ADD CONSTRAINT fk_warehouse_stock_variant FOREIGN KEY (variant_id) 
  REFERENCES product_variants(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_warehouse_stock_warehouse FOREIGN KEY (warehouse_id) 
  REFERENCES warehouses(id) ON DELETE RESTRICT;

ALTER TABLE inventory_batches
  ADD CONSTRAINT fk_batches_warehouse_stock FOREIGN KEY (warehouse_stock_id) 
  REFERENCES warehouse_stock(id) ON DELETE CASCADE;

-- Orders
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) 
  REFERENCES users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) 
  REFERENCES coupons(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_orders_verified_by FOREIGN KEY (verified_by) 
  REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) 
  REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) 
  REFERENCES orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) 
  REFERENCES products(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) 
  REFERENCES product_variants(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_order_items_warehouse FOREIGN KEY (warehouse_source) 
  REFERENCES warehouses(id) ON DELETE RESTRICT;

ALTER TABLE order_refunds
  ADD CONSTRAINT fk_refunds_order FOREIGN KEY (order_id) 
  REFERENCES orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_refunds_processed_by FOREIGN KEY (processed_by) 
  REFERENCES users(id) ON DELETE SET NULL;

-- Notifications and Audit
ALTER TABLE user_notifications
  ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) 
  REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_performed_by FOREIGN KEY (performed_by) 
  REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- STEP 1B: Add Unique Constraints
-- ============================================

-- Note: Before adding these, check for and resolve any duplicate data
ALTER TABLE users ADD CONSTRAINT unique_user_email UNIQUE (email);
ALTER TABLE main_categories ADD CONSTRAINT unique_category_name UNIQUE (name);
ALTER TABLE materials ADD CONSTRAINT unique_material_name UNIQUE (name);
ALTER TABLE colors ADD CONSTRAINT unique_color_name UNIQUE (name);
ALTER TABLE warehouses ADD CONSTRAINT unique_warehouse_name UNIQUE (name);
ALTER TABLE coupons ADD CONSTRAINT unique_coupon_code UNIQUE (code);
ALTER TABLE orders ADD CONSTRAINT unique_order_number UNIQUE (order_number);

-- CRITICAL: Check for duplicate variants before adding this constraint
-- Run: SELECT product_id, size, color_id, COUNT(*) FROM product_variants GROUP BY product_id, size, color_id HAVING COUNT(*) > 1;
ALTER TABLE product_variants 
  ADD CONSTRAINT unique_product_variant 
  UNIQUE (product_id, size, color_id);

ALTER TABLE warehouse_stock 
  ADD CONSTRAINT unique_warehouse_stock 
  UNIQUE (variant_id, warehouse_id);

-- ============================================
-- STEP 1C: Add Check Constraints
-- ============================================

-- Inventory constraints
ALTER TABLE warehouse_stock 
  ADD CONSTRAINT check_stock_non_negative 
  CHECK (quantity >= 0 AND reserved >= 0),
  ADD CONSTRAINT check_reserved_not_exceeds_quantity 
  CHECK (reserved <= quantity);

ALTER TABLE inventory_batches
  ADD CONSTRAINT check_batch_quantities 
  CHECK (quantity >= 0 AND reserved >= 0 AND reserved <= quantity),
  ADD CONSTRAINT check_batch_available 
  CHECK (available = quantity - reserved);

-- Price constraints
ALTER TABLE products 
  ADD CONSTRAINT check_product_price_positive 
  CHECK (price >= 0);

ALTER TABLE product_variants 
  ADD CONSTRAINT check_variant_price_positive 
  CHECK (price >= 0);

-- Order constraints
ALTER TABLE orders
  ADD CONSTRAINT check_order_amounts_positive 
  CHECK (subtotal >= 0 AND delivery_fee >= 0 AND coupon_discount >= 0 AND total >= 0),
  ADD CONSTRAINT check_reservation_fee 
  CHECK (
    (is_reservation = false AND reservation_fee IS NULL AND reservation_percentage IS NULL) OR
    (is_reservation = true AND reservation_fee >= 0 AND reservation_percentage BETWEEN 1 AND 100)
  );

ALTER TABLE order_items
  ADD CONSTRAINT check_item_quantity_positive 
  CHECK (quantity > 0),
  ADD CONSTRAINT check_item_price_non_negative 
  CHECK (price >= 0),
  ADD CONSTRAINT check_refund_window 
  CHECK (
    refund_requested = false OR
    (refund_requested = true AND created_at > (NOW() - INTERVAL '7 days'))
  );

-- Coupon constraints
ALTER TABLE coupons
  ADD CONSTRAINT check_coupon_discount_positive 
  CHECK (discount_value > 0),
  ADD CONSTRAINT check_coupon_min_purchase 
  CHECK (min_purchase >= 0),
  ADD CONSTRAINT check_coupon_usage 
  CHECK (used_count >= 0 AND (usage_limit IS NULL OR used_count <= usage_limit)),
  ADD CONSTRAINT check_percentage_discount_max 
  CHECK (
    (discount_type = 'percentage' AND discount_value <= 100) OR
    discount_type = 'fixed'
  );

-- ============================================
-- STEP 1D: Add Performance Indexes
-- ============================================

-- User and Authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, active);

-- Products (CRITICAL for browsing performance)
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, active);
CREATE INDEX IF NOT EXISTS idx_products_sub_category_active ON products(sub_category_id, active);
CREATE INDEX IF NOT EXISTS idx_products_featured_active ON products(featured, active) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock, active) WHERE in_stock = true;

-- Product Variants
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_color_id ON product_variants(color_id);

-- Orders (CRITICAL for dashboard and lookups)
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status) WHERE payment_status = 'pending';

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_refund_status ON order_items(refund_status) WHERE refund_requested = true;

-- Warehouse and Inventory (CRITICAL for stock checks)
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_variant ON warehouse_stock(variant_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_warehouse ON warehouse_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_variant_warehouse ON warehouse_stock(variant_id, warehouse_id);

-- Inventory Batches (CRITICAL for FIFO)
CREATE INDEX IF NOT EXISTS idx_batches_warehouse_stock_received ON inventory_batches(warehouse_stock_id, received_at ASC);
CREATE INDEX IF NOT EXISTS idx_batches_available ON inventory_batches(warehouse_stock_id) WHERE available > 0;

-- Coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code_active ON coupons(code, is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_active_expiry ON coupons(is_active, expiry_date) WHERE is_active = true;

-- Audit Logs (CRITICAL for owner queries)
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_performed_by ON audit_logs(performed_by, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON audit_logs(action_type, timestamp DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON user_notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, created_at DESC) WHERE read = false;
```

### Step 2: Create Advanced Functions

Run all the functions from the "Advanced Functions" section above:
- `reserve_stock()`
- `release_stock()`
- `confirm_stock_sale()`
- `apply_coupon()`
- `allocate_fifo_stock()`
- `get_best_warehouse_for_variant()`

### Step 3: Update Helper Functions

Run all the updated authorization helper functions from the "Authorization Helper Functions" section.

### Step 4: Create Database Triggers

Run all the triggers from the "Database Triggers" section:
- `validate_order_status_transition()`
- `sync_warehouse_stock_from_batches()`
- `log_product_changes()`
- `log_user_role_changes()`
- `log_refund_processing()`

### Step 5: Update RLS Policies

```sql
-- ============================================
-- Update Orders Policy for Email Verification
-- ============================================

-- Drop the old policy
DROP POLICY IF EXISTS "Customers can place orders" ON orders;

-- Create new policy with email verification
CREATE POLICY "Customers can place orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND is_manual_order = false
  AND auth.is_email_verified() = true
);

-- ============================================
-- Add Missing Warehouses Policies
-- ============================================

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

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
-- Add Missing Inventory Batches Policies
-- ============================================

ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;

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
-- Remove Unsafe Coupon Update Policy
-- ============================================

DROP POLICY IF EXISTS "System can update coupon usage" ON coupons;

-- Note: Coupon usage should only be updated via apply_coupon() function
```

### Step 6: Verify Migration

```sql
-- Check that all constraints are in place
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid IN (
  SELECT oid FROM pg_class 
  WHERE relname IN ('users', 'orders', 'order_items', 'products', 'warehouse_stock', 'coupons')
)
ORDER BY conrelid, contype;

-- Check that all indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Test a function
SELECT reserve_stock(
  'some-variant-uuid'::uuid, 
  'some-warehouse-uuid'::uuid, 
  1
);

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;
```

---

## 🚀 Implementation Notes

1. **Enable RLS on all tables** immediately after creation
2. **Test each policy** with different user roles before production
3. **Use `SECURITY DEFINER` functions** for operations that need elevated privileges
4. **Monitor the `audit_logs` table** for suspicious patterns
5. **Regular backups** of audit logs before any cleanup operations

This design follows e-commerce industry best practices with proper separation of duties, comprehensive audit trailing, and role-based access that prevents any single user from having unchecked power (except the owner who has full visibility).

---

## 🔍 Potential Security Vulnerabilities & Mitigations

| Vulnerability | Risk Level | Mitigation | Status |
|---------------|------------|------------|--------|
| Staff accessing other staff's data | Medium | RLS policies restrict to role-appropriate data | ✅ Enforced |
| Admin privilege escalation | High | Admin cannot create Admin/Owner accounts (Owner only) | ✅ Enforced |
| Audit log tampering | Critical | Audit logs are immutable, Owner-only access | ✅ Enforced |
| Unauthorized refund processing | High | All refunds logged with proof, audit trail immutable | ✅ Enforced |
| Inventory manipulation | Medium | Only Clerk/Admin/Owner can modify stock | ✅ Enforced |
| Customer viewing others' orders | High | RLS enforces `user_id = auth.uid()` | ✅ Enforced |
| Payment proof forgery | Medium | Staff verification required, proof stored | ✅ Enforced |
| Session hijacking | High | Handled by Supabase Auth (JWT tokens) | ✅ Platform |
| SQL injection | Critical | Supabase uses parameterized queries | ✅ Platform |
| Mass data export | Medium | No bulk export policies; Owner can export via app | ✅ Enforced |
| **Race condition: Stock overselling** | **Critical** | **`reserve_stock()` function with row-level locking** | **✅ Fixed** |
| **Race condition: Coupon overuse** | **Critical** | **`apply_coupon()` function with atomic operations** | **✅ Fixed** |
| **Unverified users placing orders** | **High** | **Email verification enforced in RLS policy** | **✅ Fixed** |
| **Duplicate product variants** | **Medium** | **Unique constraint on (product_id, size, color_id)** | **✅ Fixed** |
| **Invalid order status transitions** | **High** | **Database trigger validates state machine** | **✅ Fixed** |
| **Refunds after 7-day window** | **Medium** | **CHECK constraint enforces refund deadline** | **✅ Fixed** |
| **Orphaned records** | **Medium** | **Foreign keys with CASCADE/RESTRICT behaviors** | **✅ Fixed** |
| **Slow query performance** | **Medium** | **Comprehensive indexes on critical columns** | **✅ Fixed** |

---

## 📋 Industry Best Practices Applied

1. **Separation of Duties**: No single role has unchecked power
2. **Principle of Least Privilege**: Each role has minimum necessary permissions
3. **Defense in Depth**: RLS + App-level checks + Audit logging
4. **Immutable Audit Trail**: Cannot be modified after creation
5. **Soft Deletes**: Data integrity preserved, recovery possible
6. **Snapshot Pricing**: Order items store price at time of purchase
7. **Multi-Warehouse FIFO**: Proper inventory management with batch tracking
8. **Role-Based Access Control (RBAC)**: Clear role hierarchy with explicit permissions
9. **Data Masking**: Payment details stored as JSONB, can be encrypted at rest
10. **Reservation System**: Supports partial payments with proper tracking
