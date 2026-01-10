-- SCRIPT DE CORREÇÃO TOTAL (LOGIN + TABELAS)
-- Execute este script no SQL Editor do Supabase para corrigir todos os erros relatados.

-- 1. Habilitar extensão para criptografia de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Corrigir Tabelas (Adicionar colunas e constraints)
-- Tabela Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge TEXT;

-- Tabela Investigações
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS envolvidos TEXT;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS data_fim TIMESTAMP WITH TIME ZONE;

-- Tentar adicionar FK para profiles se não existir (para permitir join)
DO $$
BEGIN
    -- Verifica se a constraint já existe para evitar erro
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_investigacoes_profiles') THEN
        -- Tenta adicionar a FK. Pode falhar se houver dados inconsistentes (created_by sem profile), mas vale tentar.
        BEGIN
            ALTER TABLE public.investigacoes ADD CONSTRAINT fk_investigacoes_profiles FOREIGN KEY (created_by) REFERENCES public.profiles(id);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Não foi possível criar FK fk_investigacoes_profiles. Verifique integridade dos dados.';
        END;
    END IF;
END $$;

-- Tabela Provas
ALTER TABLE public.provas ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.provas ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- 3. Criar um Usuário Admin de Recuperação (caso você não consiga logar)
-- Email: admin@dip.policia
-- Senha: admin
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Verificar se o usuário já existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@dip.policia') THEN
    -- Inserir usuário na tabela de autenticação
    INSERT INTO auth.users (
      id,
      instance_id,
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
      recovery_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@dip.policia',
      crypt('admin', gen_salt('bf')), -- Senha: admin
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Inserir perfil do usuário
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      badge,
      created_at
    ) VALUES (
      new_user_id,
      'admin@dip.policia',
      'Administrador do Sistema',
      'Diretor',
      'PF-000',
      now()
    );
  END IF;
END $$;

-- 4. Garantir Permissões
GRANT ALL ON public.investigacoes TO authenticated;
GRANT ALL ON public.investigacoes TO service_role;
GRANT ALL ON public.provas TO authenticated;
GRANT ALL ON public.provas TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
