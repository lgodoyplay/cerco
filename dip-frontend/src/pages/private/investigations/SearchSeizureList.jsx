
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { usePermissions } from '../../../hooks/usePermissions';
import { Search, Plus, FileText, Clock, Archive, Edit3, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const SearchSeizureList = () => {
  const { investigations, deleteInvestigation } = useInvestigations();
  const { can } = usePermissions();
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const canManage = can('investigations_manage');

  // Filter investigations for search_and_seizure category
  const filteredInvestigations = investigations
    .filter(inv => inv.category === 'search_and_seizure')
    .filter(inv => {
      const isClosed = inv.status === 'Encerrada' || inv.status === 'Finalizada' || inv.status === 'Arquivada';
      const matchesStatus = filter === 'active' ? !isClosed : isClosed;
      const matchesSearch = 
        (inv.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (inv.nomeEntidade || '').toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            Busca e Apreensão
          </h2>
          <p className="text-slate-400 mt-2">Gerencie buscas e apreensões realizadas.</p>
        </div>
        {canManage && (
          <Link 
            to="/dashboard/search-seizure/new"
            className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Nova Busca e Apreensão
          </Link>
        )}
      </div>

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
            placeholder="Buscar por nome ou título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvestigations.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500">
            <p className="text-lg font-medium">Nenhuma busca e apreensão encontrada.</p>
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
                          navigate(`/dashboard/search-seizure/${inv.id}/edit`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-federal-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('Tem certeza que deseja deletar esta busca e apreensão?')) {
                            await deleteInvestigation(inv.id);
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
              
              <Link to={`/dashboard/search-seizure/${inv.id}`}>
                <h3 className="text-xl font-bold text-white mb-2 hover:text-federal-400 transition-colors line-clamp-1">{inv.title}</h3>
                {inv.nomeEntidade && (
                  <p className="text-slate-400 text-sm mb-1">{inv.nomeEntidade}</p>
                )}
                <p className="text-slate-500 text-xs">
                  {inv.quantidadeCasas} casa{inv.quantidadeCasas !== 1 ? 's' : ''} • {inv.quantidadeCarros} carro{inv.quantidadeCarros !== 1 ? 's' : ''}
                </p>
              </Link>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <FileText size={14} />
                </div>
                <Link 
                  to={`/dashboard/search-seizure/${inv.id}`}
                  className="flex items-center gap-1 text-federal-400 text-xs font-bold uppercase tracking-wider hover:underline"
                >
                  Abrir →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchSeizureList;
