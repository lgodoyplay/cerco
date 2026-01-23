-- MASTER RESET: USER SYSTEM & LOGIN FIX
-- Run this script in Supabase SQL Editor to completely repair the authentication system.

-- 1. CLEANUP: Drop potentially broken triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_email_sync();
DROP FUNCTION IF EXISTS public.create_user_command(text, text, text, text, text, jsonb);

-- 2. EXTENSIONS & PERMISSIONS
-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
-- Ensure permissions on public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- 3. SETUP TABLES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'Agente DPF';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions jsonb;

-- 4. TRIGGER FUNCTION: Handle New User (Robust)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Agente'), 
    'Agente DPF',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN new;
END;
$$;

-- 5. TRIGGER: Bind to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. RPC: Create User Command (Fixes 400/500 Errors)
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

  -- Format Email (Auto-append domain if needed)
  IF position('@' in email) > 0 THEN
    final_email := email;
  ELSE
    final_email := email || '@dip.system';
  END IF;

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = final_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Get Instance ID (Safe Fallback)
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

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email), 'email', NULL, now(), now()
  );

  -- Force Profile Update (in case trigger missed or we need more fields)
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

-- 7. REPAIR DATA: Fix broken users
DO $$
DECLARE
  real_instance_id uuid;
BEGIN
  -- Get valid instance_id
  SELECT instance_id INTO real_instance_id FROM auth.users WHERE instance_id != '00000000-0000-0000-0000-000000000000' LIMIT 1;
  
  IF real_instance_id IS NOT NULL THEN
    UPDATE auth.users 
    SET instance_id = real_instance_id 
    WHERE instance_id = '00000000-0000-0000-0000-000000000000';
  END IF;

  -- Fix invalid emails
  UPDATE auth.users
  SET email = email || '@dip.system'
  WHERE position('@' in email) = 0;
  
  -- Sync Profiles
  UPDATE public.profiles
  SET email = auth.users.email
  FROM auth.users
  WHERE public.profiles.id = auth.users.id
  AND (public.profiles.email IS NULL OR public.profiles.email != auth.users.email);
END $$;
