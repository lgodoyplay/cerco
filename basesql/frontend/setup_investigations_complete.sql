-- ============================================
-- SETUP COMPLETO - INVESTIGAÇÕES
-- Execute tudo de uma vez neste arquivo
-- ============================================

-- PASSO 1: Criar/Adicionar colunas na tabela investigacoes (já existe)
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS investigadores_json JSONB DEFAULT '[]';
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS arresto_id BIGINT;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS procurado_id BIGINT;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS envolvidos TEXT;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS data_fim TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- PASSO 2: Criar tabela investigacao_auditoria (se não existir)
CREATE TABLE IF NOT EXISTS public.investigacao_auditoria (
  id BIGSERIAL PRIMARY KEY,
  investigacao_id BIGINT NOT NULL REFERENCES public.investigacoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  acao TEXT NOT NULL, -- investigacao_criada, atualizada, prova_adicionada, etc
  novos_dados JSONB,
  dados_antigos JSONB,
  mudancas JSONB, -- Campo específico: {campo: {antes, depois}}
  metadados JSONB, -- IP, User-Agent, etc
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 3: Criar tabela investigacao_notas (comentários - se não existir)
CREATE TABLE IF NOT EXISTS public.investigacao_notas (
  id BIGSERIAL PRIMARY KEY,
  investigacao_id BIGINT NOT NULL REFERENCES public.investigacoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  conteudo TEXT NOT NULL,
  mencoes UUID[] DEFAULT '{}',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  editado_em TIMESTAMP WITH TIME ZONE,
  deletado_em TIMESTAMP WITH TIME ZONE
);

-- PASSO 4: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_investigacoes_created_by ON public.investigacoes(created_by);
CREATE INDEX IF NOT EXISTS idx_investigacoes_delegacia ON public.investigacoes(responsavel);
CREATE INDEX IF NOT EXISTS idx_investigacoes_status ON public.investigacoes(status);
CREATE INDEX IF NOT EXISTS idx_provas_investigacao_id ON public.provas(investigacao_id);
CREATE INDEX IF NOT EXISTS idx_audit_investigacao_id ON public.investigacao_auditoria(investigacao_id);
CREATE INDEX IF NOT EXISTS idx_audit_usuario_id ON public.investigacao_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_investigacao_id ON public.investigacao_notas(investigacao_id);
CREATE INDEX IF NOT EXISTS idx_notas_usuario_id ON public.investigacao_notas(usuario_id);

-- PASSO 5: Habilitar RLS nas tabelas
ALTER TABLE public.investigacao_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigacao_notas ENABLE ROW LEVEL SECURITY;

-- PASSO 6: Limpar políticas antigas (para recriar sem erro)
DROP POLICY IF EXISTS "Users can view their investigations" ON public.investigacoes;
DROP POLICY IF EXISTS "Users can create investigations" ON public.investigacoes;
DROP POLICY IF EXISTS "Users can update their own investigations" ON public.investigacoes;
DROP POLICY IF EXISTS "Users can delete their own investigations" ON public.investigacoes;

DROP POLICY IF EXISTS "Users can view proofs of accessible investigations" ON public.provas;
DROP POLICY IF EXISTS "Users can add proofs to their investigations" ON public.provas;
DROP POLICY IF EXISTS "Users can edit proofs in their investigations" ON public.provas;
DROP POLICY IF EXISTS "Users can delete proofs from their investigations" ON public.provas;

DROP POLICY IF EXISTS "Users can view audit of their investigations" ON public.investigacao_auditoria;
DROP POLICY IF EXISTS "System can create audit records" ON public.investigacao_auditoria;

DROP POLICY IF EXISTS "Users can view notes on accessible investigations" ON public.investigacao_notas;
DROP POLICY IF EXISTS "Users can create notes on their investigations" ON public.investigacao_notas;
DROP POLICY IF EXISTS "Users can edit their own notes" ON public.investigacao_notas;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.investigacao_notas;

-- ============================================
-- PASSO 7: CRIAR NOVAS RLS POLICIES
-- ============================================

-- INVESTIGACOES Policies
CREATE POLICY "Users can view their investigations"
ON public.investigacoes FOR SELECT
USING (auth.uid() = created_by OR auth.role() = 'authenticated');

CREATE POLICY "Users can create investigations"
ON public.investigacoes FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own investigations"
ON public.investigacoes FOR UPDATE
USING (auth.uid() = created_by OR auth.role() = 'admin')
WITH CHECK (auth.uid() = created_by OR auth.role() = 'admin');

CREATE POLICY "Users can delete their own investigations"
ON public.investigacoes FOR DELETE
USING (auth.uid() = created_by OR auth.role() = 'admin');

-- PROVAS Policies
CREATE POLICY "Users can view proofs of accessible investigations"
ON public.provas FOR SELECT
USING (
  investigacao_id IN (
    SELECT id FROM public.investigacoes 
    WHERE auth.uid() = created_by OR auth.role() = 'authenticated'
  )
);

CREATE POLICY "Users can add proofs to their investigations"
ON public.provas FOR INSERT
WITH CHECK (
  investigacao_id IN (
    SELECT id FROM public.investigacoes 
    WHERE auth.uid() = created_by
  )
);

CREATE POLICY "Users can edit proofs in their investigations"
ON public.provas FOR UPDATE
USING (
  investigacao_id IN (
    SELECT id FROM public.investigacoes 
    WHERE auth.uid() = created_by
  )
);

CREATE POLICY "Users can delete proofs from their investigations"
ON public.provas FOR DELETE
USING (
  investigacao_id IN (
    SELECT id FROM public.investigacoes 
    WHERE auth.uid() = created_by
  )
);

-- INVESTIGACAO_AUDITORIA Policies
CREATE POLICY "Users can view audit of their investigations"
ON public.investigacao_auditoria FOR SELECT
USING (
  investigacao_id IN (
    SELECT id FROM public.investigacoes 
    WHERE auth.uid() = created_by OR auth.role() = 'authenticated'
  )
);

CREATE POLICY "System can create audit records"
ON public.investigacao_auditoria FOR INSERT
WITH CHECK (true);

-- INVESTIGACAO_NOTAS Policies
CREATE POLICY "Users can view notes on accessible investigations"
ON public.investigacao_notas FOR SELECT
USING (
  investigacao_id IN (
    SELECT id FROM public.investigacoes 
    WHERE auth.uid() = created_by OR auth.role() = 'authenticated'
  )
);

CREATE POLICY "Users can create notes on their investigations"
ON public.investigacao_notas FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can edit their own notes"
ON public.investigacao_notas FOR UPDATE
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own notes"
ON public.investigacao_notas FOR DELETE
USING (auth.uid() = usuario_id);

-- ============================================
-- PASSO 8: Criar view útil
-- ============================================

CREATE OR REPLACE VIEW investigacoes_com_stats AS
SELECT 
  inv.id,
  inv.titulo,
  inv.status,
  inv.prioridade,
  inv.data_inicio,
  inv.created_by,
  (SELECT COUNT(*) FROM public.provas WHERE investigacao_id = inv.id) as total_provas,
  (SELECT COUNT(*) FROM public.investigacao_notas WHERE investigacao_id = inv.id) as total_notas,
  (SELECT COUNT(*) FROM public.investigacao_auditoria WHERE investigacao_id = inv.id) as total_eventos
FROM public.investigacoes inv;

-- ============================================
-- CONFIRMAÇÃO
-- ============================================

-- Se chegou aqui sem erro, tudo foi criado com sucesso! ✅
-- Você pode verificar executando:
-- SELECT * FROM investigacao_auditoria LIMIT 1;
-- SELECT * FROM investigacao_notas LIMIT 1;
