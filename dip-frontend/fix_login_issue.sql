-- ==============================================================================
-- SOLUÇÃO PARA ERRO "Invalid login credentials"
-- ==============================================================================
-- Execute este script no Editor SQL do Supabase para corrigir o login.

-- 1. PRIMEIRO: Veja quais usuários existem no banco de dados
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at 
FROM auth.users;

-- 2. SE O SEU EMAIL EXISTE NA LISTA ACIMA:
-- Substitua 'SEU_EMAIL_AQUI' pelo seu email real e execute o comando abaixo
-- Isso definirá a senha como: 123456
UPDATE auth.users
SET 
    encrypted_password = crypt('123456', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb
WHERE email = 'SEU_EMAIL_AQUI'; 
-- ^^^ MUDE O EMAIL AQUI ^^^

-- 3. SE O SEU EMAIL NÃO EXISTE NA LISTA:
-- Você precisa criar o usuário. Execute o comando abaixo (mude o email):
-- INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'admin@policia.gov.br', -- <--- Mude o email
--   crypt('123456', gen_salt('bf')),
--   now(),
--   '{"provider":"email","providers":["email"]}',
--   '{}',
--   now(),
--   now()
-- );
-- DEPOIS DE INSERIR, VOCÊ PRECISA CRIAR O PERFIL NA TABELA PUBLIC.PROFILES TAMBÉM!
