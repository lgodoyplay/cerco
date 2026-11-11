-- =====================================================
-- BO PROCESSO INVESTIGATIVO
-- Fluxo de pasta digital por Boletim de Ocorrência
-- Execute no Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bo_processos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bo_id UUID REFERENCES public.boletins(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_andamento',
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

-- =========================================
-- OBSERVAÇÃO
-- =========================================
-- A ideia aqui é manter o fluxo de investigação
-- por BO com etapa bloqueada em sequência,
-- persistência em tabelas e auditoria.
-- O front-end deste projeto pode consumir essas tabelas,
-- respeitando as regras de bloqueio do fluxo.
