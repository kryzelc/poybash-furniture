-- ============================================
-- Automated Maintenance Jobs (Cron Setup)
-- ============================================
-- These jobs should run automatically via pg_cron extension

-- ============================================
-- ENABLE PG_CRON EXTENSION
-- ============================================
-- Run this as superuser (Supabase dashboard > SQL Editor)

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- JOB 1: Refresh Materialized Views (Every Hour)
-- ============================================

SELECT cron.schedule(
    'refresh-analytics-views',
    '0 * * * *', -- Every hour at minute 0
    $$SELECT refresh_all_materialized_views()$$
);

-- ============================================
-- JOB 2: Clean Up Expired Carts (Daily at 2 AM)
-- ============================================

SELECT cron.schedule(
    'cleanup-expired-carts',
    '0 2 * * *', -- Daily at 2:00 AM
    $$SELECT cleanup_expired_carts()$$
);

-- ============================================
-- JOB 3: Clean Up Old Blacklist Entries (Daily at 3 AM)
-- ============================================

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_blacklist()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM security_blacklist
    WHERE blocked_until < NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

SELECT cron.schedule(
    'cleanup-expired-blacklist',
    '0 3 * * *', -- Daily at 3:00 AM
    $$SELECT cleanup_expired_blacklist()$$
);

-- ============================================
-- JOB 4: Low Stock Notifications (Daily at 8 AM)
-- ============================================

CREATE OR REPLACE FUNCTION send_low_stock_notifications()
RETURNS INTEGER AS $$
DECLARE
    v_admin_ids UUID[];
    v_admin_id UUID;
    v_low_stock_count INTEGER;
BEGIN
    -- Count low stock items
    SELECT COUNT(*) INTO v_low_stock_count
    FROM warehouse_stock
    WHERE (quantity - reserved) <= 10 AND (quantity - reserved) > 0;
    
    IF v_low_stock_count = 0 THEN
        RETURN 0;
    END IF;
    
    -- Get all admin and owner user IDs
    SELECT ARRAY_AGG(id) INTO v_admin_ids
    FROM users
    WHERE role IN ('admin', 'owner', 'inventory-clerk')
        AND active = true;
    
    -- Send notification to each admin
    FOREACH v_admin_id IN ARRAY v_admin_ids
    LOOP
        INSERT INTO user_notifications (user_id, type, message, details)
        VALUES (
            v_admin_id,
            'low_stock_alert',
            'Low stock alert: ' || v_low_stock_count || ' variants need restocking.',
            jsonb_build_object('count', v_low_stock_count, 'priority', 'medium')::text
        );
    END LOOP;
    
    RETURN v_low_stock_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

SELECT cron.schedule(
    'low-stock-notifications',
    '0 8 * * *', -- Daily at 8:00 AM
    $$SELECT send_low_stock_notifications()$$
);

-- ============================================
-- JOB 5: Pending Payment Reminders (Every 6 Hours)
-- ============================================

CREATE OR REPLACE FUNCTION send_pending_payment_reminders()
RETURNS INTEGER AS $$
DECLARE
    v_order RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Find orders with pending payments older than 6 hours
    FOR v_order IN
        SELECT id, user_id, order_number, total
        FROM orders
        WHERE payment_status = 'pending'
            AND status = 'pending'
            AND created_at BETWEEN NOW() - INTERVAL '48 hours' AND NOW() - INTERVAL '6 hours'
    LOOP
        INSERT INTO user_notifications (user_id, type, message, details)
        VALUES (
            v_order.user_id,
            'warning',
            'Payment pending for order ' || v_order.order_number || '. Please upload your payment proof.',
            jsonb_build_object('order_id', v_order.id, 'amount', v_order.total)::text
        );
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

SELECT cron.schedule(
    'pending-payment-reminders',
    '0 */6 * * *', -- Every 6 hours
    $$SELECT send_pending_payment_reminders()$$
);

-- ============================================
-- JOB 6: Database Performance Report (Weekly)
-- ============================================

CREATE OR REPLACE FUNCTION generate_weekly_performance_report()
RETURNS VOID AS $$
DECLARE
    v_report TEXT;
    v_owner_ids UUID[];
    v_owner_id UUID;
BEGIN
    -- Generate report
    v_report := 'Weekly Database Performance Report\n\n';
    v_report := v_report || 'Total Orders: ' || (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '7 days')::TEXT || '\n';
    v_report := v_report || 'Total Revenue: ₱' || (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '7 days')::TEXT || '\n';
    v_report := v_report || 'Average Order Value: ₱' || (SELECT COALESCE(AVG(total), 0)::NUMERIC(10,2) FROM orders WHERE created_at >= NOW() - INTERVAL '7 days')::TEXT || '\n';
    v_report := v_report || 'New Customers: ' || (SELECT COUNT(*) FROM users WHERE role = 'customer' AND created_at >= NOW() - INTERVAL '7 days')::TEXT || '\n';
    
    -- Get owner IDs
    SELECT ARRAY_AGG(id) INTO v_owner_ids
    FROM users
    WHERE role = 'owner' AND active = true;
    
    -- Send to owners
    FOREACH v_owner_id IN ARRAY v_owner_ids
    LOOP
        INSERT INTO user_notifications (user_id, type, message, details)
        VALUES (
            v_owner_id,
            'system_announcement',
            'Weekly Performance Report Available',
            v_report
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

SELECT cron.schedule(
    'weekly-performance-report',
    '0 9 * * 1', -- Every Monday at 9:00 AM
    $$SELECT generate_weekly_performance_report()$$
);

-- ============================================
-- JOB 7: Vacuum Analyze (Daily at 4 AM)
-- ============================================
-- Keeps database statistics up to date for query optimizer

SELECT cron.schedule(
    'vacuum-analyze',
    '0 4 * * *', -- Daily at 4:00 AM
    $$VACUUM ANALYZE$$
);

-- ============================================
-- VIEW ALL SCHEDULED JOBS
-- ============================================

-- Check which jobs are scheduled
-- SELECT * FROM cron.job;

-- Check job execution history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- ============================================
-- MANUAL JOB CONTROLS
-- ============================================

-- Run a job immediately:
-- SELECT cron.unschedule('job-name');
-- SELECT cron.schedule('job-name', 'schedule', 'command');

-- Delete a job:
-- SELECT cron.unschedule('cleanup-expired-carts');

-- ============================================
-- ALTERNATIVE: If pg_cron is not available
-- ============================================
-- Use Supabase Edge Functions with scheduled triggers
-- Or call these functions from your application cron

-- Example: Call from application every hour
-- POST https://your-project.supabase.co/functions/v1/run-maintenance
-- Body: { "action": "refresh_views" }
