-- ============================================
-- Database Monitoring & Performance Tracking
-- ============================================
-- Run these queries to monitor your database health

-- ============================================
-- 1. ENABLE PERFORMANCE MONITORING
-- ============================================

-- Enable pg_stat_statements extension (run as superuser/owner)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- 2. SLOW QUERY DETECTION
-- ============================================

-- View showing slowest queries in the last 24 hours
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    ROUND(total_exec_time::numeric, 2) as total_time_ms,
    calls,
    ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
    ROUND(max_exec_time::numeric, 2) as max_time_ms,
    query
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
    AND query NOT LIKE '%pg_catalog%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Grant access to admin/owner
GRANT SELECT ON slow_queries TO authenticated;

-- ============================================
-- 3. TABLE SIZE MONITORING
-- ============================================

CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

GRANT SELECT ON table_sizes TO authenticated;

-- ============================================
-- 4. INDEX USAGE STATISTICS
-- ============================================

CREATE OR REPLACE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

GRANT SELECT ON index_usage TO authenticated;

-- ============================================
-- 5. ACTIVE CONNECTIONS MONITOR
-- ============================================

CREATE OR REPLACE VIEW active_connections AS
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    NOW() - query_start as query_duration,
    wait_event_type,
    wait_event,
    LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE datname = current_database()
    AND pid <> pg_backend_pid()
ORDER BY query_start DESC;

GRANT SELECT ON active_connections TO authenticated;

-- ============================================
-- 6. CACHE HIT RATIO (Should be >99%)
-- ============================================

CREATE OR REPLACE VIEW cache_hit_ratio AS
SELECT 
    'Cache Hit Ratio' as metric,
    ROUND(
        sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0), 
        2
    ) as percentage,
    CASE 
        WHEN ROUND(sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) > 99 THEN '✅ Excellent'
        WHEN ROUND(sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) > 95 THEN '⚠️ Good'
        ELSE '❌ Poor - Increase shared_buffers'
    END as status
FROM pg_stat_database
WHERE datname = current_database();

GRANT SELECT ON cache_hit_ratio TO authenticated;

-- ============================================
-- 7. AUDIT LOG STATISTICS
-- ============================================

CREATE OR REPLACE VIEW audit_statistics AS
SELECT 
    DATE(timestamp) as date,
    action_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT performed_by) as unique_users
FROM audit_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), action_type
ORDER BY date DESC, event_count DESC;

GRANT SELECT ON audit_statistics TO authenticated;

-- ============================================
-- 8. INVENTORY HEALTH CHECK
-- ============================================

CREATE OR REPLACE VIEW inventory_health AS
SELECT 
    'Total Products' as metric,
    COUNT(*)::TEXT as value
FROM products WHERE active = true
UNION ALL
SELECT 
    'Low Stock Variants',
    COUNT(*)::TEXT
FROM warehouse_stock
WHERE (quantity - reserved) <= 10 AND (quantity - reserved) > 0
UNION ALL
SELECT 
    'Out of Stock Variants',
    COUNT(*)::TEXT
FROM warehouse_stock
WHERE (quantity - reserved) = 0
UNION ALL
SELECT 
    'Total Reserved Stock',
    SUM(reserved)::TEXT
FROM warehouse_stock;

GRANT SELECT ON inventory_health TO authenticated;

-- ============================================
-- 9. ORDER PROCESSING METRICS
-- ============================================

CREATE OR REPLACE VIEW order_metrics AS
SELECT 
    status,
    COUNT(*) as order_count,
    SUM(total) as total_revenue,
    AVG(total) as avg_order_value,
    MIN(created_at) as oldest_order,
    MAX(created_at) as newest_order
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'confirmed' THEN 2
        WHEN 'processing' THEN 3
        WHEN 'ready' THEN 4
        WHEN 'completed' THEN 5
        WHEN 'cancelled' THEN 6
        WHEN 'refunded' THEN 7
    END;

GRANT SELECT ON order_metrics TO authenticated;

-- ============================================
-- 10. SECURITY ALERTS DASHBOARD
-- ============================================

