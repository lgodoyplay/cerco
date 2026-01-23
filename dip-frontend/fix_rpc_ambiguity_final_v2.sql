-- FIX RPC AMBIGUITY & COMPATIBILITY (Final)
-- Reverts to standard parameter names (email, password) to support cached clients.
-- Resolves Ambiguity 42702 by using alias variables inside the function.

-- 1. DROP ALL VARIATIONS (Clean Slate)
DROP FUNCTION IF EXISTS public.create_user_command(text, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.create_user_command(text, text, text, text, text, text[]);
DROP FUNCTION IF EXISTS public.create_user_command(text, text, text, text, text, text);

-- 2. RECREATE FUNCTION (Standard Names)
CREATE OR REPLACE FUNCTION public.create_user_command(a
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
  -- Alias inputs to internal variables to avoid ambiguity
  v_email text := email;
  v_password text := password;
  v_full_name text := full_name;
  v_passport_id text := passport_id;
  v_role text := role;
  v_permissions_input jsonb := permissions;
  
  -- Internal logic variables
  new_user_id uuid;
  encrypted_pw text;
  v_instance_id uuid;
  final_email text;
  v_permissions jsonb;
BEGIN
  -- Validate inputs
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email/Username is required';
  END IF;
  
  IF v_password IS NULL OR v_password = '' THEN
    RAISE EXCEPTION 'Password is required';
  END IF;

  -- Normalize permissions
  IF v_permissions_input IS NULL THEN
    v_permissions := '[]'::jsonb;
  ELSE
    v_permissions := v_permissions_input;
  END IF;

  -- Format Email
  IF position('@' in v_email) > 0 THEN
    final_email := v_email;
  ELSE
    final_email := v_email || '@dip.system';
  END IF;

  -- Check existence (Using unique variable name avoids ambiguity)
  IF EXISTS (SELECT 1 FROM auth.users u WHERE u.email = final_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Get Instance ID
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(v_password, gen_salt('bf'));

  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_instance_id, new_user_id, 'authenticated', 'authenticated', final_email, encrypted_pw, now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', v_full_name),
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

GRANT EXECUTE ON FUNCTION public.create_user_command TO authenticated, service_role;
