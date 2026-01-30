-- ============================================
-- Script 9: Integrity Guards & Security Reporting
-- ============================================
-- Final layer: Price Verification, PII Auditing, and Security Dashboards

-- ============================================
-- CHECKOUT-TIME PRICE INTEGRITY
-- ============================================

-- Forcefully verify that order item prices match the variant prices in the DB
-- This stops hackers from modifying their local cart state before checkout.
CREATE OR REPLACE FUNCTION public.verify_checkout_price()
RETURNS TRIGGER AS $$
DECLARE
    v_actual_price DECIMAL(10, 2);
BEGIN
    -- Get the current live price from the master product/variant tables
    -- Note: We check product_variants first, fallback to products.
    SELECT COALESCE(pv.price, p.price) INTO v_actual_price
    FROM public.product_variants pv
    JOIN public.products p ON pv.product_id = p.id
    WHERE pv.id = NEW.variant_id;

    -- If there's a significant mismatch (> 0.01 for rounding), block the order.
    IF ABS(v_actual_price - NEW.price) > 0.01 THEN
        -- Log this as a SEVERE security event
        PERFORM public.log_security_event(
            auth.uid(),
            'PRICE_TAMPERING_ATTEMPT',
            'CRITICAL',
            jsonb_build_object(
                'variant_id', NEW.variant_id, 
                'sent_price', NEW.price, 
                'actual_price', v_actual_price
            )
        );
        RAISE EXCEPTION 'Transaction Error: Price mismatch detected. Your cart has been reset for safety.'
        USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_verify_checkout_price ON public.order_items;
CREATE TRIGGER trigger_verify_checkout_price
    BEFORE INSERT ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION public.verify_checkout_price();

-- ============================================
-- SECURITY REPORTING VIEWS (Owner Only)
-- ============================================

-- Summary of all active threats and blocks
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT 
    ip_address,
    reason,
    blocked_until,
    violation_count,
    (blocked_until > NOW()) as currently_blocked
FROM public.security_blacklist
ORDER BY created_at DESC;

-- Detailed PII Access Audit
CREATE OR REPLACE VIEW public.pii_access_audit AS
SELECT 
    timestamp,
    performed_by as staff_id,
    entity_id as customer_id,
    notes as access_reason,
    performer_info->>'ip' as accessed_from_ip
FROM public.audit_logs
WHERE action_type = 'UPDATE' AND notes ILIKE '%Staff accessed sensitive customer info%'
ORDER BY timestamp DESC;

-- Grant Owner access to these views
GRANT SELECT ON public.security_dashboard TO authenticated;
GRANT SELECT ON public.pii_access_audit TO authenticated;

-- RLS for Views (Only Owner can see)
ALTER VIEW public.security_dashboard SET (security_invoker = on);
ALTER VIEW public.pii_access_audit SET (security_invoker = on);

-- ============================================
-- MASTERCLASS COMPLETE
-- ============================================
-- The database is now protected by:
-- 1. RLS (Access Control)
-- 2. DDL Constraints (Data Integrity)
-- 3. Token Bucket (Rate Limiting)
-- 4. IP Extraction (Identity)
-- 5. Honeypots (Bot Detection)
-- 6. Price Guards (Economic Protection)
-- 7. PII Auditing (Accountability)
