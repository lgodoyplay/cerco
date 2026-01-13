-- CORREÇÃO DE PERMISSÕES PARA O DISCORD
-- Execute este script no SQL Editor do Supabase para garantir que o formulário público consiga ler o Webhook.

-- 1. Criar tabela se não existir (garantia)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value jsonb,
    created_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public view discord config" ON public.system_settings;
DROP POLICY IF EXISTS "Allow public read discord config" ON public.system_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.system_settings;

-- 4. CRIAR NOVA POLÍTICA: Permitir que QUALQUER UM (incluindo anônimos) leia a configuração 'discord_config'
CREATE POLICY "Allow public read discord config" 
ON public.system_settings
FOR SELECT 
TO public -- 'public' inclui anon e authenticated
USING (key = 'discord_config');

-- 5. Garantir que autenticados (admin) possam fazer tudo
CREATE POLICY "Allow admin full access" 
ON public.system_settings
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Inserir um valor padrão caso não exista (apenas para evitar nulos)
INSERT INTO public.system_settings (key, value)
VALUES ('discord_config', '{"webhookUrl": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;
