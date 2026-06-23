import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { useSettingsContext } from '../../../context/SettingsContext';
import { Search, UserCog, Phone, IdCard, CheckCircle2, Clock3, XCircle, Trash2, MessageSquare, Shield } from 'lucide-react';

const STATUS_META = {
  pendente: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  em_analise: { label: 'Em análise', className: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  aprovado: { label: 'Aprovado', className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  recusado: { label: 'Recusado', className: 'bg-red-500/10 text-red-300 border-red-500/20' }
};

const IntegrationManager = () => {
  const { can } = usePermissions();
  const { logAction } = useSettingsContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos de login:', error);
      setNotification('Nao foi possivel carregar os pedidos de login.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return requests;

    return requests.filter((request) =>
      [request.full_name, request.passport_id, request.phone, request.desired_login, request.discord_name]
        .some((value) => String(value || '').toLowerCase().includes(term))
    );
  }, [requests, searchTerm]);

  const handleStatusChange = async (requestId, status) => {
    try {
      const { data, error } = await supabase
        .from('integration_requests')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', requestId)
        .select('*')
        .single();

      if (error) throw error;

      setRequests((prev) => prev.map((item) => (item.id === requestId ? data : item)));
      logAction('UPDATE_INTEGRATION_REQUEST', 'integration_requests', requestId, null, { status });
      setNotification(`Status atualizado para ${STATUS_META[status]?.label || status}.`);
    } catch (error) {
      console.error('Erro ao atualizar status do pedido de login:', error);
      setNotification('Nao foi possivel atualizar o status.');
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido de login?')) return;

    try {
      const { error } = await supabase
        .from('integration_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setRequests((prev) => prev.filter((item) => item.id !== requestId));
      logAction('DELETE_INTEGRATION_REQUEST', 'integration_requests', requestId, null, null);
      setNotification('Pedido de login excluido com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir pedido de login:', error);
      setNotification('Nao foi possivel excluir o pedido.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UserCog className="text-federal-500" size={30} />
            Integração
          </h1>
          <p className="text-slate-400 mt-2">
            Todos os pedidos de login enviados pela página inicial ficam salvos aqui.
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, passaporte ou login..."
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-federal-500"
          />
        </div>
      </div>

      {notification && (
        <div className="px-4 py-3 rounded-xl border border-federal-500/20 bg-federal-500/10 text-federal-200 text-sm">
          {notification}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[240px] bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-federal-500 rounded-full animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <Shield className="mx-auto text-slate-600 mb-4" size={40} />
          <p className="text-slate-300 font-semibold">Nenhum pedido de login encontrado.</p>
          <p className="text-slate-500 text-sm mt-2">Quando alguém usar o botão da home, vai aparecer aqui.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredRequests.map((request) => {
            const meta = STATUS_META[request.status] || STATUS_META.pendente;
            return (
              <div key={request.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-white">{request.full_name}</h2>
                      <span className={`px-3 py-1 rounded-full border text-xs font-bold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Enviado em {new Date(request.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {can('integration_manage') && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(request.id, 'em_analise')}
                        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                      >
                        Em análise
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(request.id, 'aprovado')}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(request.id, 'recusado')}
                        className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
                      >
                        Recusar
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2">
                      <IdCard size={14} />
                      Passaporte
                    </p>
                    <p className="text-white font-semibold">{request.passport_id}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2">
                      <Phone size={14} />
                      Telefone do jogo
                    </p>
                    <p className="text-white font-semibold">{request.phone}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2">
                      <UserCog size={14} />
                      Login desejado
                    </p>
                    <p className="text-white font-semibold">{request.desired_login}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2">
                      <MessageSquare size={14} />
                      Discord
                    </p>
                    <p className="text-white font-semibold">{request.discord_name || 'Nao informado'}</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-2">Observações</p>
                  <p className="text-slate-200 whitespace-pre-wrap">
                    {request.details || 'Sem observações adicionais.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={13} />
                      Revisado em: {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString('pt-BR') : 'Ainda nao'}
                    </span>
                  </div>

                  {can('integration_manage') && (
                    <button
                      type="button"
                      onClick={() => handleDelete(request.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IntegrationManager;
