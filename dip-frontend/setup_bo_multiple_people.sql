-- BO COM MULTIPLOS COMUNICANTES E DENUNCIADOS
-- Execute este script no SQL Editor do Supabase

ALTER TABLE public.boletins
  ADD COLUMN IF NOT EXISTS comunicantes_json JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.boletins
  ADD COLUMN IF NOT EXISTS denunciados_json JSONB DEFAULT '[]'::jsonb;

UPDATE public.boletins
SET comunicantes_json = CASE
  WHEN (comunicantes_json IS NULL OR comunicantes_json = '[]'::jsonb) AND comunicante IS NOT NULL AND comunicante <> ''
    THEN jsonb_build_array(jsonb_build_object('name', comunicante, 'passport', ''))
  ELSE comunicantes_json
END;
