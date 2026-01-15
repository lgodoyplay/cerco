import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileSearch, 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  User, 
  Car,
  Youtube,
  Image as ImageIcon
} from 'lucide-react';
import { useForensics } from '../../../hooks/useForensics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ForensicsList = () => {
  const { forensics, loading, fetchForensics } = useForensics();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchForensics();
  }, [fetchForensics]);

  const filteredForensics = forensics.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Pessoa': return <User size={18} className="text-blue-400" />;
      case 'Local': return <MapPin size={18} className="text-emerald-400" />;
      case 'Veículo': return <Car size={18} className="text-orange-400" />;
      default: return <FileSearch size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileSearch className="text-federal-500" size={32} />
            Perícias
          </h2>
          <p className="text-slate-400 mt-2">Gerencie relatórios de perícia técnica (Pessoas, Locais e Veículos).</p>
        </div>
        <Link 
          to="/dashboard/forensics/new" 
          className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Nova Perícia
        </Link>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por título, descrição ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando perícias...</p>
        </div>
      ) : filteredForensics.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
          <FileSearch size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma perícia encontrada</h3>
          <p className="text-slate-400 mb-6">Comece registrando uma nova perícia técnica.</p>
          <Link 
            to="/dashboard/forensics/new" 
            className="inline-flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            Nova Perícia
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredForensics.map((item) => (
            <div 
              key={item.id} 
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-federal-500/50 transition-all group"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-700">
                          {getTypeIcon(item.type)}
                          {item.type}
                        </span>
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(item.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-federal-400 transition-colors">
                        {item.title || 'Sem título'}
                      </h3>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-6 pt-2 border-t border-slate-800/50">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                      <ImageIcon size={14} />
                      {item.pericia_fotos?.length || 0} Fotos
                    </div>
                    {item.youtube_link && (
                      <a 
                        href={item.youtube_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                      >
                        <Youtube size={14} />
                        Vídeo Anexado
                      </a>
                    )}
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium ml-auto">
                      <span className="text-slate-600">Por:</span>
                      {item.officer?.full_name || 'Desconhecido'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForensicsList;
