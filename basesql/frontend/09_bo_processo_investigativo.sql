-- =====================================================
-- BO PROCESSO INVESTIGATIVO
-- Fluxo de pasta digital por Boletim de Ocorrência
-- Execute no Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bo_processos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bo_id UUID REFERENCES public.boletins(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_processo',
  etapa_atual INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bo_processo_etapas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.bo_processos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  codigo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'bloqueada',
  documentos JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  concluido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (processo_id, numero)
);

CREATE TABLE IF NOT EXISTS public.bo_documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.bo_processos(id) ON DELETE CASCADE,
  etapa_id UUID REFERENCES public.bo_processo_etapas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'arquivo',
  url TEXT,
  descricao TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bo_auditoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.bo_processos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bo_testemunhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.bo_processos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  documento TEXT,
  depoimento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bo_investigados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.bo_processos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  documento TEXT,
  papel TEXT,
  depoimento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bo_diligencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.bo_processos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bo_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bo_processo_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bo_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bo_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bo_testemunhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bo_investigados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bo_diligencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bo_investigados ADD COLUMN IF NOT EXISTS depoimento TEXT;

DROP POLICY IF EXISTS "Usuarios autenticados podem ver processos do BO" ON public.bo_processos;
CREATE POLICY "Usuarios autenticados podem ver processos do BO"
ON public.bo_processos FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem criar processos do BO" ON public.bo_processos;
CREATE POLICY "Usuarios autenticados podem criar processos do BO"
ON public.bo_processos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem atualizar processos do BO" ON public.bo_processos;
CREATE POLICY "Usuarios autenticados podem atualizar processos do BO"
ON public.bo_processos FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem ver etapas do processo" ON public.bo_processo_etapas;
CREATE POLICY "Usuarios autenticados podem ver etapas do processo"
ON public.bo_processo_etapas FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem criar etapas do processo" ON public.bo_processo_etapas;
CREATE POLICY "Usuarios autenticados podem criar etapas do processo"
ON public.bo_processo_etapas FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem atualizar etapas do processo" ON public.bo_processo_etapas;
CREATE POLICY "Usuarios autenticados podem atualizar etapas do processo"
ON public.bo_processo_etapas FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem ver documentos do processo" ON public.bo_documentos;
CREATE POLICY "Usuarios autenticados podem ver documentos do processo"
ON public.bo_documentos FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem criar documentos do processo" ON public.bo_documentos;
CREATE POLICY "Usuarios autenticados podem criar documentos do processo"
ON public.bo_documentos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem ver auditoria do processo" ON public.bo_auditoria;
CREATE POLICY "Usuarios autenticados podem ver auditoria do processo"
ON public.bo_auditoria FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Sistema pode registrar auditoria do processo" ON public.bo_auditoria;
CREATE POLICY "Sistema pode registrar auditoria do processo"
ON public.bo_auditoria FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem ver testemunhas do processo" ON public.bo_testemunhas;
CREATE POLICY "Usuarios autenticados podem ver testemunhas do processo"
ON public.bo_testemunhas FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem criar testemunhas do processo" ON public.bo_testemunhas;
CREATE POLICY "Usuarios autenticados podem criar testemunhas do processo"
ON public.bo_testemunhas FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem ver investigados do processo" ON public.bo_investigados;
CREATE POLICY "Usuarios autenticados podem ver investigados do processo"
ON public.bo_investigados FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem criar investigados do processo" ON public.bo_investigados;
CREATE POLICY "Usuarios autenticados podem criar investigados do processo"
ON public.bo_investigados FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem ver diligencias do processo" ON public.bo_diligencias;
CREATE POLICY "Usuarios autenticados podem ver diligencias do processo"
ON public.bo_diligencias FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem criar diligencias do processo" ON public.bo_diligencias;
CREATE POLICY "Usuarios autenticados podem criar diligencias do processo"
ON public.bo_diligencias FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_bo_processos_bo_id ON public.bo_processos(bo_id);
CREATE INDEX IF NOT EXISTS idx_bo_processos_status ON public.bo_processos(status);
CREATE INDEX IF NOT EXISTS idx_bo_etapas_processo_id ON public.bo_processo_etapas(processo_id);
CREATE INDEX IF NOT EXISTS idx_bo_documentos_processo_id ON public.bo_documentos(processo_id);
CREATE INDEX IF NOT EXISTS idx_bo_auditoria_processo_id ON public.bo_auditoria(processo_id);

