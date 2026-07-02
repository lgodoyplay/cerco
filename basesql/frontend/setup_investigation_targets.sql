-- Campos extras para investigação com pessoa, organizacao/empresa e varios investigados
-- Execute este script no SQL Editor do Supabase

ALTER TABLE public.investigacoes
  ADD COLUMN IF NOT EXISTS tipo_alvo_investigacao TEXT DEFAULT 'pessoa',
  ADD COLUMN IF NOT EXISTS nome_organizacao_investigada TEXT,
  ADD COLUMN IF NOT EXISTS investigados_json JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.investigacoes.tipo_alvo_investigacao IS 'Tipo do alvo da investigacao: pessoa, organizacao ou empresa';
COMMENT ON COLUMN public.investigacoes.nome_organizacao_investigada IS 'Nome da organizacao ou empresa investigada';
COMMENT ON COLUMN public.investigacoes.investigados_json IS 'Lista JSON com varios investigados e seus CPFs/documentos';

UPDATE public.investigacoes
SET investigados_json = CASE
  WHEN (investigados_json IS NULL OR investigados_json = '[]'::jsonb)
    AND ((nome_investigado IS NOT NULL AND nome_investigado <> '') OR (cpf_investigado IS NOT NULL AND cpf_investigado <> ''))
    THEN jsonb_build_array(
      jsonb_build_object(
        'nome', COALESCE(nome_investigado, ''),
        'cpf', COALESCE(cpf_investigado, '')
      )
    )
  ELSE investigados_json
END;
