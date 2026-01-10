import { useState, useEffect } from 'react';
import { Search, Filter, Eye, FileText, Download, Shield, User, Calendar, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';
import { supabase } from '../../lib/supabase';

const ArrestList = () => {
  const [arrests, setArrests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArrest, setSelectedArrest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchArrests = async () => {
      try {
        const { data, error } = await supabase
          .from('prisoes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedArrests = data.map(item => ({
          ...item,
          name: item.nome,
          passport: item.documento,
          reason: item.observacoes, // Mapping observacoes to reason/description context
          articles: item.artigo,
          officer: item.conduzido_por || 'N/A',
          description: item.observacoes,
          images: { 
            face: item.foto_principal 
          },
          date: item.data_prisao // Assuming this field exists based on schema
        }));
        setArrests(formattedArrests);
      } catch (error) {
        console.error('Erro ao buscar prisões:', error);
      }
    };

    fetchArrests();
  }, []);

  const filteredArrests = arrests.filter(arrest => 
    (arrest.name && typeof arrest.name === 'string' && arrest.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (arrest.passport && typeof arrest.passport === 'string' && arrest.passport.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (arrest.reason && typeof arrest.reason === 'string' && arrest.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredArrests.length / itemsPerPage);
  const paginatedArrests = filteredArrests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownloadReport = (arrest) => {
    alert(`Baixando relatório de prisão: ${arrest.name}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Preso': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Aguardando Audiência': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Liberado sob Fiança': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-federal-500" size={28} />
            Registro de Prisões
          </h2>
          <p className="text-slate-400 mt-1">Consulta geral de todas as prisões e detenções registradas.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, documento ou motivo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-federal-500 transition-colors"
          />
        </div>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg flex items-center gap-2 transition-colors">
          <Filter size={18} />
          Filtros
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Detento</th>
                <th className="p-4 font-bold">Documento</th>
                <th className="p-4 font-bold">Motivo / Artigos</th>
                <th className="p-4 font-bold">Data / Oficial</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedArrests.map((arrest) => (
                <tr key={arrest.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                        {arrest.images?.face ? (
                          <img src={arrest.images.face} alt={arrest.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} className="text-slate-500" />
                        )}
                      </div>
                      <span className="font-bold text-white">{arrest.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300 font-mono text-sm">{arrest.passport}</td>
                  <td className="p-4">
                    <div className="text-sm text-white font-medium">{arrest.reason}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{arrest.articles}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Calendar size={14} className="text-slate-500" />
                      {format(new Date(arrest.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Shield size={12} />
                      {arrest.officer}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={clsx("px-2 py-1 rounded text-xs font-bold border", getStatusColor(arrest.status))}>
                      {arrest.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedArrest(arrest)}
                        className="p-2 hover:bg-federal-500/20 text-slate-400 hover:text-federal-400 rounded-lg transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDownloadReport(arrest)}
                        className="p-2 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                        title="Baixar Relatório"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedArrests.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950">
            <span className="text-sm text-slate-500">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-400"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedArrest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="text-federal-500" />
                Detalhes da Prisão
              </h3>
              <button onClick={() => setSelectedArrest(null)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="text-slate-400 hover:text-white" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Photos */}
                <div className="space-y-4">
                  <div className="aspect-square bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
                    {selectedArrest.images?.face ? (
                      <img src={selectedArrest.images.face} alt="Rosto" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                        <User size={48} />
                        <span className="text-xs uppercase mt-2">Sem Foto</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-sm py-2 text-center text-xs font-bold text-white uppercase">
                      Foto do Detento
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {['bag', 'tablet', 'approach'].map(key => (
                      selectedArrest.images?.[key] && (
                        <div key={key} className="aspect-square bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative group cursor-pointer">
                          <img src={selectedArrest.images[key]} alt={key} className="w-full h-full object-cover" />
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Right Column: Info */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedArrest.name}</h2>
                        <p className="text-federal-400 font-mono text-sm mt-1">DOC: {selectedArrest.passport}</p>
                      </div>
                      <span className={clsx("px-3 py-1 rounded-lg text-sm font-bold border", getStatusColor(selectedArrest.status))}>
                        {selectedArrest.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Data da Ocorrência</span>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Calendar size={16} className="text-federal-500" />
                        {format(new Date(selectedArrest.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Oficial Responsável</span>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Shield size={16} className="text-federal-500" />
                        {selectedArrest.officer}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 uppercase font-bold block mb-2">Infrações e Artigos</span>
                    <h4 className="text-white font-bold mb-1">{selectedArrest.reason}</h4>
                    <p className="text-federal-400 text-sm">{selectedArrest.articles}</p>
                  </div>

                  {selectedArrest.description && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-500 uppercase font-bold block mb-2">Observações / Relatório</span>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                        {selectedArrest.description}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => handleDownloadReport(selectedArrest)}
                      className="flex-1 py-3 bg-federal-600 hover:bg-federal-500 text-white rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Baixar Relatório Completo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArrestList;
