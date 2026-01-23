-- FIX LOGIN AND ADD JITSI PASSWORD SUPPORT
-- Execute this entire script in the Supabase SQL Editor to fix login issues and prepare for Jitsi integration.

-- 1. Add Jitsi Password Columns to communication_rooms
ALTER TABLE public.communication_rooms 
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT true;

-- 2. Improve Create User Command (Auto-generates email if missing to fix "Invalid Credentials")
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
  final_email text;
  clean_username text;
  permissions_array text[];
BEGIN
  -- Convert permissions jsonb to text[]
  SELECT ARRAY(SELECT jsonb_array_elements_text(permissions)) INTO permissions_array;

  -- Handle Email/Username Logic
  -- If input is not an email (no @), append @dip.system to satisfy Auth requirements
  IF position('@' in email) > 0 THEN
    final_email := email;
    clean_username := split_part(email, '@', 1);
  ELSE
    clean_username := email;
    final_email := email || '@dip.system';
  END IF;

  -- Generate ID
  new_user_id := gen_random_uuid();
  
  -- Encrypt Password
  encrypted_pw := crypt(password, gen_salt('bf'));

  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    final_email,
    encrypted_pw,
    now(), -- Auto-confirm email
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', full_name, 'username', clean_username),
    now(),
    now(),
    FALSE
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', final_email),
    'email',
    final_email,
    NULL,
    now(),
    now()
  );

  -- Upsert Profile
  INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, username, must_change_password)
  VALUES (new_user_id, full_name, role, permissions_array, passport_id, final_email, clean_username, TRUE)
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    passport_id = EXCLUDED.passport_id,
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    must_change_password = TRUE;

  RETURN new_user_id;
END;
$$;

-- 3. Ensure get_email_by_identifier works with the new structure (Smart Login Fix)
CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_email text;
BEGIN
  -- 1. Try Passport ID
  SELECT email INTO found_email FROM public.profiles WHERE passport_id = identifier LIMIT 1;
  
  -- 2. Try Username
  IF found_email IS NULL THEN
    SELECT email INTO found_email FROM public.profiles WHERE username = identifier LIMIT 1;
  END IF;

  -- 3. Try direct Email
  IF found_email IS NULL THEN
    SELECT email INTO found_email FROM auth.users WHERE email = identifier LIMIT 1;
  END IF;

  -- 4. Try constructing the system email (Fallback for Smart Login)
  IF found_email IS NULL AND position('@' in identifier) = 0 THEN
    SELECT email INTO found_email FROM auth.users WHERE email = identifier || '@dip.system' LIMIT 1;
  END IF;

  RETURN found_email;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_user_command TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_command TO service_role;
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier TO service_role;
