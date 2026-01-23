-- Reparação Completa do Schema e Login
-- Execute este script no Editor SQL do Supabase para corrigir os erros 400 e 500

-- 1. Garante que a tabela profiles tenha TODAS as colunas necessárias para o frontend
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS passport_id TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Agente DPF';

-- 2. Sincroniza emails da tabela de autenticação para a tabela de perfis
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '');

-- 3. Recria a função get_email_by_identifier com tratamento de erro e permissões corretas
CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS para permitir busca antes do login
AS $$
DECLARE
  found_email text;
BEGIN
  -- Tenta achar pelo passport_id (ID Funcional) na tabela profiles
  SELECT email INTO found_email
  FROM public.profiles
  WHERE passport_id = identifier
  LIMIT 1;

  -- Se não achar, tenta pelo username
  IF found_email IS NULL THEN
      SELECT email INTO found_email
      FROM public.profiles
      WHERE username = identifier
      LIMIT 1;
  END IF;

  -- Se não achar, verifica se o identificador já é um email válido na tabela auth.users
  IF found_email IS NULL THEN
      SELECT email INTO found_email
      FROM auth.users
      WHERE email = identifier
      LIMIT 1;
  END IF;

  RETURN found_email;
END;
$$;

-- 4. Garante permissões de execução para todos (público/anônimo é necessário para login)
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO service_role;

-- 5. Atualiza trigger de novos usuários para garantir consistência futura
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger as $$
begin
  insert into public.profiles (id, full_name, role, email, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'name', 
    'Agente DPF',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;
