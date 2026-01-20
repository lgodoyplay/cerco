-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_id TEXT; -- "Funcional"

-- Function to create user (Requires admin privileges usually, so we make it SECURITY DEFINER)
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
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
SET search_path = public, auth -- Secure search path
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  -- Generate User ID
  new_user_id := gen_random_uuid();
  
  -- Hash password
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
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    email,
    encrypted_pw,
    now(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', full_name),
    now(),
    now(),
    '',
    '',
    '',
    '',
    FALSE
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', email),
    'email',
    NULL,
    now(),
    now()
  );

  -- Handle Profile
  -- Check if profile exists (created by trigger)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) THEN
    UPDATE public.profiles
    SET 
      full_name = create_user_command.full_name,
      role = create_user_command.role,
      permissions = create_user_command.permissions,
      passport_id = create_user_command.passport_id,
      must_change_password = TRUE
    WHERE id = new_user_id;
  ELSE
    INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, must_change_password)
    VALUES (new_user_id, full_name, role, permissions, passport_id, TRUE);
  END IF;

  RETURN new_user_id;
END;
$$;

-- Function to delete user
CREATE OR REPLACE FUNCTION public.delete_user_command(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = target_user_id;
  -- Profile delete is usually handled by cascade or manual
  DELETE FROM public.profiles WHERE id = target_user_id;
END;
$$;

-- Function to update own password (optional helper)
CREATE OR REPLACE FUNCTION public.update_own_password(new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = auth.uid();
  
  UPDATE public.profiles
  SET must_change_password = FALSE
  WHERE id = auth.uid();
END;
$$;
