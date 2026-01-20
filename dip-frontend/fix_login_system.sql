-- 1. Garante que a tabela profiles tenha a coluna email e passport_id
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS passport_id TEXT;

-- 2. Sincroniza emails da tabela de autenticação para a tabela de perfis
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '');

-- 3. Cria a função para buscar email pelo ID Funcional (usada no login)
CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_email text;
BEGIN
  -- Tenta achar pelo passport_id (ID Funcional)
  SELECT email INTO found_email
  FROM public.profiles
  WHERE passport_id = identifier
  LIMIT 1;

  -- Se não achar, vê se o próprio identifier já é um email válido na base
  IF found_email IS NULL THEN
      SELECT email INTO found_email
      FROM auth.users
      WHERE email = identifier
      LIMIT 1;
  END IF;

  RETURN found_email;
END;
$$;

-- 4. Dá permissão para qualquer um (inclusive não logado) usar essa função no login
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO service_role;

-- 5. Atualiza a função de criar usuário para garantir que o email seja salvo no profile
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
SET search_path = public, auth
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  -- Gera ID
  new_user_id := gen_random_uuid();
  
  -- Criptografa senha (compatível com Supabase Auth padrão)
  encrypted_pw := crypt(password, gen_salt('bf'));

  -- Insere no auth.users
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

  -- Insere identidade
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

  -- Atualiza ou Cria Profile
  INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
  VALUES (new_user_id, full_name, role, permissions, passport_id, email, TRUE)
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    passport_id = EXCLUDED.passport_id,
    email = EXCLUDED.email,
    must_change_password = TRUE;

  RETURN new_user_id;
END;
$$;
