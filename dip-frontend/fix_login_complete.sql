-- FIX LOGIN COMPLETE (500 Error + Invalid Credentials)
-- Run this script in Supabase SQL Editor.

-- 1. Ensure Permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- 2. Fix Profile Table Columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'Agente DPF';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions jsonb;

-- 3. Robust Trigger Function (Handle race conditions)
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
  SET email = EXCLUDED.email; -- Minimal update to avoid overwriting admin edits
  RETURN new;
END;
$$;

-- 4. Recreate Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. CREATE USER COMMAND (Fixed Instance ID + Email Domain)
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
  v_instance_id uuid;
  final_email text;
BEGIN
  -- A. Get correct Instance ID from existing users
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
  -- Default if DB is empty
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- B. Auto-append domain if missing (Fixes Invalid Credentials)
  IF position('@' in email) > 0 THEN
    final_email := email;
  ELSE
    final_email := email || '@dip.system';
  END IF;

  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(password, gen_salt('bf'));

  -- C. Insert into auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_instance_id, new_user_id, 'authenticated', 'authenticated', final_email, encrypted_pw, now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', full_name),
    now(), now()
  );

  -- D. Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email), 'email', NULL, now(), now()
  );

  -- E. Update Profile (Trigger creates it, we update it)
  -- Wait a tiny bit or just Upsert. Upsert is safer.
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

-- 6. REPAIR EXISTING DATA (Fix users created with error)
DO $$
DECLARE
  real_instance_id uuid;
BEGIN
  -- Get valid instance_id
  SELECT instance_id INTO real_instance_id FROM auth.users WHERE instance_id != '00000000-0000-0000-0000-000000000000' LIMIT 1;
  
  IF real_instance_id IS NOT NULL THEN
    -- Fix users with bad instance_id
    UPDATE auth.users 
    SET instance_id = real_instance_id 
    WHERE instance_id = '00000000-0000-0000-0000-000000000000';
  END IF;

  -- Fix emails without domain (e.g. "johndoe" -> "johndoe@dip.system")
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
