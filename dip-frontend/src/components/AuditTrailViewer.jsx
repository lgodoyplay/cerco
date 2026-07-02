import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter, Clock } from 'lucide-react';

/**
 * AuditTrailViewer - Exibir histórico de alterações
 * Mostra timeline de todas as ações em uma investigação
 */
export const AuditTrailViewer = ({ investigacaoId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [investigacaoId]);

  const loadLogs = async () => {
    try {
      // TODO: Implementar endpoint GET /api/investigations/:id/audit
      const response = await fetch(`/api/investigations/${investigacaoId}/audit`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.acao.includes(filter));

  const getAcaoEmoji = (acao) => {
    const emojis = {
      'criada': '✨',
      'atualizada': '✏️',
      'deletada': '🗑️',
      'adicionada': '📎',
      'alterado': '🔄',
      'finalizada': '✅',
      'acessada': '👁️'
    };

    for (const [palavra, emoji] of Object.entries(emojis)) {
      if (acao.includes(palavra)) return emoji;
    }
    return '📝';
  };

  if (loading) {
    return <div className="text-center text-slate-400">Carregando histórico...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtro */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-slate-500" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-sm border border-slate-700"
        >
          <option value="all">Todas as ações</option>
          <option value="criada">Criadas</option>
          <option value="atualizada">Atualizadas</option>
          <option value="adicionada">Adicionadas</option>
          <option value="deletada">Deletadas</option>
          <option value="alterado">Alterações</option>
        </select>
        <span className="text-xs text-slate-500">
          {filteredLogs.length} eventos
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="p-4 text-center text-slate-500 bg-slate-800 rounded-lg">
            Nenhum evento encontrado
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <AuditLogItem
              key={log.id}
              log={log}
              emoji={getAcaoEmoji(log.acao)}
              isExpanded={expandedLog === idx}
              onToggle={() => setExpandedLog(expandedLog === idx ? null : idx)}
              isFirst={idx === 0}
            />
          ))
        )}
      </div>
    </div>
  );
};

/**
 * AuditLogItem - Uma linha de log expansível
 */
const AuditLogItem = ({ log, emoji, isExpanded, onToggle, isFirst }) => {
  const dataCriacao = new Date(log.criado_em);
  const dataFormatada = dataCriacao.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Parse de dados JSON se existir
  let mudancas = null;
  try {
    mudancas = JSON.parse(log.mudancas || '{}');
  } catch { }

  return (
    <div className={`border-l-2 transition-colors ${
      isFirst ? 'border-federal-500' : 'border-slate-700'
    }`}>
      <button
        onClick={onToggle}
        className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-left"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Emoji da ação */}
            <span className="text-2xl flex-shrink-0">{emoji}</span>

            {/* Info principal */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-white capitalize">
                  {log.acao.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-400">
                  por {log.usuario_nome || 'Usuário'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <Clock size={12} />
                {dataFormatada}
              </div>
            </div>
          </div>

          {/* Ícone de expansão */}
          {mudancas && Object.keys(mudancas).length > 0 && (
            <div className="flex-shrink-0 ml-2">
              {isExpanded ? (
                <ChevronUp size={20} className="text-slate-400" />
              ) : (
                <ChevronDown size={20} className="text-slate-400" />
              )}
            </div>
          )}
        </div>
      </button>

      {/* Detalhes expansíveis */}
      {isExpanded && mudancas && Object.keys(mudancas).length > 0 && (
        <div className="p-3 bg-slate-900 border-t border-slate-700 space-y-2">
          {Object.entries(mudancas).map(([campo, { antes, depois }]) => (
            <div key={campo} className="text-xs">
              <span className="font-medium text-slate-300">{campo}:</span>
              <div className="mt-1 space-y-1 ml-2">
                <div className="text-red-400">
                  <span className="text-slate-600">Antes: </span>
                  <code className="bg-red-900/20 px-2 py-1 rounded">
                    {formatarValor(antes)}
                  </code>
                </div>
                <div className="text-emerald-400">
                  <span className="text-slate-600">Depois: </span>
                  <code className="bg-emerald-900/20 px-2 py-1 rounded">
                    {formatarValor(depois)}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Formatar valores para exibição
 */
const formatarValor = (valor) => {
  if (valor === null || valor === undefined) return '(vazio)';
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  if (typeof valor === 'object') return JSON.stringify(valor);
  if (String(valor).length > 100) return String(valor).substring(0, 100) + '...';
  return String(valor);
};

/**
 * Hook para usar auditoria
 */
export const useAuditTrail = (investigacaoId) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/investigations/${investigacaoId}/audit`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    logs,
    loading,
    loadLogs,
    totalLogs: logs.length,
    lastAction: logs[0],
    recentActions: logs.slice(0, 5)
  };
};

export default AuditTrailViewer;
