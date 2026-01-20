-- ==============================================================================
-- SCRIPT DE RESET DE SENHA DE EMERGÊNCIA
-- ==============================================================================

-- PASSO 1: Liste todos os usuários para encontrar o e-mail correto
SELECT id, email, created_at, last_sign_in_at, email_confirmed_at 
FROM auth.users;

-- PASSO 2: Resete a senha do usuário desejado
-- Substitua 'admin@policia.gov.br' pelo e-mail que você encontrou no passo 1.
-- A nova senha será: 123456

UPDATE auth.users
SET 
    encrypted_password = crypt('123456', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()), -- Garante que o email esteja confirmado
    raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb -- Garante metadados corretos
WHERE email = 'admin@policia.gov.br'; -- <--- DIGITE SEU EMAIL AQUI!!!

-- ==============================================================================
-- DICA: Se o usuário não aparecer na lista do PASSO 1, ele não foi criado corretamente.
-- Nesse caso, você precisará criar um novo usuário via painel ou SQL.
