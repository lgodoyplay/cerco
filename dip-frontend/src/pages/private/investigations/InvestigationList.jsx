import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { usePermissions } from '../../../hooks/usePermissions';
import { Search, Plus, FileText, Clock, CheckCircle, AlertTriangle, FolderOpen, Archive, Edit3, Trash2, X } from 'lucide-react';
import clsx from 'clsx';

const InvestigationList = ({ category = 'criminal', title }) => {
  const { investigations, deleteInvestigation } = useInvestigations();
  const { can } = usePermissions();
  const [filter, setFilter] = useState('active'); // 'active' | 'closed'
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [notification, setNotification] = useState(location.state?.notification || null);

  const canManage = can('investigations_manage');

  useEffect(() => {
    if (location.state?.notification) {
      setNotification(location.state.notification);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!notification) return undefined;

    const timer = window.setTimeout(() => {
      setNotification(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [notification]);

  const filteredInvestigations = investigations
    .filter(inv => inv.category === category) // Filter by category
    .filter(inv => {
      const isClosed = inv.status === 'Encerrada' || inv.status === 'Finalizada';
      const matchesStatus = filter === 'active' ? !isClosed : isClosed;
      const matchesSearch = (inv.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (inv.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Alta': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Média': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Baixa': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {notification && (
        <div
          className={clsx(
            "mb-6 rounded-2xl border px-4 py-3 flex items-start gap-3 shadow-lg",
            notification.type === 'success'
              ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-100"
              : "bg-red-950/70 border-red-500/30 text-red-100"
          )}
        >
          {notification.type === 'success' ? <CheckCircle size={20} className="mt-0.5 shrink-0" /> : <AlertTriangle size={20} className="mt-0.5 shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold">{notification.type === 'success' ? 'Sucesso' : 'Erro'}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-current/80 hover:text-current transition-colors"
            aria-label="Fechar aviso"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <FolderOpen className="text-federal-500" size={32} />
            {title || 'Investigações'}
          </h2>
          <p className="text-slate-400 mt-2">Gerencie inquéritos, provas e relatórios do departamento.</p>
        </div>
        {canManage && (
          <Link 
            to={category === 'financial' ? "/dashboard/revenue/investigations/new?category=financial" : "/dashboard/investigations/new"}
            className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5"
          >
            <Plus size={20} />
            {category === 'financial' ? 'Nova Investigação Financeira' : 'Nova Investigação'}
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('active')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              filter === 'active' ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Clock size={16} /> Em Andamento
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              filter === 'closed' ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Archive size={16} /> {category === 'financial' ? 'Finalizadas' : 'Arquivadas'}
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, descrição ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvestigations.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500">
            <FolderOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhuma investigação encontrada.</p>
          </div>
        ) : (
          filteredInvestigations.map(inv => (
            <div 
              key={inv.id} 
              className="bg-slate-900 border border-slate-800 hover:border-federal-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-federal-900/10"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={clsx("px-2.5 py-1 rounded text-xs font-bold border", getPriorityColor(inv.priority))}>
                  {inv.priority}
                </span>
                <div className="flex gap-2">
                  {canManage && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(category === 'financial' ? `/dashboard/revenue/investigations/${inv.id}/edit` : `/dashboard/investigations/${inv.id}/edit`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-federal-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('Tem certeza que deseja deletar esta investigação?')) {
                            try {
                              await deleteInvestigation(inv.id);
                              setNotification({
                                type: 'success',
                                message: 'Investigacao deletada com sucesso.'
                              });
                            } catch (error) {
                              console.error('Erro ao deletar investigação:', error);
                              setNotification({
                                type: 'error',
                                message: error?.message || 'Nao foi possivel deletar a investigacao.'
                              });
                            }
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <Link 
                to={category === 'financial' ? `/dashboard/revenue/investigations/${inv.id}` : `/dashboard/investigations/${inv.id}`}
              >
                <h3 className="text-xl font-bold text-white mb-2 hover:text-federal-400 transition-colors line-clamp-1">{inv.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10">{inv.description}</p>
              </Link>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <FileText size={14} />
                  <span>{inv.proofs?.length || 0} Provas</span>
                </div>
                <Link 
                  to={category === 'financial' ? `/dashboard/revenue/investigations/${inv.id}` : `/dashboard/investigations/${inv.id}`}
                  className="flex items-center gap-1 text-federal-400 text-xs font-bold uppercase tracking-wider hover:underline"
                >
                  Abrir <span>→</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InvestigationList;
