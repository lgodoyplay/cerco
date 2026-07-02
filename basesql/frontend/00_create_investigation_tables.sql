-- ============================================
-- CRIAR TABELAS DE INVESTIGAÇÃO
-- Execute no Supabase SQL Editor
-- ============================================

-- 1️⃣ Verificar/Criar tabela INVESTIGAÇÕES (pode já existir)
CREATE TABLE IF NOT EXISTS investigacoes (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'Rascunho',
  prioridade TEXT DEFAULT 'Média',
  categoria TEXT,
  data_inicio TIMESTAMP DEFAULT NOW(),
  data_fim TIMESTAMP,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responsavel TEXT,
  delegacia TEXT,
  envolvidos TEXT,
  investigados_json JSONB DEFAULT '[]',
  -- Relacionamentos
  arresto_id BIGINT,
  procurado_id BIGINT,
  buscas_apreensoes_ids BIGINT[] DEFAULT '{}',
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2️⃣ Verificar/Criar tabela PROVAS
CREATE TABLE IF NOT EXISTS provas (
  id BIGSERIAL PRIMARY KEY,
  investigacao_id BIGINT NOT NULL REFERENCES investigacoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- Imagem, Video, Documento, Audio, Link, Texto
  conteudo TEXT, -- URL ou caminho do arquivo
  descricao TEXT,
  data_upload TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  metadata JSONB, -- Dados extraídos: dimensões, tamanho, etc
  hash_sha256 TEXT -- Para integridade
);

-- 3️⃣ NOVA: Tabela AUDITORIA (rastreamento de mudanças)
CREATE TABLE IF NOT EXISTS investigacao_auditoria (
  id BIGSERIAL PRIMARY KEY,
  investigacao_id BIGINT NOT NULL REFERENCES investigacoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  acao TEXT NOT NULL, -- investigacao_criada, atualizada, prova_adicionada, etc
  novos_dados JSONB,
  dados_antigos JSONB,
  mudancas JSONB, -- Campo específico: {antes, depois}
  metadados JSONB, -- IP, User-Agent, etc
  criado_em TIMESTAMP DEFAULT NOW()
);

-- 4️⃣ NOVA: Tabela NOTAS (comentários internos)
CREATE TABLE IF NOT EXISTS investigacao_notas (
  id BIGSERIAL PRIMARY KEY,
  investigacao_id BIGINT NOT NULL REFERENCES investigacoes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  conteudo TEXT NOT NULL,
  mencoes UUID[] DEFAULT '{}', -- @mentions
  criado_em TIMESTAMP DEFAULT NOW(),
  editado_em TIMESTAMP,
  deletado_em TIMESTAMP
);

-- ============================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_investigacoes_created_by 
ON investigacoes(created_by);

CREATE INDEX IF NOT EXISTS idx_investigacoes_delegacia 
ON investigacoes(delegacia);

CREATE INDEX IF NOT EXISTS idx_investigacoes_status 
ON investigacoes(status);

CREATE INDEX IF NOT EXISTS idx_provas_investigacao_id 
ON provas(investigacao_id);

CREATE INDEX IF NOT EXISTS idx_provas_data_upload 
ON provas(data_upload);

CREATE INDEX IF NOT EXISTS idx_audit_investigacao_id 
ON investigacao_auditoria(investigacao_id);

CREATE INDEX IF NOT EXISTS idx_audit_usuario_id 
ON investigacao_auditoria(usuario_id);

CREATE INDEX IF NOT EXISTS idx_notas_investigacao_id 
ON investigacao_notas(investigacao_id);

CREATE INDEX IF NOT EXISTS idx_notas_usuario_id 
ON investigacao_notas(usuario_id);

-- ============================================
-- CRIAR VIEWS ÚTEIS
-- ============================================

-- View: Investigação com contagem de provas
CREATE OR REPLACE VIEW investigacoes_com_stats AS
SELECT 
  inv.id,
  inv.titulo,
  inv.status,
  inv.prioridade,
  inv.data_inicio,
  inv.created_by,
  (SELECT COUNT(*) FROM provas WHERE investigacao_id = inv.id) as total_provas,
  (SELECT COUNT(*) FROM investigacao_notas WHERE investigacao_id = inv.id) as total_notas,
  (SELECT COUNT(*) FROM investigacao_auditoria WHERE investigacao_id = inv.id) as total_eventos
FROM investigacoes inv;

-- ============================================
-- CRIAR FUNÇÕES AUXILIARES
-- ============================================

-- Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_investigacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar updated_at em investigações
DROP TRIGGER IF EXISTS trigger_investigacoes_updated_at ON investigacoes;
CREATE TRIGGER trigger_investigacoes_updated_at
BEFORE UPDATE ON investigacoes
FOR EACH ROW
EXECUTE FUNCTION update_investigacoes_updated_at();

-- ============================================
-- PRÓXIMO PASSO
-- ============================================
-- Após executar este arquivo com sucesso:
-- 1. Execute: 01_rls_investigation_policies.sql
-- 2. Isso ativará as RLS policies de segurança

-- Para verificar se tudo foi criado:
-- SELECT * FROM information_schema.tables 
-- WHERE table_name IN ('investigacoes', 'provas', 'investigacao_auditoria', 'investigacao_notas');
