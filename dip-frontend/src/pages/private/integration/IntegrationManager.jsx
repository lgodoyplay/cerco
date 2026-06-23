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

  const stats = useMemo(() => ({
    total: requests.length,
    pendente: requests.filter((item) => item.status === 'pendente').length,
    aprovado: requests.filter((item) => item.status === 'aprovado').length,
    recusado: requests.filter((item) => item.status === 'recusado').length
  }), [requests]);

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
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 lg:p-7">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-federal-500/20 bg-federal-500/10 text-federal-200 text-xs font-semibold uppercase tracking-[0.18em]">
              <UserCog size={14} />
              Pedidos de Login
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <UserCog className="text-federal-500" size={30} />
                Integração
              </h1>
              <p className="text-slate-400 mt-2 max-w-2xl">
                Todos os pedidos enviados pela página inicial ficam salvos aqui para análise, aprovação ou recusa.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto xl:min-w-[560px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase font-bold tracking-wide text-slate-500">Total</p>
              <p className="text-2xl font-bold text-white mt-2">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
              <p className="text-xs uppercase font-bold tracking-wide text-amber-300/80">Pendentes</p>
              <p className="text-2xl font-bold text-amber-200 mt-2">{stats.pendente}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
              <p className="text-xs uppercase font-bold tracking-wide text-emerald-300/80">Aprovados</p>
              <p className="text-2xl font-bold text-emerald-200 mt-2">{stats.aprovado}</p>
            </div>
            <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
              <p className="text-xs uppercase font-bold tracking-wide text-red-300/80">Recusados</p>
              <p className="text-2xl font-bold text-red-200 mt-2">{stats.recusado}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, passaporte, telefone, login ou Discord..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-federal-500"
            />
          </div>
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
              <div key={request.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl shadow-slate-950/10">
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
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-slate-500 mb-3">
                        Ações Rápidas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(request.id, 'em_analise')}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                        >
                          <Clock3 size={15} />
                          Em análise
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(request.id, 'aprovado')}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                        >
                          <CheckCircle2 size={15} />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(request.id, 'recusado')}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
                        >
                          <XCircle size={15} />
                          Recusar
                        </button>
                      </div>
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
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold transition-colors"
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
