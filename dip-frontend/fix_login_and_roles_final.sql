-- FIX LOGIN AND ROLES (FINAL & COMPLETE)
-- This script resets the user creation and login flow to ensure everything works.
-- It resolves:
-- 1. 500 Errors on Login (usually due to bad triggers or permission issues)
-- 2. "Database error querying schema" (usually due to RPC or schema cache)
-- 3. Incorrect Role Assignment (ensures role is synced from metadata)

-- 1. CLEANUP: Drop existing functions to avoid conflicts
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP FUNCTION IF EXISTS public.create_user_command(text, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.create_user_command(text, text, text, text, text, jsonb, text); -- Just in case
DROP FUNCTION IF EXISTS public.get_email_by_identifier(text);

-- 2. TABLE FIXES: Ensure profiles table is correct
DO $$ 
BEGIN
    -- Ensure role is text
    ALTER TABLE public.profiles ALTER COLUMN role TYPE text;
    -- Drop default if exists
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
EXCEPTION WHEN OTHERS THEN 
    NULL;
END $$;

-- 3. TRIGGER FUNCTION: Handle New User (Robust Version)
-- This runs automatically when a user is inserted into auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_role text;
    v_full_name text;
    v_passport_id text;
    v_permissions jsonb;
BEGIN
    -- Extract data from metadata (safely)
    v_role := new.raw_user_meta_data->>'role';
    v_full_name := new.raw_user_meta_data->>'full_name';
    v_passport_id := new.raw_user_meta_data->>'passport_id';
    v_permissions := COALESCE(new.raw_user_meta_data->'permissions', '[]'::jsonb);

    -- Default values if missing
    IF v_role IS NULL THEN v_role := 'Agente'; END IF;
    IF v_full_name IS NULL THEN v_full_name := 'Novo Usuário'; END IF;
    
    -- Insert into public.profiles
    INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
    VALUES (
        new.id,
        v_full_name,
        v_role,
        v_permissions,
        v_passport_id,
        new.email,
        FALSE -- Default to false, can be set to true by admin command
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        passport_id = EXCLUDED.passport_id,
        email = EXCLUDED.email;

    RETURN new;
END;
$$;

-- 4. TRIGGER: Ensure the trigger exists and is correct
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RPC: Create User Command (The Main Function)
-- Used by the Admin Panel to create users
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
  IF p_email IS NULL OR p_email = '' THEN RAISE EXCEPTION 'Email/Username is required'; END IF;
  IF p_password IS NULL OR p_password = '' THEN RAISE EXCEPTION 'Password is required'; END IF;

  -- Format Email
  IF position('@' in p_email) > 0 THEN
    final_email := LOWER(p_email);
  ELSE
    final_email := LOWER(p_email) || '@dip.system';
  END IF;

  -- Check existence
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = final_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Get Instance ID (Standard Supabase)
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
  IF v_instance_id IS NULL THEN
     v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users
  -- This will trigger 'on_auth_user_created' which populates public.profiles
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    is_super_admin
  ) VALUES (
    v_instance_id, new_user_id, 'authenticated', 'authenticated', final_email, encrypted_pw, now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', p_role), 
    jsonb_build_object('full_name', p_full_name, 'role', p_role, 'passport_id', p_passport_id, 'permissions', p_permissions),
    now(), now(),
    FALSE
  );

  -- Insert into auth.identities (Crucial for Login)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email), 'email', final_email, NULL, now(), now()
  );

  -- Force update profiles (Double safety, in case trigger missed something or we want to ensure exact values)
  -- The trigger handles it, but this doesn't hurt and ensures consistency with the command arguments
  INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
  VALUES (new_user_id, p_full_name, p_role, p_permissions, p_passport_id, final_email, TRUE)
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

-- 6. RPC: Backward Compatibility Wrapper
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

-- 7. RPC: Get Email By Identifier (For Smart Login)
CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  -- Try to find by passport_id
  SELECT email INTO v_email FROM public.profiles WHERE passport_id = identifier LIMIT 1;
  
  -- If not found, try by username (which we store in email usually, but maybe full_name?)
  IF v_email IS NULL THEN
     -- Assuming username might be part of email
     SELECT email INTO v_email FROM public.profiles WHERE email ILIKE identifier || '@%' LIMIT 1;
  END IF;

  RETURN v_email;
END;
$$;

-- 8. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.create_user_command(text, text, text, text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_user_command(text, text, text, text, text, jsonb, text) TO authenticated, service_role; -- If older signature exists
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO anon, authenticated, service_role;

-- 9. Refresh Schema Cache (Force PostgREST to reload)
NOTIFY pgrst, 'reload config';

-- 10. SYSTEM SETTINGS: Ensure Roles Exist (Integrated fix)
DO $$
DECLARE
    current_roles jsonb;
    new_roles jsonb;
BEGIN
    -- Check updated_at
    BEGIN
        ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Get current roles
    SELECT value INTO current_roles FROM public.system_settings WHERE key = 'roles';

    -- Define default list
    new_roles := '[
        {"id": 1, "title": "Diretor Geral", "hierarchy": 1},
        {"id": 2, "title": "Diretor", "hierarchy": 2},
        {"id": 3, "title": "Coordenador", "hierarchy": 3},
        {"id": 4, "title": "Escrivão", "hierarchy": 4},
        {"id": 5, "title": "Agente", "hierarchy": 5}
    ]'::jsonb;

    -- Update or Insert
    IF current_roles IS NULL THEN
        BEGIN
            INSERT INTO public.system_settings (key, value, updated_at) VALUES ('roles', new_roles, now());
        EXCEPTION WHEN OTHERS THEN
             INSERT INTO public.system_settings (key, value) VALUES ('roles', new_roles);
        END;
    ELSE
        BEGIN
            UPDATE public.system_settings SET value = new_roles, updated_at = now() WHERE key = 'roles';
        EXCEPTION WHEN OTHERS THEN
            UPDATE public.system_settings SET value = new_roles WHERE key = 'roles';
        END;
    END IF;
END $$;


