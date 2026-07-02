/**
 * AUDIT TRAIL - Sistema de Auditoria para Investigações
 * Rastreia todas as mudanças: quem, o quê, quando, e as alterações
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// ============================================
// TIPOS DE AÇÕES
// ============================================

export const AUDIT_ACTIONS = {
  INVESTIGATION_CREATED: 'investigacao_criada',
  INVESTIGATION_UPDATED: 'investigacao_atualizada',
  INVESTIGATION_DELETED: 'investigacao_deletada',
  INVESTIGATION_FINALIZED: 'investigacao_finalizada',
  INVESTIGATION_ARCHIVED: 'investigacao_arquivada',
  PROOF_ADDED: 'prova_adicionada',
  PROOF_UPDATED: 'prova_atualizada',
  PROOF_DELETED: 'prova_deletada',
  NOTE_ADDED: 'nota_adicionada',
  NOTE_UPDATED: 'nota_atualizada',
  NOTE_DELETED: 'nota_deletada',
  STATUS_CHANGED: 'status_alterado',
  PRIORITY_CHANGED: 'prioridade_alterada',
  DELEGATED: 'delegada',
  ACCESSED: 'acessada'
};

// ============================================
// FUNÇÃO PRINCIPAL DE AUDITORIA
// ============================================

/**
 * Registrar ação de auditoria
 * @param {number} investigacaoId - ID da investigação
 * @param {string} usuarioId - ID do usuário que fez a ação
 * @param {string} acao - Tipo de ação (usar constantes AUDIT_ACTIONS)
 * @param {object} novosDados - Dados novos/alterados
 * @param {object} dadosAntigos - Dados anteriores (para UPDATE/DELETE)
 * @param {object} metadados - Dados adicionais (IP, User-Agent, etc)
 */
export const createAuditLog = async (
  investigacaoId,
  usuarioId,
  acao,
  novosDados = null,
  dadosAntigos = null,
  metadados = {}
) => {
  try {
    // Preparar dados para auditoria
    const auditEntry = {
      investigacao_id: investigacaoId,
      usuario_id: usuarioId,
      acao,
      novos_dados: novosDados ? JSON.stringify(novosDados) : null,
      dados_antigos: dadosAntigos ? JSON.stringify(dadosAntigos) : null,
      mudancas: calculaMudancas(dadosAntigos, novosDados),
      metadados: JSON.stringify({
        timestamp: new Date().toISOString(),
        ip: metadados.ip || null,
        userAgent: metadados.userAgent || null,
        ...metadados
      }),
      criado_em: new Date().toISOString()
    };

    const { error } = await supabase
      .from('investigacao_auditoria')
      .insert([auditEntry]);

    if (error) {
      console.error('❌ Erro ao registrar auditoria:', error);
      // Não falhar operação se auditoria falhar
      return null;
    }

    return auditEntry;
  } catch (error) {
    console.error('❌ Erro ao criar log de auditoria:', error);
    return null;
  }
};

// ============================================
// HELPERS
// ============================================

/**
 * Calcular diferenças entre dois objetos
 */
const calculaMudancas = (antes, depois) => {
  if (!antes || !depois) return null;

  const mudancas = {};
  const todasAsChaves = new Set([
    ...Object.keys(antes || {}),
    ...Object.keys(depois || {})
  ]);

  todasAsChaves.forEach(chave => {
    if (JSON.stringify(antes?.[chave]) !== JSON.stringify(depois?.[chave])) {
      mudancas[chave] = {
        antes: antes?.[chave],
        depois: depois?.[chave]
      };
    }
  });

  return Object.keys(mudancas).length > 0 ? JSON.stringify(mudancas) : null;
};

/**
 * Formatar log de auditoria para exibição
 */
export const formatarLogAuditoria = (log) => {
  const acoes = {
    [AUDIT_ACTIONS.INVESTIGATION_CREATED]: {
      emoji: '✨',
      label: 'Investigação criada'
    },
    [AUDIT_ACTIONS.INVESTIGATION_UPDATED]: {
      emoji: '✏️',
      label: 'Investigação atualizada'
    },
    [AUDIT_ACTIONS.INVESTIGATION_DELETED]: {
      emoji: '🗑️',
      label: 'Investigação deletada'
    },
    [AUDIT_ACTIONS.INVESTIGATION_FINALIZED]: {
      emoji: '✅',
      label: 'Investigação finalizada'
    },
    [AUDIT_ACTIONS.PROOF_ADDED]: {
      emoji: '📎',
      label: 'Prova adicionada'
    },
    [AUDIT_ACTIONS.PROOF_DELETED]: {
      emoji: '❌',
      label: 'Prova removida'
    },
    [AUDIT_ACTIONS.STATUS_CHANGED]: {
      emoji: '🔄',
      label: 'Status alterado'
    },
    [AUDIT_ACTIONS.PRIORITY_CHANGED]: {
      emoji: '📊',
      label: 'Prioridade alterada'
    },
    [AUDIT_ACTIONS.NOTE_ADDED]: {
      emoji: '💬',
      label: 'Nota adicionada'
    },
    [AUDIT_ACTIONS.ACCESSED]: {
      emoji: '👁️',
      label: 'Investigação acessada'
    }
  };

  const acao = acoes[log.acao] || { emoji: '❓', label: log.acao };

  return {
    ...log,
    acao_formatada: acao
  };
};

// ============================================
// FUNÇÕES DE BUSCA/RECUPERAÇÃO
// ============================================

/**
 * Buscar logs de auditoria de uma investigação
 */
export const buscarLogsAuditoria = async (investigacaoId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('investigacao_auditoria')
      .select('*')
      .eq('investigacao_id', investigacaoId)
      .order('criado_em', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map(log => formatarLogAuditoria(log)) || [];
  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error);
    return [];
  }
};

/**
 * Buscar todas as alterações de um usuário em período
 */
export const buscarAltacoesUsuario = async (usuarioId, dataInicio, dataFim) => {
  try {
    const { data, error } = await supabase
      .from('investigacao_auditoria')
      .select('*')
      .eq('usuario_id', usuarioId)
      .gte('criado_em', dataInicio)
      .lte('criado_em', dataFim)
      .order('criado_em', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro:', error);
    return [];
  }
};

/**
 * Buscar alterações específicas em um campo
 */
export const buscarMudancasEmCampo = async (investigacaoId, campo) => {
  try {
    const logs = await buscarLogsAuditoria(investigacaoId, 200);

    return logs.filter(log => {
      try {
        const mudancas = JSON.parse(log.mudancas || '{}');
        return mudancas[campo];
      } catch {
        return false;
      }
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    return [];
  }
};

/**
 * Comparar versões de um documento
 */
export const compararVersoes = (logAnterior, logAtual) => {
  try {
    const antes = JSON.parse(logAnterior?.novos_dados || '{}');
    const depois = JSON.parse(logAtual?.novos_dados || '{}');

    const mudancas = {};
    Object.keys({ ...antes, ...depois }).forEach(chave => {
      if (JSON.stringify(antes[chave]) !== JSON.stringify(depois[chave])) {
        mudancas[chave] = {
          antes: antes[chave],
          depois: depois[chave]
        };
      }
    });

    return mudancas;
  } catch (error) {
    console.error('❌ Erro ao comparar:', error);
    return null;
  }
};

export default {
  createAuditLog,
  buscarLogsAuditoria,
  buscarAltacoesUsuario,
  buscarMudancasEmCampo,
  compararVersoes,
  AUDIT_ACTIONS,
  formatarLogAuditoria
};