CREATE OR REPLACE FUNCTION public.criar_processo_bo_default()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.bo_processos p
    WHERE p.bo_id = NEW.id
  ) THEN
    INSERT INTO public.bo_processos (
      bo_id,
      titulo,
      status,
      etapa_atual,
      created_by
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.descricao, 'Pasta Digital Investigativa'),
      'em_processo',
      1,
      NEW.created_by
    );

    INSERT INTO public.bo_processo_etapas (
      processo_id,
      numero,
      codigo,
      titulo,
      descricao,
      status,
      documentos,
      observacoes
    )
    SELECT
      p.id,
      etapa.numero,
      etapa.codigo,
      etapa.titulo,
      etapa.descricao,
      etapa.status,
      etapa.documentos,
      ''
    FROM public.bo_processos p
    CROSS JOIN (
      VALUES
        (1, 'etapa_01', 'Abertura do BO e registro inicial', 'Registrar a ocorrência, identificar as partes e consolidar os primeiros dados do caso.', 'ativa', '[{"id":"etapa_01-doc-1","label":"BO cadastrado","uploaded":false,"url":""},{"id":"etapa_01-doc-2","label":"Resumo da ocorrência","uploaded":false,"url":""}]'::jsonb),
        (2, 'etapa_02', 'Coleta inicial e preservação de provas', 'Reunir o cenário do fato, preservar indícios e encaminhar elementos materiais ou digitais para análise.', 'bloqueada', '[{"id":"etapa_02-doc-1","label":"Local e data do fato","uploaded":false,"url":""},{"id":"etapa_02-doc-2","label":"Preservação de provas","uploaded":false,"url":""}]'::jsonb),
        (3, 'etapa_03', 'Depoimentos de testemunhas', 'Registrar versões dos fatos, relatos e declarações das testemunhas e das vítimas.', 'bloqueada', '[{"id":"etapa_03-doc-1","label":"Lista de testemunhas","uploaded":false,"url":""},{"id":"etapa_03-doc-2","label":"Termos de depoimento","uploaded":false,"url":""}]'::jsonb),
        (4, 'etapa_04', 'Indiciado / acusado e depoimento', 'Ouvir o acusado, registrar sua versão, contradições e esclarecimentos sobre os fatos.', 'bloqueada', '[{"id":"etapa_04-doc-1","label":"Identificação do acusado","uploaded":false,"url":""},{"id":"etapa_04-doc-2","label":"Versão do acusado","uploaded":false,"url":""}]'::jsonb),
        (5, 'etapa_05', 'Diligências complementares', 'Executar buscas, perícias, verificações e outras diligências que complementem a investigação.', 'bloqueada', '[{"id":"etapa_05-doc-1","label":"Plano de diligência","uploaded":false,"url":""},{"id":"etapa_05-doc-2","label":"Resultado da diligência","uploaded":false,"url":""}]'::jsonb),
        (6, 'etapa_06', 'Confronto e cruzamento de provas', 'Comparar depoimentos, documentos, mídias e demais provas para validar ou afastar hipóteses.', 'bloqueada', '[{"id":"etapa_06-doc-1","label":"Cronologia dos fatos","uploaded":false,"url":""},{"id":"etapa_06-doc-2","label":"Confronto documental","uploaded":false,"url":""}]'::jsonb),
        (7, 'etapa_07', 'Conclusão e encerramento do processo', 'Formalizar análise final, consolidar a conclusão e arquivar o procedimento com histórico completo.', 'bloqueada', '[{"id":"etapa_07-doc-1","label":"Relatório final","uploaded":false,"url":""},{"id":"etapa_07-doc-2","label":"Arquivamento","uploaded":false,"url":""}]'::jsonb)
    ) AS etapa(numero, codigo, titulo, descricao, status, documentos)
    WHERE p.bo_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_criar_processo_bo_default ON public.boletins;
CREATE TRIGGER trg_criar_processo_bo_default
AFTER INSERT ON public.boletins
FOR EACH ROW
EXECUTE FUNCTION public.criar_processo_bo_default();

-- =========================================
-- OBSERVAÇÃO
-- =========================================
-- A ideia aqui é manter o fluxo de investigação
-- por BO com etapa bloqueada em sequência,
-- persistência em tabelas e auditoria.
-- O front-end deste projeto pode consumir essas tabelas,
-- respeitando as regras de bloqueio do fluxo.
