-- ==============================================================================
-- SCRIPT DE CORREÇÃO DE ACESSO AO DISCORD PARA FORMULÁRIOS PÚBLICOS
-- ==============================================================================
-- Este script garante que o formulário de candidatura (público) consiga ler
-- a configuração do Webhook do Discord na tabela system_settings.

BEGIN;

-- 1. Garantir que a tabela existe e tem RLS ativado
CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas relacionadas ao discord_config para evitar conflitos
DROP POLICY IF EXISTS "Public view discord config" ON public.system_settings;
DROP POLICY IF EXISTS "Public read discord config" ON public.system_settings;
DROP POLICY IF EXISTS "Allow public read discord config" ON public.system_settings;
DROP POLICY IF EXISTS "Anon read discord config" ON public.system_settings;

-- 3. CRIAR POLÍTICA DE LEITURA PÚBLICA (CRUCIAL PARA O FORMULÁRIO)
-- Permite que qualquer usuário (logado ou não) leia a configuração do Discord
CREATE POLICY "Public read discord config" 
ON public.system_settings
FOR SELECT 
USING (key = 'discord_config');

-- 4. Garantir políticas para usuários autenticados (Admin)
-- Permite que usuários logados leiam todas as configurações
DROP POLICY IF EXISTS "Authenticated read all settings" ON public.system_settings;
CREATE POLICY "Authenticated read all settings" 
ON public.system_settings
FOR SELECT 
TO authenticated
USING (true);

-- Permite que usuários logados atualizem as configurações
DROP POLICY IF EXISTS "Authenticated update settings" ON public.system_settings;
CREATE POLICY "Authenticated update settings" 
ON public.system_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permite que usuários logados insiram novas configurações
DROP POLICY IF EXISTS "Authenticated insert settings" ON public.system_settings;
CREATE POLICY "Authenticated insert settings" 
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Garantir que a linha de configuração existe (se não existir, cria vazia)
INSERT INTO public.system_settings (key, value)
VALUES ('discord_config', '{"webhookUrl": "", "formsWebhook": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- FIM
