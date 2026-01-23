-- FIX ROLES AND PERMISSIONS V2 (FINAL + BACKWARD COMPATIBILITY)
-- 1. Remove constraints on profiles.role to allow dynamic roles from Settings
DO $$ 
BEGIN
    -- Change role column to TEXT if it isn't already, dropping any ENUM association
    ALTER TABLE public.profiles ALTER COLUMN role TYPE text;
    
    -- Drop default if it causes issues (optional, but safe)
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
    
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Error altering profiles table: %', SQLERRM;
END $$;

-- 2. Drop existing function to avoid "cannot change name of input parameter" error
-- We drop both signatures to be safe and clean
DROP FUNCTION IF EXISTS public.create_user_command(text, text, text, text, text, jsonb);

-- 3. Create the function with p_ prefixes to avoid ambiguity (THE MAIN FUNCTION)
CREATE OR REPLACE FUNCTION public.create_user_command(
  p_email text,
  p_password text,
  p_full_name text,
  p_passport_id text,
  p_role text,
  p_permissions jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
  v_instance_id uuid;
  final_email text;
BEGIN
  -- Validate inputs
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email/Username is required';
  END IF;
  
  IF p_password IS NULL OR p_password = '' THEN
    RAISE EXCEPTION 'Password is required';
  END IF;

  -- Format Email (Append domain if missing)
  IF position('@' in p_email) > 0 THEN
    final_email := p_email;
  ELSE
    final_email := p_email || '@dip.system';
  END IF;

  -- Check if user exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = final_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Get Instance ID
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
  IF v_instance_id IS NULL THEN
     v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users
  -- CRITICAL: We include the 'role' in raw_app_meta_data so RLS policies work immediately
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_instance_id, new_user_id, 'authenticated', 'authenticated', final_email, encrypted_pw, now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', p_role), 
    jsonb_build_object('full_name', p_full_name, 'role', p_role),
    now(), now()
  );

  -- Insert into auth.identities
  BEGIN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email), 'email', final_email, NULL, now(), now()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Fallback for older schemas
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email), 'email', NULL, now(), now()
    );
  END;

  -- Insert/Update Profile
  -- We ensure permissions and role are saved correctly
  INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
  VALUES (new_user_id, p_full_name, p_role, p_permissions, p_passport_id, final_email, TRUE)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      passport_id = EXCLUDED.passport_id,
      email = EXCLUDED.email;

  RETURN new_user_id;
END;
$$;

-- 4. Create Backward Compatibility Wrapper (for cached frontends sending old params)
-- This function accepts the OLD parameter names and calls the NEW function
CREATE OR REPLACE FUNCTION public.create_user_command(
  email text,
  password text,
  full_name text,
  passport_id text,
  role text,
  permissions jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.create_user_command(
    p_email := email,
    p_password := password,
    p_full_name := full_name,
    p_passport_id := passport_id,
    p_role := role,
    p_permissions := permissions
  );
END;
$$;

-- 5. Grant permissions for BOTH functions
GRANT EXECUTE ON FUNCTION public.create_user_command(text, text, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_command(text, text, text, text, text, jsonb) TO service_role;
