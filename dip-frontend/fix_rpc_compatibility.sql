-- FIX RPC COMPATIBILITY (Wrapper)
-- This script creates a wrapper function to support both OLD and NEW frontend clients.
-- It resolves PGRST202 (Function not found) and 42702 (Ambiguity) simultaneously.

-- 1. Main Secure Function (Already exists from previous step, but ensuring it's there)
-- This uses p_* parameters to avoid ambiguity with table columns.
CREATE OR REPLACE FUNCTION public.create_user_command(
  p_email text,
  p_password text,
  p_full_name text,
  p_passport_id text,
  p_role text,
  p_permissions jsonb
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
  v_permissions jsonb;
BEGIN
  -- Validate inputs
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email/Username is required';
  END IF;
  
  IF p_password IS NULL OR p_password = '' THEN
    RAISE EXCEPTION 'Password is required';
  END IF;

  -- Normalize permissions
  IF p_permissions IS NULL THEN
    v_permissions := '[]'::jsonb;
  ELSE
    v_permissions := p_permissions;
  END IF;

  -- Format Email
  IF position('@' in p_email) > 0 THEN
    final_email := p_email;
  ELSE
    final_email := p_email || '@dip.system';
  END IF;

  -- Check existence (Safe because p_email != email column)
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
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_instance_id, new_user_id, 'authenticated', 'authenticated', final_email, encrypted_pw, now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', p_full_name),
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
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email), 'email', NULL, now(), now()
    );
  END;

  -- Insert/Update Profile
  INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
  VALUES (new_user_id, p_full_name, p_role, v_permissions, p_passport_id, final_email, TRUE)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      passport_id = EXCLUDED.passport_id,
      email = EXCLUDED.email,
      must_change_password = TRUE;

  RETURN new_user_id;
END;
$$;

-- 2. Compatibility Wrapper (For Old Frontend / Cache)
-- This accepts old parameter names (email, password...) and forwards them to the secure function.
-- Since this function does NOT contain any SQL queries, it won't trigger "ambiguous column" errors.
CREATE OR REPLACE FUNCTION public.create_user_command(
  email text,
  password text,
  full_name text,
  passport_id text,
  role text,
  permissions jsonb
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

-- 3. Grant Permissions for BOTH functions
GRANT EXECUTE ON FUNCTION public.create_user_command(text, text, text, text, text, jsonb) TO authenticated, service_role;
