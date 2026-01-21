import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { usePermissions } from '../../../hooks/usePermissions';
import { Search, Plus, FileText, Clock, CheckCircle, AlertTriangle, FolderOpen, Archive } from 'lucide-react';
import clsx from 'clsx';

const InvestigationList = () => {
  const { investigations } = useInvestigations();
  const { can } = usePermissions();
  const [filter, setFilter] = useState('active'); // 'active' | 'closed'
  const [searchTerm, setSearchTerm] = useState('');

  const canManage = can('investigations_manage');

  const filteredInvestigations = investigations.filter(inv => {
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
            to={category === 'financial' ? "/dashboard/investigations/new?category=financial" : "/dashboard/investigations/new"}
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
            <Archive size={16} /> Arquivadas
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
            <Link 
              key={inv.id} 
              to={`/dashboard/investigations/${inv.id}`}
              className="group bg-slate-900 border border-slate-800 hover:border-federal-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-federal-900/10 hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={clsx("px-2.5 py-1 rounded text-xs font-bold border", getPriorityColor(inv.priority))}>
                  {inv.priority}
                </span>
                <span className="text-slate-500 text-xs font-mono">{new Date(inv.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-federal-400 transition-colors line-clamp-1">{inv.title}</h3>
              <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10">{inv.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <FileText size={14} />
                  <span>{inv.proofs?.length || 0} Provas</span>
                </div>
                <div className="flex items-center gap-1 text-federal-400 text-xs font-bold uppercase tracking-wider">
                  Abrir <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default InvestigationList;
