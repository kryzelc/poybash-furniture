-- ============================================
-- Script 5: Create Materialized Views
-- ============================================
-- Run this after creating tables and indexes
-- These views optimize dashboard and analytics queries

-- ============================================
-- DAILY SALES SUMMARY
-- ============================================

-- Fast dashboard queries without hitting main tables
-- Refresh: Every hour or on-demand
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT 
    DATE(created_at) as sale_date,
    status,
    COUNT(*) as order_count,
    SUM(total) as total_revenue,
    SUM(coupon_discount) as total_discounts,
    AVG(total) as avg_order_value,
    MIN(total) as min_order_value,
    MAX(total) as max_order_value
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at), status;

CREATE UNIQUE INDEX idx_daily_sales_date_status ON daily_sales_summary(sale_date, status);
CREATE INDEX idx_daily_sales_date ON daily_sales_summary(sale_date DESC);

-- ============================================
-- PRODUCT PERFORMANCE
-- ============================================

-- Product sales analytics (refresh daily)
CREATE MATERIALIZED VIEW product_performance AS
SELECT 
    p.id,
    p.name,
    p.category_id,
    mc.name as category_name,
    COUNT(DISTINCT oi.order_id) as times_ordered,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.price * oi.quantity) as total_revenue,
    AVG(oi.price) as avg_selling_price,
    MAX(o.created_at) as last_ordered_at
FROM products p
LEFT JOIN main_categories mc ON p.category_id = mc.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('completed', 'ready')
    AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.id, p.name, p.category_id, mc.name;

CREATE UNIQUE INDEX idx_product_perf_id ON product_performance(id);
CREATE INDEX idx_product_perf_revenue ON product_performance(total_revenue DESC);
CREATE INDEX idx_product_perf_category ON product_performance(category_id, total_revenue DESC);

-- ============================================
-- INVENTORY ALERTS
-- ============================================

-- Low stock alerts (refresh every 15 minutes)
CREATE MATERIALIZED VIEW low_stock_alerts AS
SELECT 
    pv.id as variant_id,
    pv.sku,
    p.name as product_name,
    pv.size,
    c.name as color_name,
    w.name as warehouse_name,
    ws.quantity,
    ws.reserved,
    (ws.quantity - ws.reserved) as available,
    CASE 
        WHEN (ws.quantity - ws.reserved) = 0 THEN 'OUT_OF_STOCK'
        WHEN (ws.quantity - ws.reserved) <= 5 THEN 'CRITICAL'
        WHEN (ws.quantity - ws.reserved) <= 10 THEN 'LOW'
        ELSE 'OK'
    END as stock_status
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
LEFT JOIN colors c ON pv.color_id = c.id
JOIN warehouse_stock ws ON pv.id = ws.variant_id
JOIN warehouses w ON ws.warehouse_id = w.id
WHERE pv.active = true 
    AND p.active = true
    AND (ws.quantity - ws.reserved) <= 10;

CREATE UNIQUE INDEX idx_low_stock_variant_warehouse ON low_stock_alerts(variant_id, warehouse_name);
CREATE INDEX idx_low_stock_status ON low_stock_alerts(stock_status);

-- ============================================
-- CUSTOMER LIFETIME VALUE
-- ============================================

-- Customer analytics (refresh daily)
CREATE MATERIALIZED VIEW customer_lifetime_value AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total) as lifetime_value,
    AVG(o.total) as avg_order_value,
    MIN(o.created_at) as first_order_at,
    MAX(o.created_at) as last_order_at,
    CASE 
        WHEN MAX(o.created_at) >= CURRENT_DATE - INTERVAL '30 days' THEN 'ACTIVE'
        WHEN MAX(o.created_at) >= CURRENT_DATE - INTERVAL '90 days' THEN 'AT_RISK'
        ELSE 'INACTIVE'
    END as customer_status
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status IN ('completed', 'ready')
    AND u.role = 'customer'
GROUP BY u.id, u.email, u.first_name, u.last_name;

CREATE UNIQUE INDEX idx_clv_user_id ON customer_lifetime_value(user_id);
CREATE INDEX idx_clv_lifetime_value ON customer_lifetime_value(lifetime_value DESC);
CREATE INDEX idx_clv_status ON customer_lifetime_value(customer_status);

-- ============================================
-- REFRESH FUNCTIONS
-- ============================================

-- Refresh all materialized views (call this from a cron job)
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY low_stock_alerts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY customer_lifetime_value;
END;
$$ LANGUAGE plpgsql;

-- Refresh specific view
CREATE OR REPLACE FUNCTION refresh_sales_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
END;
$$ LANGUAGE plpgsql;
