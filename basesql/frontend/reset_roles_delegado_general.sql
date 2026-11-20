-- Limpa a configuração de cargos e cria somente "Delegado Geral" como administrador.
-- Execute este arquivo inteiro no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

INSERT INTO public.system_settings (key, value, updated_at)
VALUES (
  'roles',
  '[
    {
      "id": 1,
      "title": "Delegado Geral",
      "hierarchy": 1,
      "kind": "main",
      "category": "main",
      "isThirdParty": false,
      "color": "#f59e0b",
      "permissions": ["admin_access"]
    }
  ]'::jsonb,
  now()
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  updated_at = EXCLUDED.updated_at;

-- Remove todos os cargos antigos das tabelas de perfis.
-- O único cargo válido passa a ser atribuído a todos os usuários.
UPDATE public.profiles
SET role = 'Delegado Geral',
    permissions = '["admin_access"]'::jsonb;

-- Opcional: atribuir o cargo administrativo ao usuário pelo email.
-- Troque o email antes de executar.
-- UPDATE public.profiles
-- SET role = 'Delegado Geral', permissions = '["admin_access"]'::jsonb
-- WHERE email = 'email-do-delegado@dominio.com';

SELECT key, value, updated_at
FROM public.system_settings
WHERE key = 'roles';
