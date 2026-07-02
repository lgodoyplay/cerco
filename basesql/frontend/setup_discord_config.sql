-- 1. Inserir configuração padrão do Discord se não existir
INSERT INTO public.system_settings (key, value)
VALUES ('discord_config', '{"webhookUrl": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Permitir que usuários públicos (anon) leiam APENAS a configuração do Discord
-- Isso é necessário para que o formulário público possa enviar a notificação via cliente
DROP POLICY IF EXISTS "Public view discord config" ON public.system_settings;
CREATE POLICY "Public view discord config" ON public.system_settings
  FOR SELECT
  TO anon, authenticated
  USING (key = 'discord_config');

-- Nota: O Webhook URL ficará exposto para quem inspecionar a rede, mas isso é inevitável em aplicações frontend-only.
