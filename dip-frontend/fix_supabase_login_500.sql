-- FIX LOGIN 500 ERROR (Database error querying schema)
-- Run this script in Supabase SQL Editor to repair permissions, triggers, and table structure.

-- 1. Ensure Permissions on Public Schema (Fixes "querying schema" errors)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- 2. Ensure Profiles Table has all required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'Agente DPF';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions jsonb;

-- 3. Drop potential problematic triggers to clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;

-- 4. Recreate handle_new_user function (Robust Version)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
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
  SET email = EXCLUDED.email,
      full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
      
  RETURN new;
END;
$$;

-- 5. Recreate Trigger for New Users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Recreate Email Sync Trigger
CREATE OR REPLACE FUNCTION public.handle_user_email_sync()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_email_sync();

-- 7. Ensure get_email_by_identifier works (Vital for Login)
CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier text)
RETURNS text
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  found_email text;
BEGIN
  -- Try finding by passport_id
  SELECT email INTO found_email FROM public.profiles WHERE passport_id = identifier LIMIT 1;
  
  -- Fallback to auth.users check
  IF found_email IS NULL THEN
    SELECT email INTO found_email FROM auth.users WHERE email = identifier LIMIT 1;
  END IF;
  
  -- Fallback for system emails
  IF found_email IS NULL AND position('@' in identifier) = 0 THEN
     found_email := identifier || '@dip.system';
  END IF;

  RETURN found_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_by_identifier TO anon, authenticated, service_role;

-- 8. Fix Profiles RLS (Ensure public/anon can read for login check if needed)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfis visíveis publicamente" ON public.profiles;
CREATE POLICY "Perfis visíveis publicamente" ON public.profiles
  FOR SELECT USING (true); -- Needed for get_email_by_identifier internal query sometimes, or general transparency

DROP POLICY IF EXISTS "Usuários editam próprio perfil" ON public.profiles;
CREATE POLICY "Usuários editam próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 9. Create User Command (Fix search_path and extensions)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

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
BEGIN
  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(password, gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', email, encrypted_pw, now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', full_name),
    now(), now()
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', email), 'email', NULL, now(), now()
  );

  INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
  VALUES (new_user_id, full_name, role, permissions, passport_id, email, TRUE)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      passport_id = EXCLUDED.passport_id,
      email = EXCLUDED.email;

  RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_command TO authenticated, service_role;
