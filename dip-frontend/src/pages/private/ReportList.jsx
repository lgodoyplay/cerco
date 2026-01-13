import { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, Eye, MapPin, Calendar, Phone, CheckCircle, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('denuncias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(data);
    } catch (error) {
      console.error('Erro ao buscar denúncias:', error);
    }
  };

  const filteredReports = reports.filter(report => 
    (report.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.localizacao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.contato || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={28} />
            Denúncias Recebidas
          </h2>
          <p className="text-slate-400 mt-1">Gerenciamento de denúncias anônimas recebidas pelo site.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por descrição, local ou contato..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-federal-500 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Data</th>
                <th className="p-4 font-bold">Localização</th>
                <th className="p-4 font-bold">Descrição (Resumo)</th>
                <th className="p-4 font-bold">Contato</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Calendar size={14} className="text-slate-500" />
                      {report.created_at && !isNaN(new Date(report.created_at).getTime()) 
                        ? format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : 'Data inválida'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <MapPin size={16} className="text-slate-500" />
                      {report.localizacao}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-300 line-clamp-1 max-w-xs">{report.descricao}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Phone size={14} className="text-federal-500" />
                      {report.contato || 'Anônimo'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      report.status === 'Pendente' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      report.status === 'Investigando' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                      {report.status || 'Pendente'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="p-2 hover:bg-federal-500/20 text-slate-400 hover:text-federal-400 rounded-lg transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedReports.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Nenhuma denúncia encontrada.
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
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-red-500" />
                Detalhes da Denúncia
              </h3>
              <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <ChevronLeft className="text-slate-400 hover:text-white" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase">Data do Recebimento</span>
                  <p className="text-white font-medium flex items-center gap-2 mt-1">
                    <Clock size={16} className="text-slate-500" />
                    {selectedReport.created_at && !isNaN(new Date(selectedReport.created_at).getTime()) 
                      ? format(new Date(selectedReport.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      : 'Data inválida'}
                  </p>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase">Status</span>
                  <div className="mt-1">
                     <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      selectedReport.status === 'Pendente' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      selectedReport.status === 'Investigando' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                      {selectedReport.status || 'Pendente'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase font-bold">Localização</span>
                <p className="text-slate-300 flex items-center gap-2 mt-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <MapPin size={16} className="text-federal-500" />
                  {selectedReport.localizacao}
                </p>
              </div>

              <div>
                 <span className="text-xs text-slate-500 uppercase font-bold">Contato Informado</span>
                 <p className="text-slate-300 flex items-center gap-2 mt-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                   <Phone size={16} className="text-federal-500" />
                   {selectedReport.contato || 'Não informado (Anônimo)'}
                 </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs text-slate-500 uppercase font-bold mb-2">Descrição da Denúncia</h4>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedReport.descricao}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportList;
