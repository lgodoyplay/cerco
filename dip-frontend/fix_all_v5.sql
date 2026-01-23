-- FIX ALL ISSUES V5 (Comprehensive Fix)
-- This script fixes:
-- 1. Login 500 Error (NULL confirmation_token)
-- 2. Role Mismatch (Flexible Role Checks for ANP/Admin)
-- 3. Supabase Security Warnings (search_path)
-- 4. RLS Performance (select auth.uid())
-- 5. ANP 403 Errors

-- =================================================================
-- 1. NUCLEAR CLEANUP & FIX LOGIN 500
-- =================================================================

-- Drop conflicting functions/triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop Functions
    FOR r IN 
        SELECT oid::regprocedure::text as sig
        FROM pg_proc 
        WHERE proname IN ('create_user_command', 'handle_new_user', 'admin_update_user_email', 'reset_system_data', 'get_officer_by_code', 'handle_updated_at')
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', r.sig;
    END LOOP;

    -- Drop Triggers
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS on_user_login ON auth.users;
    DROP TRIGGER IF EXISTS sync_profile ON auth.users;
    DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
    DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
END $$;

-- Fix NULL confirmation_token in auth.users (The Root Cause of Login 500)
UPDATE auth.users 
SET confirmation_token = '' 
WHERE confirmation_token IS NULL;

-- 2. RECREATE CORE FUNCTIONS WITH SECURITY & FIXES

-- A. Create User Command (Fixes Login 500 by inserting empty confirmation_token)
CREATE OR REPLACE FUNCTION public.create_user_command(
  p_email text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_passport_id text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_permissions jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    new_user_id uuid;
    v_instance_id uuid;
    v_email text := COALESCE(p_email, '');
    v_password text := COALESCE(p_password, '123456');
    v_full_name text := COALESCE(p_full_name, 'Novo Usuário');
    v_passport_id text := COALESCE(p_passport_id, '');
    v_role text := COALESCE(p_role, 'Agente');
    v_permissions jsonb := COALESCE(p_permissions, '[]'::jsonb);
    final_email text;
BEGIN
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

    -- INSERT USER (Explicitly setting confirmation_token to empty string)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        is_super_admin, confirmation_token
    ) VALUES (
        v_instance_id, new_user_id, 'authenticated', 'authenticated', final_email, crypt(v_password, gen_salt('bf')), now(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', v_role), 
        jsonb_build_object('full_name', v_full_name, 'role', v_role, 'passport_id', v_passport_id, 'permissions', v_permissions),
        now(), now(),
        FALSE, '' -- FIX: Empty string instead of NULL
    );

    -- INSERT IDENTITY
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email, 'email_verified', true, 'phone_verified', false), 'email', final_email, NULL, now(), now()
    );

    -- HANDLE PROFILE (Trigger will likely handle this, but we ensure it matches)
    INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
    VALUES (
        new_user_id, v_full_name, v_role, v_permissions, v_passport_id, final_email, TRUE
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        passport_id = EXCLUDED.passport_id,
        email = EXCLUDED.email;

    RETURN new_user_id;
END;
$$;

-- B. Handle New User Trigger (Fixes Security Warning: search_path)
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
    v_role := new.raw_user_meta_data->>'role';
    v_full_name := new.raw_user_meta_data->>'full_name';
    v_passport_id := new.raw_user_meta_data->>'passport_id';
    v_permissions := COALESCE(new.raw_user_meta_data->'permissions', '[]'::jsonb);

    IF v_role IS NULL THEN v_role := 'Agente'; END IF;
    IF v_full_name IS NULL THEN v_full_name := 'Novo Usuário'; END IF;
    
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

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- C. Admin Update User Email (Fixes Security Warning)
CREATE OR REPLACE FUNCTION public.admin_update_user_email(target_user_id uuid, new_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  -- Check if caller is admin/director (Flexible Check)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
        role ILIKE '%Diretor%' OR 
        role ILIKE '%Coordenador%' OR 
        role ILIKE '%Admin%' OR
        role ILIKE '%Corregedor%'
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE auth.users
  SET email = new_email,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      email_change = '',
      email_change_token_new = '',
      email_change_confirm_status = 0
  WHERE id = target_user_id;
  
  -- Update profile as well
  UPDATE public.profiles SET email = new_email WHERE id = target_user_id;
END;
$$;

-- =================================================================
-- 3. FIX RLS POLICIES (FLEXIBLE ROLES & PERFORMANCE)
-- =================================================================

-- A. Fix ANP Progress RLS (Fixes 403 Error)
DROP POLICY IF EXISTS "Ver próprio progresso ou admin" ON public.user_anp_progress;
DROP POLICY IF EXISTS "Instrutores e Admins gerenciam progresso" ON public.user_anp_progress;
DROP POLICY IF EXISTS "Gerenciamento de Progresso ANP" ON public.user_anp_progress;

CREATE POLICY "Gerenciamento de Progresso ANP" ON public.user_anp_progress
FOR ALL TO authenticated
USING (
  auth.uid() = user_id OR -- Próprio usuário
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (SELECT auth.uid()) -- Performance optimization
    AND (
      role ILIKE '%Diretor%' OR 
      role ILIKE '%Coordenador%' OR 
      role ILIKE '%Instrutor%' OR 
      role ILIKE '%Admin%' OR
      role = 'Corregedor'
    )
  )
);

-- B. Fix Profiles RLS (Performance & Flexibility)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (
  auth.uid() = id OR -- Update self
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND (
        role ILIKE '%Diretor%' OR 
        role ILIKE '%Coordenador%' OR 
        role ILIKE '%Admin%' OR
        role ILIKE '%Corregedor%'
    )
  )
);

-- C. Fix Cursos/Candidatos RLS (Security Warnings)
-- Ensure tables exist
CREATE TABLE IF NOT EXISTS public.candidatos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.candidatos;
CREATE POLICY "Acesso a Candidatos" ON public.candidatos
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND (
        role ILIKE '%Diretor%' OR 
        role ILIKE '%Recrutador%' OR 
        role ILIKE '%Admin%' OR
        role ILIKE '%Instrutor%'
    )
  )
);

-- Fix Cursos RLS (Replace permissive 'true')
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cursos;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.cursos;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.cursos;

CREATE POLICY "Ver Cursos" ON public.cursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gerenciar Cursos" ON public.cursos FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND (role ILIKE '%Diretor%' OR role ILIKE '%Instrutor%' OR role ILIKE '%Admin%')
  )
);

-- =================================================================
-- 4. GRANT PERMISSIONS (FINAL CHECK)
-- =================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Fix owner of tables to postgres to avoid permission issues
ALTER TABLE public.profiles OWNER TO postgres;
-- ALTER TABLE auth.users OWNER TO supabase_admin; -- Commented out to prevent cross-database reference error
