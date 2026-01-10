import { useState, useEffect } from 'react';
import { Search, Filter, FileText, Eye, Printer, Shield, Calendar, MapPin, User, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

const BOList = () => {
  const [boletins, setBoletins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBO, setSelectedBO] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBoletins();
  }, []);

  const fetchBoletins = async () => {
    try {
      const { data, error } = await supabase
        .from('boletins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBoletins(data);
    } catch (error) {
      console.error('Erro ao buscar boletins:', error);
    }
  };

  const filteredBoletins = boletins.filter(bo => 
    (bo.comunicante || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bo.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bo.localizacao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bo.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredBoletins.length / itemsPerPage);
  const paginatedBoletins = filteredBoletins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrint = (bo) => {
    alert(`Imprimindo BO: ${bo.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-federal-500" size={28} />
            Boletins de Ocorrência
          </h2>
          <p className="text-slate-400 mt-1">Consulta de ocorrências registradas no sistema.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/bo')}
          className="px-4 py-2 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-federal-900/20 flex items-center gap-2"
        >
          <FileText size={18} />
          + Novo BO
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por comunicante, local, descrição ou ID..." 
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
                <th className="p-4 font-bold">ID / Data</th>
                <th className="p-4 font-bold">Comunicante</th>
                <th className="p-4 font-bold">Local / Descrição</th>
                <th className="p-4 font-bold">Responsável</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedBoletins.map((bo) => (
                <tr key={bo.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-slate-500">{bo.id.slice(0, 8)}...</span>
                      <div className="flex items-center gap-2 text-sm text-slate-300 mt-1">
                        <Calendar size={12} className="text-slate-500" />
                        {bo.data_fato && !isNaN(new Date(bo.data_fato).getTime()) 
                          ? format(new Date(bo.data_fato), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Data inválida'}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <User size={16} className="text-slate-500" />
                      {bo.comunicante}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <MapPin size={12} />
                      {bo.localizacao}
                    </div>
                    <div className="text-sm text-slate-300 line-clamp-1">{bo.descricao}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Shield size={14} className="text-federal-500" />
                      {bo.policial_responsavel || 'N/A'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {bo.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedBO(bo)}
                        className="p-2 hover:bg-federal-500/20 text-slate-400 hover:text-federal-400 rounded-lg transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handlePrint(bo)}
                        className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="Imprimir"
                      >
                        <Printer size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedBoletins.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Nenhum boletim encontrado.
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
      {selectedBO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="text-federal-500" />
                Detalhes do BO
              </h3>
              <button onClick={() => setSelectedBO(null)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <ChevronLeft className="text-slate-400 hover:text-white" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase">ID do Registro</span>
                  <p className="text-white font-mono text-sm">{selectedBO.id}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase">Data do Fato</span>
                  <p className="text-white font-medium">
                    {selectedBO.data_fato && !isNaN(new Date(selectedBO.data_fato).getTime()) 
                      ? format(new Date(selectedBO.data_fato), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Data inválida'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase font-bold">Comunicante</span>
                <p className="text-white text-lg font-medium border-b border-slate-800 pb-2">{selectedBO.comunicante}</p>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase font-bold">Local da Ocorrência</span>
                <p className="text-slate-300 flex items-center gap-2 mt-1">
                  <MapPin size={16} className="text-federal-500" />
                  {selectedBO.localizacao}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs text-slate-500 uppercase font-bold mb-2">Descrição dos Fatos</h4>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedBO.descricao}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <Shield size={20} className="text-federal-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Policial Responsável</p>
                  <p className="text-xs text-slate-400">{selectedBO.policial_responsavel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOList;