CREATE OR REPLACE VIEW security_alerts AS
SELECT 
    timestamp,
    action_type,
    entity_name,
    performer_info->>'email' as user_email,
    performer_info->>'role' as user_role,
    ip_address,
    notes
FROM audit_logs
WHERE action_type IN ('ACCOUNT_DISABLE', 'ACCOUNT_ENABLE', 'ROLE_CHANGE')
    OR notes ILIKE '%security%'
    OR notes ILIKE '%ban%'
ORDER BY timestamp DESC
LIMIT 100;

GRANT SELECT ON security_alerts TO authenticated;

-- ============================================
-- 11. DAILY PERFORMANCE SNAPSHOT
-- ============================================

CREATE OR REPLACE FUNCTION get_daily_performance_snapshot()
RETURNS TABLE(
    metric TEXT,
    value TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Cache hit ratio
    SELECT 
        'Cache Hit Ratio'::TEXT,
        ROUND(sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2)::TEXT || '%',
        CASE 
            WHEN ROUND(sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) > 99 THEN '✅'
            WHEN ROUND(sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) > 95 THEN '⚠️'
            ELSE '❌'
        END
    FROM pg_stat_database
    WHERE datname = current_database()
    
    UNION ALL
    
    -- Database size
    SELECT 
        'Database Size'::TEXT,
        pg_size_pretty(pg_database_size(current_database())),
        '📊'::TEXT
    
    UNION ALL
    
    -- Active connections
    SELECT 
        'Active Connections'::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) < 20 THEN '✅'
            WHEN COUNT(*) < 50 THEN '⚠️'
            ELSE '❌'
        END
    FROM pg_stat_activity
    WHERE datname = current_database()
    
    UNION ALL
    
    -- Today's orders
    SELECT 
        'Orders Today'::TEXT,
        COUNT(*)::TEXT,
        '🛒'::TEXT
    FROM orders
    WHERE DATE(created_at) = CURRENT_DATE
    
    UNION ALL
    
    -- Pending payments
    SELECT 
        'Pending Payments'::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN '✅'
            WHEN COUNT(*) < 10 THEN '⚠️'
            ELSE '❌'
        END
    FROM orders
    WHERE payment_status = 'pending'
    
    UNION ALL
    
    -- Low stock alerts
    SELECT 
        'Low Stock Alerts'::TEXT,
        COUNT(*)::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN '✅'
            ELSE '⚠️'
        END
    FROM warehouse_stock
    WHERE (quantity - reserved) <= 10 AND (quantity - reserved) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 12. ALERT FUNCTIONS
-- ============================================

-- Function to check if any critical alerts exist
CREATE OR REPLACE FUNCTION has_critical_alerts()
RETURNS BOOLEAN AS $$
DECLARE
    v_has_alerts BOOLEAN := false;
BEGIN
    -- Check for out of stock on featured products
    IF EXISTS (
        SELECT 1 
        FROM products p
        JOIN product_variants pv ON p.id = pv.product_id
        LEFT JOIN warehouse_stock ws ON pv.id = ws.variant_id
        WHERE p.featured = true 
            AND p.active = true
            AND COALESCE((ws.quantity - ws.reserved), 0) = 0
    ) THEN
        v_has_alerts := true;
    END IF;
    
    -- Check for pending payments older than 24 hours
    IF EXISTS (
        SELECT 1 FROM orders
        WHERE payment_status = 'pending'
            AND created_at < NOW() - INTERVAL '24 hours'
    ) THEN
        v_has_alerts := true;
    END IF;
    
    -- Check for cache hit ratio below 95%
    IF (
        SELECT ROUND(sum(blks_hit) * 100.0 / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2)
        FROM pg_stat_database
        WHERE datname = current_database()
    ) < 95 THEN
        v_has_alerts := true;
    END IF;
    
    RETURN v_has_alerts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================

-- Run this daily to check system health:
-- SELECT * FROM get_daily_performance_snapshot();

-- Check for critical issues:
-- SELECT has_critical_alerts();

-- View slow queries:
-- SELECT * FROM slow_queries;

-- Monitor inventory:
-- SELECT * FROM inventory_health;

-- Check security events:
-- SELECT * FROM security_alerts;
