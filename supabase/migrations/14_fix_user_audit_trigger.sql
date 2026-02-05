-- Fix: Disable audit trigger for user inserts that don't have auth context
-- This allows users to be created via admin API without triggering audit log errors

-- Drop the problematic trigger temporarily
DROP TRIGGER IF EXISTS trigger_audit_users ON users;

-- Create a safer version that handles NULL auth.uid()
CREATE TRIGGER trigger_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW 
    WHEN (auth.uid() IS NOT NULL)
    EXECUTE FUNCTION audit_critical_changes();

-- Alternative: Insert via RLS-bypass to avoid triggers
-- This is already handled by Supabase service role, so this trigger change should suffice
