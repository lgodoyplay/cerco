-- ============================================
-- RLS POLICIES - INVESTIGAÇÕES
-- Execute APÓS 00_create_investigation_tables.sql
-- ============================================

-- ⚠️ IMPORTANTE: Este script deve rodar DEPOIS de criar as tabelas
-- Se der erro, execute primeiro: 00_create_investigation_tables.sql

-- 1️⃣ HABILITAR RLS NAS TABELAS
ALTER TABLE investigacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE provas ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigacao_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigacao_notas ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem (para recriar)
DROP POLICY IF EXISTS "Users can view their investigations" ON investigacoes;
DROP POLICY IF EXISTS "Users can create investigations" ON investigacoes;
DROP POLICY IF EXISTS "Users can update their own investigations" ON investigacoes;
DROP POLICY IF EXISTS "Users can delete their own investigations" ON investigacoes;

DROP POLICY IF EXISTS "Users can view proofs of accessible investigations" ON provas;
DROP POLICY IF EXISTS "Users can add proofs to their investigations" ON provas;
DROP POLICY IF EXISTS "Users can edit proofs in their investigations" ON provas;
DROP POLICY IF EXISTS "Users can delete proofs from their investigations" ON provas;

DROP POLICY IF EXISTS "Users can view audit of their investigations" ON investigacao_auditoria;
DROP POLICY IF EXISTS "System can create audit records" ON investigacao_auditoria;

DROP POLICY IF EXISTS "Users can view notes on accessible investigations" ON investigacao_notas;
DROP POLICY IF EXISTS "Users can create notes on their investigations" ON investigacao_notas;
DROP POLICY IF EXISTS "Users can edit their own notes" ON investigacao_notas;
DROP POLICY IF EXISTS "Users can delete their own notes" ON investigacao_notas;

-- ============================================
-- INVESTIGACOES - Policies
-- ============================================

-- Policy 1: Ver próprias investigações ou de sua delegacia/admin
CREATE POLICY "Users can view their investigations"
ON investigacoes FOR SELECT
USING (
  auth.uid() = created_by 
  OR 
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
  OR
  -- Ver investigações da mesma delegacia
  (SELECT delegacia FROM investigacoes WHERE id = investigacoes.id) IN (
    SELECT raw_user_meta_data->>'delegacia' FROM auth.users WHERE id = auth.uid()
  )
);

-- Policy 2: Criar investigações
CREATE POLICY "Users can create investigations"
ON investigacoes FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Policy 3: Atualizar apenas próprias investigações
CREATE POLICY "Users can update their own investigations"
ON investigacoes FOR UPDATE
USING (
  auth.uid() = created_by
  OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  auth.uid() = created_by
  OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy 4: Deletar próprias investigações
CREATE POLICY "Users can delete their own investigations"
ON investigacoes FOR DELETE
USING (
  auth.uid() = created_by
  OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ============================================
-- PROVAS - Policies
-- ============================================

-- Policy 1: Ver provas de investigações que pode ver
CREATE POLICY "Users can view proofs of accessible investigations"
ON provas FOR SELECT
USING (
  investigacao_id IN (
    SELECT id FROM investigacoes WHERE auth.uid() = created_by
    OR auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- Policy 2: Adicionar provas
CREATE POLICY "Users can add proofs to their investigations"
ON provas FOR INSERT
WITH CHECK (
  investigacao_id IN (
    SELECT id FROM investigacoes 
    WHERE auth.uid() = created_by
  )
  OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy 3: Editar provas
CREATE POLICY "Users can edit proofs in their investigations"
ON provas FOR UPDATE
USING (
  investigacao_id IN (
    SELECT id FROM investigacoes 
    WHERE auth.uid() = created_by
  )
  OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy 4: Deletar provas
CREATE POLICY "Users can delete proofs from their investigations"
ON provas FOR DELETE
USING (
  investigacao_id IN (
    SELECT id FROM investigacoes 
    WHERE auth.uid() = created_by
  )
  OR
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin'
  )
);

-- ============================================
-- AUDIT TRAIL - Policies
-- ============================================

-- Policy 1: Ver auditoria de suas investigações
CREATE POLICY "Users can view audit of their investigations"
ON investigacao_auditoria FOR SELECT
USING (
  investigacao_id IN (
    SELECT id FROM investigacoes 
    WHERE auth.uid() = created_by
    OR auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- Policy 2: Sistema cria registros de auditoria
CREATE POLICY "System can create audit records"
ON investigacao_auditoria FOR INSERT
WITH CHECK (true);

-- ============================================
-- NOTAS - Policies (COMENTÁRIOS)
-- ============================================

-- Policy 1: Ver notas de investigações acessíveis
CREATE POLICY "Users can view notes on accessible investigations"
ON investigacao_notas FOR SELECT
USING (
  investigacao_id IN (
    SELECT id FROM investigacoes 
    WHERE auth.uid() = created_by
    OR auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- Policy 2: Criar notas
CREATE POLICY "Users can create notes on their investigations"
ON investigacao_notas FOR INSERT
WITH CHECK (
  auth.uid() = usuario_id
  AND
  investigacao_id IN (
    SELECT id FROM investigacoes 
    WHERE auth.uid() = created_by
  )
);

-- Policy 3: Editar próprias notas
CREATE POLICY "Users can edit their own notes"
ON investigacao_notas FOR UPDATE
USING (auth.uid() = usuario_id);

-- Policy 4: Deletar próprias notas
CREATE POLICY "Users can delete their own notes"
ON investigacao_notas FOR DELETE
USING (auth.uid() = usuario_id);

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

CREATE INDEX IF NOT EXISTS idx_audit_investigacao_id 
ON investigacao_auditoria(investigacao_id);

CREATE INDEX IF NOT EXISTS idx_notas_investigacao_id 
ON investigacao_notas(investigacao_id);

-- ============================================
-- VERIFICAR POLICIES (Execute para confirmar)
-- ============================================

-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('investigacoes', 'provas', 'investigacao_auditoria', 'investigacao_notas')
-- ORDER BY tablename;
