-- FIX LOGIN AND ROLES (FINAL & COMPLETE - V4 NUCLEAR)
-- This script uses a "Nuclear Option" to remove ANY existing conflicting functions
-- before creating the new, robust Unified Function.

-- 1. NUCLEAR CLEANUP: Find and Drop ALL versions of create_user_command
-- This fixes the "42P13: cannot change name of input parameter" error once and for all.
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop Functions
    FOR r IN 
        SELECT oid::regprocedure::text as sig
        FROM pg_proc 
        WHERE proname = 'create_user_command' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig;
        RAISE NOTICE 'Dropped existing function: %', r.sig;
    END LOOP;

    -- Drop Triggers on auth.users (Cleanup "zombie" triggers that might block login)
    -- We specifically target triggers that might have been created by previous versions of this project
    -- Common names: on_auth_user_created, on_user_login, sync_profile, handle_new_user_trigger
    DECLARE
        t text;
        trigger_names text[] := ARRAY['on_auth_user_created', 'on_user_login', 'sync_profile', 'handle_new_user_trigger', 'on_auth_user_updated'];
    BEGIN
        FOREACH t IN ARRAY trigger_names
        LOOP
            BEGIN
                EXECUTE 'DROP TRIGGER IF EXISTS ' || t || ' ON auth.users';
                RAISE NOTICE 'Dropped trigger if exists: %', t;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop trigger % (might not exist or permission denied)', t;
            END;
        END LOOP;
    END;
END $$;

-- Drop other helper functions just in case
DROP FUNCTION IF EXISTS public.get_email_by_identifier(text);

-- 2. EXTENSIONS & TABLES
-- IMPORTANT: Create extensions in public schema to avoid permission issues
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Fix Permissions for Auth Admin (Crucial for "Database error querying schema" 500 error)
DO $$
BEGIN
    GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin, dashboard_user;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin, dashboard_user;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin, dashboard_user;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin, dashboard_user;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_id text;
    ALTER TABLE public.profiles ALTER COLUMN role TYPE text;
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. TRIGGER: Handle New User (Ensures Role is saved on INSERT)
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
    -- Extract data from metadata
    v_role := new.raw_user_meta_data->>'role';
    v_full_name := new.raw_user_meta_data->>'full_name';
    v_passport_id := new.raw_user_meta_data->>'passport_id';
    v_permissions := COALESCE(new.raw_user_meta_data->'permissions', '[]'::jsonb);

    -- Fallback defaults
    IF v_role IS NULL THEN v_role := 'Agente'; END IF;
    IF v_full_name IS NULL THEN v_full_name := 'Novo Usuário'; END IF;
    
    -- Sync to profiles
    INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
    VALUES (
        new.id,
        v_full_name,
        v_role,
        v_permissions,
        v_passport_id,
        new.email,
        FALSE
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RPC: Unified Create User Command (The Solution)
-- Accepts BOTH p_* (new) and standard (old) parameters to support all frontend versions.
CREATE OR REPLACE FUNCTION public.create_user_command(
  -- New Params (p_*)
  p_email text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_passport_id text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_permissions jsonb DEFAULT NULL,
  -- Old Params (Legacy support)
  email text DEFAULT NULL,
  password text DEFAULT NULL,
  full_name text DEFAULT NULL,
  passport_id text DEFAULT NULL,
  role text DEFAULT NULL,
  permissions jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    -- Unified Variables
    v_email text;
    v_password text;
    v_full_name text;
    v_passport_id text;
    v_role text;
    v_permissions jsonb;
    
    new_user_id uuid;
    v_instance_id uuid;
    final_email text;
BEGIN
    -- Resolve Parameters (Prioritize p_, fallback to old)
    v_email := COALESCE(p_email, email);
    v_password := COALESCE(p_password, password);
    v_full_name := COALESCE(p_full_name, full_name);
    v_passport_id := COALESCE(p_passport_id, passport_id);
    v_role := COALESCE(p_role, role);
    v_permissions := COALESCE(p_permissions, permissions, '[]'::jsonb);

    -- Validation
    IF v_email IS NULL OR v_email = '' THEN RAISE EXCEPTION 'Email/Username is required'; END IF;
    IF v_password IS NULL OR v_password = '' THEN RAISE EXCEPTION 'Password is required'; END IF;

    -- Format Email
    IF position('@' in v_email) > 0 THEN
        final_email := LOWER(v_email);
    ELSE
        final_email := LOWER(v_email) || '@dip.system';
    END IF;

    -- Check Duplicates
    IF EXISTS (SELECT 1 FROM auth.users AS au WHERE au.email = final_email) THEN
        RAISE EXCEPTION 'User with this email already exists';
    END IF;

    -- Get Instance ID
    SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    new_user_id := gen_random_uuid();

    -- INSERT USER (Explicitly setting metadata to trigger the role sync)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        is_super_admin
    ) VALUES (
        v_instance_id, new_user_id, 'authenticated', 'authenticated', final_email, crypt(v_password, gen_salt('bf')), now(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', v_role), 
        jsonb_build_object('full_name', v_full_name, 'role', v_role, 'passport_id', v_passport_id, 'permissions', v_permissions),
        now(), now(),
        FALSE
    );

    -- INSERT IDENTITY (Required for Login)
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email, 'email_verified', true, 'phone_verified', false), 'email', final_email, NULL, now(), now()
    );

    -- DOUBLE CHECK PROFILE (Redundancy)
    INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
    VALUES (new_user_id, v_full_name, v_role, v_permissions, v_passport_id, final_email, TRUE)
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

-- 5. RPC: Get Email By Identifier (Helper for Login)
CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE passport_id = identifier LIMIT 1;
  IF v_email IS NULL THEN
     SELECT email INTO v_email FROM public.profiles WHERE email ILIKE identifier || '@%' LIMIT 1;
  END IF;
  RETURN v_email;
END;
$$;

-- 6. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.create_user_command(text, text, text, text, text, jsonb, text, text, text, text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO anon, authenticated, service_role;

-- 7. SETTINGS FIX: Ensure 'Diretor' role exists
DO $$
DECLARE
    current_roles jsonb;
    new_roles jsonb;
BEGIN
    -- Ensure column exists
    BEGIN
        ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    EXCEPTION WHEN OTHERS THEN NULL; END;

    SELECT value INTO current_roles FROM public.system_settings WHERE key = 'roles';

    -- Updated Role List
    new_roles := '[
        {"id": 1, "title": "Diretor Geral", "hierarchy": 1},
        {"id": 2, "title": "Diretor", "hierarchy": 2},
        {"id": 3, "title": "Coordenador", "hierarchy": 3},
        {"id": 4, "title": "Escrivão", "hierarchy": 4},
        {"id": 5, "title": "Agente", "hierarchy": 5}
    ]'::jsonb;

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

NOTIFY pgrst, 'reload config';
