-- 🚨 SCRIPT DE CORREÇÃO DE PERMISSÕES (IMPORTANTE)
-- Execute este script no SQL Editor do Supabase para corrigir o erro de envio do formulário.

BEGIN;

-- 1. Garantir que a tabela existe
CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value jsonb,
    created_at timestamptz DEFAULT now()
);

-- 2. Habilitar segurança (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. Limpar políticas antigas (para não dar erro de duplicidade)
DROP POLICY IF EXISTS "Public view discord config" ON public.system_settings;
DROP POLICY IF EXISTS "Allow public read discord config" ON public.system_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin full access" ON public.system_settings;

-- 4. POLÍTICA PÚBLICA: Permitir que QUALQUER UM leia a configuração do Discord
-- Isso corrige o erro onde o formulário não consegue pegar o Webhook
CREATE POLICY "Public read discord config" 
ON public.system_settings
FOR SELECT 
TO public
USING (key = 'discord_config');

-- 5. POLÍTICA DE ADMIN: Permitir que administradores façam TUDO
CREATE POLICY "Admin full access" 
ON public.system_settings
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Garantir configuração padrão
INSERT INTO public.system_settings (key, value)
VALUES ('discord_config', '{"webhookUrl": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMIT;
