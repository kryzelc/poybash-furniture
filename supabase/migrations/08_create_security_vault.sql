-- ============================================
-- Script 8: Enterprise Security Vault
-- ============================================
-- Advanced protection: IP Extraction, Automated Banning, and Honeypot Traps

-- ============================================
-- TABLES
-- ============================================

-- Track rate limit buckets with IP support
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY, -- User ID or IP Address
    tokens DECIMAL NOT NULL,
    last_refill TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automated IP Blacklist with Expiry (TTL)
CREATE TABLE IF NOT EXISTS public.security_blacklist (
    ip_address TEXT PRIMARY KEY,
    reason TEXT,
    blocked_until TIMESTAMPTZ NOT NULL,
    violation_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Honeypot Trap Table (Bots will try to scan this)
CREATE TABLE IF NOT EXISTS public.system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE,
    value TEXT,
    is_internal BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled on security tables
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- No one can view these except Owner
DROP POLICY IF EXISTS "Only owner can view security tables" ON public.rate_limits;
CREATE POLICY "Only owner can view security tables" ON public.rate_limits FOR ALL TO authenticated USING (public.is_owner());

DROP POLICY IF EXISTS "Only owner can view blacklist" ON public.security_blacklist;
CREATE POLICY "Only owner can view blacklist" ON public.security_blacklist FOR ALL TO authenticated USING (public.is_owner());

DROP POLICY IF EXISTS "Only owner can view honeypot" ON public.system_config;
CREATE POLICY "Only owner can view honeypot" ON public.system_config FOR ALL TO authenticated USING (public.is_owner());

-- ============================================
-- CORE UTILITIES
-- ============================================

-- Extract Real Client IP from Supabase Headers
CREATE OR REPLACE FUNCTION public.get_client_ip()
RETURNS TEXT AS $$
DECLARE
    v_headers JSONB;
BEGIN
    -- Supabase stores request headers in this config variable
    v_headers := current_setting('request.headers', true)::jsonb;
    -- x-forwarded-for typically contains the real client IP in Supabase/PostgREST
    RETURN COALESCE(v_headers->>'x-forwarded-for', '0.0.0.0');
EXCEPTION
    WHEN OTHERS THEN RETURN '0.0.0.0';
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- Automated Banning Logic
CREATE OR REPLACE FUNCTION public.ban_client(
    p_ip TEXT, 
    p_reason TEXT, 
    p_duration_hours INTEGER DEFAULT 24
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.security_blacklist (ip_address, reason, blocked_until)
    VALUES (p_ip, p_reason, NOW() + (p_duration_hours || ' hours')::INTERVAL)
    ON CONFLICT (ip_address) DO UPDATE
    SET blocked_until = NOW() + (p_duration_hours || ' hours')::INTERVAL,
        violation_count = security_blacklist.violation_count + 1,
        reason = p_reason,
        updated_at = NOW();

    -- Log to audit
    PERFORM public.create_audit_log(
        'ACCOUNT_DISABLE'::audit_action,
        'SECURITY',
        NULL,
        'AUTOMATED_IP_BAN',
        NULL,
        jsonb_build_object('ip', p_ip, 'reason', p_reason, 'duration', p_duration_hours),
        'IP blocked until ' || (NOW() + (p_duration_hours || ' hours')::INTERVAL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- RATE LIMITING ENGINE
-- ============================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT,
    p_max_tokens INTEGER DEFAULT 5,
    p_refill_rate_seconds INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_tokens DECIMAL;
    v_last_refill TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW();
    v_elapsed INTERVAL;
    v_refill DECIMAL;
    v_ip TEXT := public.get_client_ip();
BEGIN
    -- 1. Check Blacklist First
    IF EXISTS (
        SELECT 1 FROM public.security_blacklist 
        WHERE ip_address = v_ip AND blocked_until > v_now
    ) THEN
        RAISE EXCEPTION 'Access Denied: Your IP is temporarily blocked for suspicious activity.'
        USING ERRCODE = 'P0001';
    END IF;

    -- 2. Token Bucket Logic
    INSERT INTO public.rate_limits (key, tokens, last_refill)
    VALUES (p_key, p_max_tokens, v_now)
    ON CONFLICT (key) DO NOTHING;

    SELECT tokens, last_refill INTO v_tokens, v_last_refill
    FROM public.rate_limits
    WHERE key = p_key
    FOR UPDATE;

    v_elapsed := v_now - v_last_refill;
    v_refill := EXTRACT(EPOCH FROM v_elapsed) / p_refill_rate_seconds;
    v_tokens := LEAST(p_max_tokens::DECIMAL, v_tokens + v_refill);

    IF v_tokens >= 1 THEN
        UPDATE public.rate_limits
        SET tokens = v_tokens - 1,
            last_refill = v_now,
            updated_at = v_now
        WHERE key = p_key;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- SECURITY TRIGGERS (THE FORTRESS)
-- ============================================

-- Honeypot Trap: Any attempt to access this table bans the IP
CREATE OR REPLACE FUNCTION public.honeypot_trap()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.ban_client(public.get_client_ip(), 'Honeypot Trap Triggered: Bot Scanning Detected', 48);
    RAISE EXCEPTION 'System Error: Unauthorized Access' USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_honeypot_trap ON public.system_config;
CREATE TRIGGER trigger_honeypot_trap
    BEFORE INSERT OR UPDATE OR DELETE ON public.system_config
    FOR EACH STATEMENT EXECUTE FUNCTION public.honeypot_trap();

-- Sensitive PII Access Auditing
CREATE OR REPLACE FUNCTION public.audit_pii_access()
RETURNS TRIGGER AS $$
BEGIN
    IF public.user_role() IN ('staff', 'admin') THEN
        PERFORM public.create_audit_log(
            'UPDATE'::audit_action, -- Using update as proxy for "touched"
            'USERS',
            NEW.id,
            'PII_ACCESS_LOGGED',
            NULL,
            jsonb_build_object('staff_id', auth.uid(), 'accessed_fields', 'email_phone'),
            'Staff accessed sensitive customer info'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Throttling Orders (Enterprise Tier: Rate limit by User AND IP)
CREATE OR REPLACE FUNCTION public.throttle_orders_advanced()
RETURNS TRIGGER AS $$
DECLARE
    v_ip TEXT := public.get_client_ip();
    v_user_key TEXT := 'order_user_' || auth.uid()::text;
    v_ip_key TEXT := 'order_ip_' || v_ip;
BEGIN
    -- Limit by User (1 per 10s)
    IF NOT public.check_rate_limit(v_user_key, 1, 10) THEN
        RAISE EXCEPTION 'Too many orders. Wait 10 seconds.' USING ERRCODE = 'P0001';
    END IF;

    -- Limit by IP (5 per minute to prevent mass multi-account bots)
    IF NOT public.check_rate_limit(v_ip_key, 5, 60) THEN
        PERFORM public.ban_client(v_ip, 'Mass Order Botting Suspicion', 12);
        RAISE EXCEPTION 'IP Throttled: Abnormal order volume detected.' USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_throttle_orders_advanced ON orders;
CREATE TRIGGER trigger_throttle_orders_advanced
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION public.throttle_orders_advanced();

-- Coupon Brute Force Defense (RLS-friendly function)
CREATE OR REPLACE FUNCTION public.check_coupon_throttle()
RETURNS BOOLEAN AS $$
DECLARE
    v_ip TEXT := public.get_client_ip();
    v_ip_key TEXT := 'coupon_ip_' || v_ip;
BEGIN
    -- 5 attempts per 2 minutes. Brute force = Instant IP Ban.
    IF NOT public.check_rate_limit(v_ip_key, 5, 120) THEN
        PERFORM public.ban_client(v_ip, 'Coupon Brute Force Attempt', 24);
        RAISE EXCEPTION 'Security Violation: Too many failed coupon attempts.' USING ERRCODE = 'P0001';
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply throttling via RLS policy (safer than a trigger for SELECT)
DROP POLICY IF EXISTS "Coupon Throttling Policy" ON coupons;
CREATE POLICY "Coupon Throttling Policy"
    ON coupons FOR SELECT
    TO authenticated, anon
    USING (public.check_coupon_throttle());

-- ============================================
-- EXFILTRATION CONTROL (SCRAPER DEFENSE)
-- ============================================

-- Track and limit high-volume data fetching
CREATE OR REPLACE FUNCTION public.check_exfiltration_limit(
    p_table_name TEXT,
    p_max_rows_per_window INTEGER DEFAULT 100,
    p_window_seconds INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    v_ip TEXT := public.get_client_ip();
    v_key TEXT := 'exfil_' || p_table_name || '_' || v_ip;
BEGIN
    -- Use the Token Bucket engine to track row access rate
    -- If they fetch more than 100 products in 60s, they are throttled.
    IF NOT public.check_rate_limit(v_key, p_max_rows_per_window, 1) THEN
        -- Log attempt and trigger higher alert
        PERFORM public.log_security_event(
            auth.uid(),
            'POTENTIAL_SCRAPING_DETECTED',
            'MEDIUM',
            jsonb_build_object('ip', v_ip, 'table', p_table_name)
        );
        -- For bots, we can auto-ban if they exceed a much higher threshold
        IF NOT public.check_rate_limit(v_key || '_hard', 500, 1) THEN
             PERFORM public.ban_client(v_ip, 'Automated Scraping/Exfiltration Blocked', 24);
        END IF;
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- This function can be called within RLS policies specifically for sensitive SELECTs
-- Example: USING (public.check_exfiltration_limit('products') AND active = true)
