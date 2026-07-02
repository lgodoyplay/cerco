-- CORREÇÃO: Tipo de dados PERMISSIONS (jsonb -> text[])
-- Copie TODO este código e execute no SQL Editor do Supabase

-- 1. Garante extensões
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. Colunas necessárias
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;

-- 3. Função create_user_command corrigida
CREATE OR REPLACE FUNCTION public.create_user_command(
  email text,
  password text,
  full_name text,
  passport_id text,
  role text,
  permissions jsonb -- Recebe JSONB do frontend
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
  permissions_array text[]; -- Variável para converter jsonb em text[]
BEGIN
  -- Converte permissions (jsonb) para array de texto (text[])
  -- Isso corrige o erro: column "permissions" is of type text[] but expression is of type jsonb
  SELECT ARRAY(SELECT jsonb_array_elements_text(permissions)) INTO permissions_array;

  -- Gera ID
  new_user_id := gen_random_uuid();
  
  -- Criptografa senha
  encrypted_pw := crypt(password, gen_salt('bf'));

  -- Insere auth.users
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
    email,
    encrypted_pw,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', full_name),
    now(),
    now(),
    FALSE
  );

  -- Insere auth.identities
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
    jsonb_build_object('sub', new_user_id, 'email', email),
    'email',
    email,
    NULL,
    now(),
    now()
  );

  -- Profile (USANDO permissions_array convertida)
  INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, must_change_password)
  VALUES (new_user_id, full_name, role, permissions_array, passport_id, TRUE)
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    passport_id = EXCLUDED.passport_id,
    must_change_password = TRUE;

  RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_command TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_command TO service_role;
