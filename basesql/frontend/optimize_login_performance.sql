-- OPTIMIZE LOGIN PERFORMANCE
-- This script adds indices and optimizes functions to speed up login.

-- 1. Add Indices to Profiles for fast lookup
-- These indices are critical for the 'get_email_by_identifier' RPC and RLS policies.
CREATE INDEX IF NOT EXISTS idx_profiles_passport_id ON public.profiles(passport_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role); -- Speeds up RLS checks (ILIKE '%Admin%')

-- 2. Optimize get_email_by_identifier
-- Uses indices and optimized logic.
CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  -- 1. Try exact match on passport_id (Fastest, uses Index)
  SELECT email INTO v_email 
  FROM public.profiles 
  WHERE passport_id = identifier 
  LIMIT 1;
  
  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- 2. Try match on email prefix (common for usernames)
  -- 'identifier' here is likely 'john' trying to find 'john@dip.system'
  SELECT email INTO v_email 
  FROM public.profiles 
  WHERE email ILIKE identifier || '@%' 
  LIMIT 1;

  RETURN v_email;
END;
$$;

-- 3. Ensure no heavy triggers on auth.users (Cleanup)
-- We strictly only want 'on_auth_user_created' for new users.
-- 'on_auth_user_updated' is often a cause of slow logins if it syncs to profiles on every login (last_sign_in_at update).
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
DROP TRIGGER IF EXISTS sync_profile ON auth.users;

-- 4. Refresh Database Statistics
-- Helps the query planner choose the new indices.
ANALYZE public.profiles;
ANALYZE auth.users;
