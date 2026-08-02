import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useInformantes } from '../../../hooks/useInformantes';
import { Search, Plus, FolderOpen, Clock, CheckCircle, AlertTriangle, X, Filter, UserPlus, FileText, Flag, Shield, AlertCircle, Star } from 'lucide-react';
import clsx from 'clsx';
import ConfirmModal from '../../../components/common/ConfirmModal';

const getStatusColor = (status) => {
  switch (status) {
    case 'Ativo': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'Inativo': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    case 'Suspenso': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
};

const InformantesList = () => {
  const { informantes, deleteInformante } = useInformantes();
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState(location.state?.notification || null);

  useEffect(() => {
    if (location.state?.notification) {
      setNotification(location.state.notification);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const activeCount = informantes.filter(inf => inf.status === 'Ativo').length;
  const inactiveCount = informantes.filter(inf => inf.status !== 'Ativo').length;
  const totalEntries = informantes.reduce((sum, inf) => sum + (inf.entries || []).length, 0);
  const pendingEntries = informantes.reduce((sum, inf) => sum + (inf.entries || []).filter(e => e.status === 'Pendente').length, 0);
  const verifiedEntries = informantes.reduce((sum, inf) => sum + (inf.entries || []).filter(e => e.status === 'Verificado').length, 0);

  const filteredInformantes = informantes.filter(inf => {
    const matchesStatus = filter === 'active' ? inf.status === 'Ativo' : inf.status !== 'Ativo';
    const matchesSearch =
      (inf.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inf.apelido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inf.documento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inf.relacao || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleDeleteConfirm = async () => {
    try {
      await deleteInformante(confirmDelete);
      setNotification({ type: 'success', message: 'Informante removido com sucesso.' });
    } catch (error) {
      setNotification({ type: 'error', message: error?.message || 'Não foi possível remover o informante.' });
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {confirmDelete && (
        <ConfirmModal
          message="Tem certeza que deseja remover este informante? Esta ação não pode ser desfeita."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {notification && (
        <div className={clsx(
          "mb-6 rounded-2xl border px-4 py-3 flex items-start gap-3 shadow-lg",
          notification.type === 'success' ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-100" : "bg-red-950/70 border-red-500/30 text-red-100"
        )}>
          {notification.type === 'success' ? <CheckCircle size={20} className="mt-0.5 shrink-0" /> : <AlertTriangle size={20} className="mt-0.5 shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold">{notification.type === 'success' ? 'Sucesso' : 'Erro'}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-current/80 hover:text-current transition-colors" aria-label="Fechar aviso">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <UserPlus className="text-federal-500" size={32} />
            Informantes
          </h2>
          <p className="text-slate-400 mt-2">Gerencie informantes e suas informações coletadas.</p>
        </div>
        <Link
          to="/dashboard/investigations/informantes/new"
          className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Novas Informações
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{informantes.length}</p>
          <p className="text-xs text-slate-500 uppercase font-bold mt-1">Total de Informantes</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-400">{pendingEntries}</p>
          <p className="text-xs text-slate-500 uppercase font-bold mt-1">Pendentes</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-400">{totalEntries}</p>
          <p className="text-xs text-slate-500 uppercase font-bold mt-1">Total Informações</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-400">{verifiedEntries}</p>
          <p className="text-xs text-slate-500 uppercase font-bold mt-1">Verificadas</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('active')}
            className={clsx("px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", filter === 'active' ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}
          >
            <CheckCircle size={16} /> Ativos
            <span className={clsx("ml-1 px-1.5 py-0.5 rounded text-xs", filter === 'active' ? "bg-federal-600 text-white" : "bg-slate-700 text-slate-400")}>{activeCount}</span>
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={clsx("px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", filter === 'inactive' ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}
          >
            <Clock size={16} /> Inativos
            <span className={clsx("ml-1 px-1.5 py-0.5 rounded text-xs", filter === 'inactive' ? "bg-slate-600 text-white" : "bg-slate-700 text-slate-400")}>{inactiveCount}</span>
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, apelido, documento ou relação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInformantes.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500">
            <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhum informante encontrado.</p>
            <p className="text-sm mt-1">Clique em "Novas Informações" para começar.</p>
          </div>
        ) : (
          filteredInformantes.map(inf => {
            const entryCount = (inf.entries || []).length;
            const pendingCount = (inf.entries || []).filter(e => e.status === 'Pendente').length;
            const verifiedCount = (inf.entries || []).filter(e => e.status === 'Verificado').length;
            return (
              <div key={inf.id} className="bg-slate-900 border border-slate-800 hover:border-federal-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-federal-900/10 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className={clsx("px-2.5 py-1 rounded text-xs font-bold border", getStatusColor(inf.status))}>
                    {inf.status}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/investigations/informantes/${inf.id}`); }}
                      className="p-1.5 text-slate-400 hover:text-federal-400 hover:bg-slate-800 rounded-lg transition-colors"
                      aria-label="Ver detalhes"
                    >
                      <FolderOpen size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(inf.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      aria-label="Remover informante"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <Link to={`/dashboard/investigations/informantes/${inf.id}`} className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 hover:text-federal-400 transition-colors line-clamp-1">{inf.nome}</h3>
                  {inf.apelido && (
                    <p className="text-slate-400 text-sm mb-2">Alias: {inf.apelido}</p>
                  )}
                  {inf.relacao && (
                    <p className="text-slate-500 text-xs mb-2">Relação: {inf.relacao}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <FileText size={12} />
                      <span>{entryCount} informação(ões)</span>
                    </div>
                    {pendingCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-500">
                        <AlertCircle size={12} />
                        <span>{pendingCount} pendente(s)</span>
                      </div>
                    )}
                    {verifiedCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                        <Star size={12} />
                        <span>{verifiedCount} verificada(s)</span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="mt-auto space-y-2 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>{new Date(inf.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <Link
                    to={`/dashboard/investigations/informantes/${inf.id}`}
                    className="flex items-center justify-end gap-1 text-federal-400 text-xs font-bold uppercase tracking-wider hover:underline"
                  >
                    Abrir <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InformantesList;