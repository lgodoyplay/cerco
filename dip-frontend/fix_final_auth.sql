-- FINAL AUTH FIX: Column Types, Identity Schema & Permissions
-- Run this in Supabase SQL Editor to resolve 400/500 errors.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. FIX PERMISSIONS COLUMN TYPE
-- Force 'permissions' to be JSONB. If it was TEXT[], this fixes the 400 error.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS permissions;
ALTER TABLE public.profiles ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;

-- 3. FIX AUTH.IDENTITIES INSERT (Handle different Supabase versions)
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
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
  v_instance_id uuid;
  final_email text;
BEGIN
  -- Validate inputs
  IF email IS NULL OR email = '' THEN
    RAISE EXCEPTION 'Email/Username is required';
  END IF;
  
  IF password IS NULL OR password = '' THEN
    RAISE EXCEPTION 'Password is required';
  END IF;

  -- Format Email
  IF position('@' in email) > 0 THEN
    final_email := email;
  ELSE
    final_email := email || '@dip.system';
  END IF;

  -- Check existence
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = final_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Get Instance ID
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(password, gen_salt('bf'));

  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_instance_id, new_user_id, 'authenticated', 'authenticated', final_email, encrypted_pw, now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', full_name),
    now(), now()
  );

  -- Insert into auth.identities (Try with provider_id first, fallback if column missing)
  BEGIN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email), 'email', final_email, NULL, now(), now()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Fallback for older schema
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email), 'email', NULL, now(), now()
    );
  END;

  -- Insert/Update Profile
  INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
  VALUES (new_user_id, full_name, role, permissions, passport_id, final_email, TRUE)
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

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.create_user_command TO authenticated, service_role;

-- 5. CLEANUP TRIGGERS (To avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
