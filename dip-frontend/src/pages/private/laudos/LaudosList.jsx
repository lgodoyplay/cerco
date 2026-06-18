import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Calendar, 
  User,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useLaudos } from '../../../hooks/useLaudos';
import { usePermissions } from '../../../hooks/usePermissions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LaudosList = () => {
  const { laudos, loading, fetchLaudos } = useLaudos();
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const canManage = can('laudos_manage');

  useEffect(() => {
    fetchLaudos();
  }, [fetchLaudos]);

  const filteredLaudos = laudos.filter(item => 
    item.paciente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.paciente_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tipo_laudo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Psicológico': return <Stethoscope size={18} className="text-blue-400" />;
      case 'Médico Geral': return <User size={18} className="text-emerald-400" />;
      case 'Psiquiátrico': return <Stethoscope size={18} className="text-purple-400" />;
      default: return <FileText size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Stethoscope className="text-federal-500" size={32} />
            Laudos Médicos
          </h2>
          <p className="text-slate-400 mt-2">Gerencie laudos médicos cadastrados.</p>
        </div>
        {canManage && (
          <Link 
            to="/dashboard/laudos/new" 
            className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Novo Laudo
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome do paciente, documento ou tipo de laudo..."
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
          <p className="text-slate-400">Carregando laudos...</p>
        </div>
      ) : filteredLaudos.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
          <Stethoscope size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum laudo encontrado</h3>
          <p className="text-slate-400 mb-6">Comece cadastrando um novo laudo médico.</p>
          {canManage && (
            <Link 
              to="/dashboard/laudos/new" 
              className="inline-flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Novo Laudo
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLaudos.map((item) => (
            <button 
              key={item.id} 
              onClick={() => navigate(`/dashboard/laudos/${item.id}`)}
              className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-federal-500/50 hover:bg-slate-900/80 transition-all group"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-700">
                          {getTypeIcon(item.tipo_laudo)}
                          {item.tipo_laudo}
                        </span>
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(item.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-federal-400 transition-colors">
                        {item.paciente_nome || 'Paciente não identificado'}
                      </h3>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm line-clamp-2">
                    Documento: {item.paciente_documento || 'N/A'}
                  </p>

                  {/* Preview de Arquivos */}
                  {item.laudo_arquivos && item.laudo_arquivos.length > 0 && (
                    <div className="flex gap-2">
                      {item.laudo_arquivos.slice(0, 3).map((arquivo, idx) => (
                        <div key={idx} className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                          {arquivo.url?.toLowerCase().endsWith('.pdf') ? (
                            <FileText size={24} className="text-red-400" />
                          ) : (
                            arquivo.url ? (
                              <img src={arquivo.url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <ImageIcon size={24} className="text-slate-500" />
                            )
                          )}
                        </div>
                      ))}
                      {item.laudo_arquivos.length > 3 && (
                        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                          <span className="text-slate-400 font-bold text-xs">+{item.laudo_arquivos.length - 3}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-2 border-t border-slate-800/50">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium ml-auto">
                      <span className="text-slate-600">Por:</span>
                      {item.officer?.full_name || 'Desconhecido'}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LaudosList;