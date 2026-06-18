import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlvaras } from '../../../hooks/useAlvaras';
import { Search, Plus, Building2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const AlvaraList = () => {
  const { alvaras, loading } = useAlvaras();
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'expiring' | 'averiguado';
  const [searchTerm, setSearchTerm] = useState('');

  const isExpiringSoon = (dataValidade) => {
    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diffMs = validade - hoje;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays <= 15 && diffDays > 0;
  };

  const isExpired = (dataValidade) => {
    return new Date(dataValidade) < new Date();
  };

  const filteredAlvaras = alvaras.filter(alv => {
    const matchesSearch = (alv.estabelecimento || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (alv.endereco || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filter === 'active') {
      matchesStatus = !isExpired(alv.dataValidade) && alv.status !== 'Averiguado';
    } else if (filter === 'expiring') {
      matchesStatus = isExpiringSoon(alv.dataValidade);
    } else if (filter === 'averiguado') {
      matchesStatus = alv.status === 'Averiguado';
    }
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (alv) => {
    if (isExpired(alv.dataValidade) && alv.status !== 'Averiguado') return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (isExpiringSoon(alv.dataValidade)) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    if (alv.status === 'Averiguado') return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  };

  const getStatusText = (alv) => {
    if (alv.status === 'Averiguado') return 'Averiguado';
    if (isExpired(alv.dataValidade)) return 'Vencido';
    if (isExpiringSoon(alv.dataValidade)) return 'Vencendo em Breve';
    return 'Ativo';
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Building2 className="text-federal-500" size={32} />
            Alvarás
          </h2>
          <p className="text-slate-400 mt-2">Gerencie alvarás de estabelecimentos, renovações e averiguações.</p>
        </div>
        <Link 
          to="/dashboard/alvaras/new"
          className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Novo Alvará
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              filter === 'all' ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('active')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              filter === 'active' ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <CheckCircle size={16} /> Ativos
          </button>
          <button
            onClick={() => setFilter('expiring')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              filter === 'expiring' ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <AlertTriangle size={16} /> Vencendo Breve
          </button>
          <button
            onClick={() => setFilter('averiguado')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              filter === 'averiguado' ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <AlertTriangle size={16} /> Averiguados
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por estabelecimento ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500" />
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlvaras.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500">
              <Building2 size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhum alvará encontrado.</p>
            </div>
          ) : (
            filteredAlvaras.map(alv => (
              <Link 
                key={alv.id} 
                to={`/dashboard/alvaras/${alv.id}`}
                className="group bg-slate-900 border border-slate-800 hover:border-federal-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-federal-900/10 hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={clsx("px-2.5 py-1 rounded text-xs font-bold border", getStatusColor(alv))}>
                    {getStatusText(alv)}
                  </span>
                  <span className="text-slate-500 text-xs font-mono">{new Date(alv.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-federal-400 transition-colors line-clamp-1">{alv.estabelecimento}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">{alv.endereco}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <Clock size={14} />
                  <span>Válido até: {new Date(alv.dataValidade).toLocaleDateString('pt-BR')}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AlvaraList;
