-- ============================================
-- Script 7: Seed Test User Accounts
-- ============================================
-- Run this after setting up RLS policies
-- Creates test accounts for each role

-- Note: In Supabase, user authentication is handled by auth.users table
-- We need to create users in both auth.users and public.users

-- For now, we'll create entries in public.users
-- You'll need to create actual auth accounts through Supabase Dashboard or API

-- Insert test users into public.users table
-- These IDs should match the auth.users IDs you create in Supabase Auth

-- Customer account
INSERT INTO users (id, email, first_name, last_name, phone, role, active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'customer@poybash.com',
    'John',
    'Customer',
    '+63 912 345 6789',
    'customer',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Sales Staff account
INSERT INTO users (id, email, first_name, last_name, phone, role, active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'sales@poybash.com',
    'Maria',
    'Sales',
    '+63 912 345 6790',
    'staff',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Inventory Clerk account
INSERT INTO users (id, email, first_name, last_name, phone, role, active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000003'::uuid,
    'clerk@poybash.com',
    'Pedro',
    'Clerk',
    '+63 912 345 6791',
    'inventory-clerk',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Admin account
INSERT INTO users (id, email, first_name, last_name, phone, role, active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000004'::uuid,
    'admin@poybash.com',
    'Ana',
    'Admin',
    '+63 912 345 6792',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Owner account
INSERT INTO users (id, email, first_name, last_name, phone, role, active, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000005'::uuid,
    'owner@poybash.com',
    'Carlos',
    'Owner',
    '+63 912 345 6793',
    'owner',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- IMPORTANT: Creating Auth Users
-- ============================================
-- After running this script, you need to create actual authentication accounts
-- in Supabase. Here's how:

-- Option 1: Using Supabase Dashboard
-- 1. Go to Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. For each test account:
--    - Email: customer@poybash.com (etc.)
--    - Password: customer123 (etc.)
--    - Auto Confirm User: YES (check this box)
--    - User UID: Copy the UUID from above (e.g., 00000000-0000-0000-0000-000000000001)
-- 4. Click "Create user"

-- Option 2: Using SQL (requires service role key)
-- You can use the Supabase API or run this in SQL Editor with service role:
/*
-- This is just an example - you'll need to use Supabase's auth.users table
-- or the Supabase Admin API to create auth users with specific UUIDs

-- For development, it's easier to:
-- 1. Create users through the dashboard with auto-generated UUIDs
-- 2. Then update the public.users table to match those UUIDs
-- 3. Or use Supabase's signUp() function from your app
*/

-- ============================================
-- Alternative: Let users sign up and update their role
-- ============================================
-- If you want to let the frontend handle user creation,
-- you can create a function to update user roles after signup:

CREATE OR REPLACE FUNCTION update_user_role_after_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new user signs up via Supabase Auth,
    -- create a corresponding entry in public.users
    INSERT INTO public.users (id, email, first_name, last_name, role, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'customer', -- Default role
        NEW.email_confirmed_at IS NOT NULL
    )
    ON CONFLICT (id) DO UPDATE
    SET email_verified = NEW.email_confirmed_at IS NOT NULL,
        email_verified_at = NEW.email_confirmed_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (this is in the auth schema)
-- Note: This requires superuser privileges, so you may need to run it
-- through Supabase Dashboard SQL Editor
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION update_user_role_after_signup();
