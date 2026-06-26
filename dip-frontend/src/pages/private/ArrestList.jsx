import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Eye, Download, Shield, User, Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, Trash2, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { usePermissions } from '../../hooks/usePermissions';
import { generateProfessionalPDF } from '../../utils/pdfGeneratorPro';
import NotificationBanner from '../../components/feedback/NotificationBanner';
import { buildArrestRecord } from '../../utils/arrestWantedMedia';

const ArrestList = () => {
  const { user } = useAuth();
  const { templates } = useSettings();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const canManage = can('arrest_manage');
  const [arrests, setArrests] = useState([]);
  const [boletins, setBoletins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLegalId, setExpandedLegalId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteModal, setDeleteModal] = useState({ show: false, arrest: null });
  const [deletePassword, setDeletePassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(location.state?.notification || null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch arrests
        const { data: arrestsData, error: arrestsError } = await supabase
          .from('prisoes')
          .select('*')
          .order('created_at', { ascending: false });
        if (arrestsError) throw arrestsError;

        // Fetch boletins
        const { data: boletinsData, error: boletinsError } = await supabase
          .from('boletins')
          .select('id, comunicante, descricao');
        if (boletinsError) throw boletinsError;
        setBoletins(boletinsData || []);

        const formattedArrests = arrestsData.map((item) => buildArrestRecord(
          item,
          boletinsData?.find((b) => b.id === item.bo_id)
        ));
        setArrests(formattedArrests);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setNotification({
          type: 'error',
          message: error?.message || 'Nao foi possivel carregar as prisoes.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const filteredArrests = arrests.filter(arrest => 
    (arrest.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (arrest.passport || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (arrest.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredArrests.length / itemsPerPage);
  const paginatedArrests = filteredArrests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownloadReport = async (arrest) => {
    try {
      await generateProfessionalPDF(
        arrest,
        user,
        templates?.arrest,
        'arrest',
        templates?.__layoutConfig?.arrest,
        templates?.__pageHeaderConfig
      );
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel gerar o PDF da prisao.'
      });
    }
  };

  const handleDeleteArrest = async () => {
    if (deletePassword !== '4907') {
      setNotification({ type: 'warning', message: 'Senha incorreta para remover a prisao.' });
      return;
    }

    try {
      const { error } = await supabase
        .from('prisoes')
        .delete()
        .eq('id', deleteModal.arrest.id);

      if (error) throw error;

      setArrests(prev => prev.filter(a => a.id !== deleteModal.arrest.id));
      setDeleteModal({ show: false, arrest: null });
      setDeletePassword('');
      setNotification({ type: 'success', message: 'Prisao removida com sucesso.' });
    } catch (error) {
      console.error('Erro ao remover prisão:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel remover a prisao.'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Preso': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Aguardando Audiência': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Liberado sob Fiança': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const toggleLegalInfo = (arrestId) => {
    setExpandedLegalId((current) => (current === arrestId ? null : arrestId));
  };

  return (
    <div className="space-y-6">
      <NotificationBanner
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-federal-500" size={28} />
            Registro de Prisões
          </h2>
          <p className="text-slate-400 mt-1">Consulta geral de todas as prisões e detenções registradas.</p>
        </div>
        {canManage && (
          <button 
            onClick={() => navigate('/dashboard/arrest')}
            className="px-4 py-2 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-lg shadow-lg shadow-federal-900/20 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Nova Prisão
          </button>
        )}
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
          <table className="w-full text-left border-collapse min-w-[800px]">
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
              {loading && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Carregando prisoes...
                  </td>
                </tr>
              )}
              {!loading && paginatedArrests.map((arrest) => (
                <>
                  <tr key={arrest.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 flex-shrink-0">
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
                      <button
                        type="button"
                        onClick={() => toggleLegalInfo(arrest.id)}
                        className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">Motivo / Artigos</div>
                            <div className="text-sm text-white font-medium mt-1">Clique para visualizar</div>
                          </div>
                          {expandedLegalId === arrest.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </div>
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Calendar size={14} className="text-slate-500" />
                        {arrest.date && !isNaN(new Date(arrest.date).getTime()) 
                          ? format(new Date(arrest.date), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Data desconhecida'}
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
                          onClick={() => navigate(`/dashboard/arrests/${arrest.id}`)}
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
                        {canManage && (
                          <button 
                            onClick={() => setDeleteModal({ show: true, arrest })}
                            className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedLegalId === arrest.id && (
                    <tr key={`${arrest.id}-details`} className="bg-slate-950/70">
                      <td colSpan="6" className="px-4 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <span className="text-xs text-slate-500 uppercase font-bold block mb-2">Motivo da Prisão</span>
                            <p className="text-slate-200 text-sm whitespace-pre-line">{arrest.reason || 'Não informado.'}</p>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <span className="text-xs text-slate-500 uppercase font-bold block mb-2">Artigos Aplicados</span>
                            <p className="text-federal-400 text-sm font-medium whitespace-pre-line">{arrest.articles || 'Não informado.'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {!loading && paginatedArrests.length === 0 && (
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

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.arrest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Trash2 className="text-red-500" />
                Remover Prisão
              </h3>
              <button onClick={() => {setDeleteModal({ show: false, arrest: null }); setDeletePassword('');}} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="text-slate-400 hover:text-white" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-300">
                Tem certeza que deseja remover o registro de prisão de <span className="font-bold text-white">{deleteModal.arrest.name}</span>?
              </p>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-2">
                  <Lock size={14} />
                  Senha de Confirmação
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Digite a senha..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-red-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleDeleteArrest()}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {setDeleteModal({ show: false, arrest: null }); setDeletePassword('');}}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteArrest}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg transition-colors"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArrestList;
