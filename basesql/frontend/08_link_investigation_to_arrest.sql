-- ============================================
-- VINCULAR INVESTIGAÇÕES A PRISÕES/PROCURADOS
-- Execute no Supabase SQL Editor
-- ============================================

-- Adicionar coluna de relacionamento à tabela investigacoes
ALTER TABLE investigacoes 
ADD COLUMN IF NOT EXISTS arresto_id BIGINT REFERENCES arrestos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS procurado_id BIGINT REFERENCES wanted_persons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS buscas_apreensoes_ids BIGINT[] DEFAULT '{}';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_investigacoes_arresto_id 
ON investigacoes(arresto_id);

CREATE INDEX IF NOT EXISTS idx_investigacoes_procurado_id 
ON investigacoes(procurado_id);

-- ============================================
-- VIEW: Investigação com Detalhes Completos
-- ============================================

CREATE OR REPLACE VIEW investigacoes_completas AS
SELECT 
  inv.id,
  inv.titulo,
  inv.descricao,
  inv.status,
  inv.prioridade,
  inv.data_inicio,
  inv.created_by,
  inv.responsavel,
  -- Dados de prisão relacionada
  arr.id as arresto_id,
  arr.nome_preso,
  arr.documento_preso,
  arr.data_prisao,
  -- Dados de procurado relacionado
  wp.id as procurado_id,
  wp.nome_pessoa,
  wp.documento_pessoa,
  -- Contagem
  (SELECT COUNT(*) FROM provas WHERE investigacao_id = inv.id) as total_provas,
  (SELECT COUNT(*) FROM investigacao_notas WHERE investigacao_id = inv.id) as total_notas
FROM investigacoes inv
LEFT JOIN arrestos arr ON inv.arresto_id = arr.id
LEFT JOIN wanted_persons wp ON inv.procurado_id = wp.id;

-- ============================================
-- FUNÇÃO: Buscar investigações relacionadas a prisão
-- ============================================

CREATE OR REPLACE FUNCTION buscar_investigacoes_por_arresto(p_arresto_id BIGINT)
RETURNS TABLE (
  id BIGINT,
  titulo TEXT,
  status TEXT,
  prioridade TEXT,
  data_criacao TIMESTAMP,
  total_provas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    inv.id,
    inv.titulo,
    inv.status,
    inv.prioridade,
    inv.created_at,
    COUNT(pr.id) as total_provas
  FROM investigacoes inv
  LEFT JOIN provas pr ON inv.id = pr.investigacao_id
  WHERE inv.arresto_id = p_arresto_id
  GROUP BY inv.id, inv.titulo, inv.status, inv.prioridade, inv.created_at
  ORDER BY inv.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Buscar investigações de procurado
-- ============================================

CREATE OR REPLACE FUNCTION buscar_investigacoes_por_procurado(p_procurado_id BIGINT)
RETURNS TABLE (
  id BIGINT,
  titulo TEXT,
  status TEXT,
  responsavel TEXT,
  total_provas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    inv.id,
    inv.titulo,
    inv.status,
    inv.responsavel,
    COUNT(pr.id) as total_provas
  FROM investigacoes inv
  LEFT JOIN provas pr ON inv.id = pr.investigacao_id
  WHERE inv.procurado_id = p_procurado_id
  GROUP BY inv.id, inv.titulo, inv.status, inv.responsavel
  ORDER BY inv.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Criar relacionamento
-- ============================================

CREATE OR REPLACE FUNCTION vincular_investigacao_a_arresto(
  p_investigacao_id BIGINT,
  p_arresto_id BIGINT
)
RETURNS void AS $$
BEGIN
  UPDATE investigacoes 
  SET arresto_id = p_arresto_id
  WHERE id = p_investigacao_id;
  
  -- Log de auditoria
  INSERT INTO investigacao_auditoria (
    investigacao_id,
    usuario_id,
    acao,
    novos_dados,
    mudancas
  ) VALUES (
    p_investigacao_id,
    auth.uid(),
    'investigacao_vinculada_a_arresto',
    json_build_object('arresto_id', p_arresto_id),
    json_build_object('arresto_id', json_build_object('antes', null, 'depois', p_arresto_id))
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS: Atualizar status automaticamente
-- ============================================

-- Se prisão é finalizada, marcar investigação como "Para revisão"
CREATE OR REPLACE FUNCTION on_arresto_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Finalizado' AND OLD.status != 'Finalizado' THEN
    UPDATE investigacoes 
    SET status = 'Aguardando Análise'
    WHERE arresto_id = NEW.id AND status = 'Em Andamento';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_arresto_status_change
AFTER UPDATE ON arrestos
FOR EACH ROW
EXECUTE FUNCTION on_arresto_status_change();

-- ============================================
-- EXEMPLO DE USO NO BACKEND
-- ============================================

/*

// Em investigation.controller.ts

// Vincular investigação a prisão
export const linkInvestigationToArrest = async (req: Request, res: Response) => {
  const { investigacaoId, arrestoId } = req.body;
  
  const { error } = await supabase.rpc('vincular_investigacao_a_arresto', {
    p_investigacao_id: investigacaoId,
    p_arresto_id: arrestoId
  });
  
  if (error) return res.status(400).json({ error });
  res.json({ message: 'Investigação vinculada com sucesso' });
};

// Buscar investigações de uma prisão
export const getArrestInvestigations = async (req: Request, res: Response) => {
  const { arrestoId } = req.params;
  
  const { data, error } = await supabase.rpc('buscar_investigacoes_por_arresto', {
    p_arresto_id: arrestoId
  });
  
  if (error) return res.status(400).json({ error });
  res.json(data);
};

*/
