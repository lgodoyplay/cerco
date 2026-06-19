import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../hooks/useSettings';
import { generateProfessionalPDF } from '../../../utils/pdfGeneratorPro';
import AddProofModal from '../../../components/investigations/AddProofModal';
import EditProofModal from '../../../components/investigations/EditProofModal';
import ProofCard from '../../../components/investigations/ProofCard';
import { 
  ArrowLeft, 
  Plus, 
  Lock, 
  Download, 
  Clock, 
  Shield, 
  User, 
  Users, 
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  Edit3,
  Trash2,
  Building2
} from 'lucide-react';
import clsx from 'clsx';
import { usePermissions } from '../../../hooks/usePermissions';

const InvestigationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Add useLocation
  const { user } = useAuth();
  const { templates } = useSettings();
  const { getInvestigation, addProof, closeInvestigation, deleteProof, editProof, deleteInvestigation } = useInvestigations();
  const { can } = usePermissions();
  
  const [investigation, setInvestigation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [proofToEdit, setProofToEdit] = useState(null);
  const [notification, setNotification] = useState(location.state?.notification || null);
  const [loading, setLoading] = useState(true);

  // Determine back link based on URL path or investigation category
  const isRevenueRoute = location.pathname.includes('/revenue/');
  const backLink = isRevenueRoute ? '/dashboard/revenue' : '/dashboard/investigations';
  
  // Load data
  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await getInvestigation(id);
        if (!data) {
          navigate(backLink);
          return;
        }
        setInvestigation(data);
      } catch (_error) {
        setNotification({
          type: 'error',
          message: 'Nao foi possivel carregar a investigacao.'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, getInvestigation, navigate, isModalOpen, isEditModalOpen, isRevenueRoute, backLink]);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto pb-20 flex justify-center items-center min-h-[420px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500" />
      </div>
    );
  }

  if (!investigation) return null;

  const isClosed = investigation.status === 'Encerrada' || investigation.status === 'Finalizada';

  const handleAddProof = async (proofData) => {
    try {
      await addProof(id, proofData);
      const data = await getInvestigation(id);
      setInvestigation(data);
      setNotification({
        type: 'success',
        message: 'Prova adicionada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao adicionar prova:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel adicionar a prova.'
      });
    }
  };

  const handleFinalize = async () => {
    if (window.confirm('Tem certeza que deseja finalizar esta investigação? Esta ação não pode ser desfeita.')) {
      setIsGeneratingPdf(true);
      try {
        await closeInvestigation(id);
        const updatedInv = await getInvestigation(id);
        setInvestigation(updatedInv);
        await generateProfessionalPDF(
          updatedInv,
          user,
          templates?.investigation,
          'investigation',
          templates?.__layoutConfig?.investigation
        );
        setNotification({
          type: 'success',
          message: 'Investigação finalizada e relatório gerado com sucesso.'
        });
      } catch (error) {
        console.error('Erro ao finalizar investigação:', error);
        setNotification({
          type: 'error',
          message: error?.message || 'Nao foi possivel finalizar a investigacao.'
        });
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateProfessionalPDF(
        investigation,
        user,
        templates?.investigation,
        'investigation',
        templates?.__layoutConfig?.investigation
      );
      setNotification({
        type: 'success',
        message: 'Relatorio gerado com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao gerar relatorio:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel gerar o relatorio.'
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDeleteProof = async (proofId) => {
    try {
      await deleteProof(proofId, id);
      // Refresh investigation data
      const data = await getInvestigation(id);
      if (data) setInvestigation(data);
      // Fechar o modal se a prova deletada estiver aberta
      if (selectedProof && selectedProof.id === proofId) {
        setSelectedProof(null);
      }
      setNotification({
        type: 'success',
        message: 'Prova removida com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao deletar prova:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel remover a prova.'
      });
    }
  };

  const handleEditProof = async (proofId, proofData) => {
    try {
      await editProof(proofId, proofData);
      // Refresh investigation data
      const data = await getInvestigation(id);
      if (data) setInvestigation(data);
      setNotification({
        type: 'success',
        message: 'Prova atualizada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao editar prova:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel atualizar a prova.'
      });
    }
  };

  const handleEditInvestigation = () => {
    navigate(isRevenueRoute ? `/dashboard/revenue/investigations/${id}/edit` : `/dashboard/investigations/${id}/edit`);
  };

  const handleDeleteInvestigation = async () => {
    if (window.confirm('Tem certeza que deseja deletar esta investigação? Esta ação não pode ser desfeita.')) {
      try {
        await deleteInvestigation(id);
        navigate(backLink, {
          state: {
            notification: {
              type: 'success',
              message: 'Investigacao deletada com sucesso.'
            }
          }
        });
      } catch (error) {
        console.error('Erro ao deletar investigação:', error);
        setNotification({
          type: 'error',
          message: error?.message || 'Nao foi possivel deletar a investigacao.'
        });
      }
    }
  };

  const canManage = can('investigations_manage');

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {notification && (
        <div
          className={clsx(
            "mb-6 rounded-2xl border px-4 py-3 flex items-start gap-3 shadow-lg",
            notification.type === 'success'
              ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-100"
              : "bg-red-950/70 border-red-500/30 text-red-100"
          )}
        >
          {notification.type === 'success' ? <CheckCircle size={20} className="mt-0.5 shrink-0" /> : <AlertCircle size={20} className="mt-0.5 shrink-0" />}
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
      
      {/* Top Nav */}
      <button 
        onClick={() => navigate(backLink)}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar para {isRevenueRoute ? 'Receita' : 'Lista'}
      </button>

      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-federal-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={clsx(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1",
                isClosed 
                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}>
                {isClosed ? <Lock size={12} /> : <Clock size={12} />}
                {investigation.status}
              </span>
              <span className="text-slate-500 text-xs font-mono">ID: {investigation.id}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{investigation.title}</h1>
            <p className="text-slate-400 max-w-2xl">{investigation.description}</p>
          </div>

          <div className="flex gap-3">
            {canManage && (
              <>
                <button
                  onClick={handleEditInvestigation}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                  <Edit3 size={20} />
                  Editar
                </button>
                <button
                  onClick={handleDeleteInvestigation}
                  className="bg-red-800 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                  <Trash2 size={20} />
                  Deletar
                </button>
              </>
            )}
            {isClosed ? (
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className={clsx(
                  "text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all",
                  isGeneratingPdf ? "bg-slate-700 cursor-not-allowed" : "bg-slate-800 hover:bg-slate-700"
                )}
              >
                <Download size={20} />
                {isGeneratingPdf ? 'Gerando...' : 'Baixar Relatório PDF'}
              </button>
            ) : (
              <button
                onClick={handleFinalize}
                disabled={isGeneratingPdf}
                className={clsx(
                  "text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all",
                  isGeneratingPdf
                    ? "bg-slate-700 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 shadow-red-900/50 hover:-translate-y-0.5"
                )}
              >
                <CheckCircle size={20} />
                {isGeneratingPdf ? 'Finalizando...' : 'Finalizar Investigação'}
              </button>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-6 border-t border-slate-800 relative z-10">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prioridade</label>
            <div className="text-white font-medium flex items-center gap-2">
              <span className={clsx("w-2 h-2 rounded-full", {
                'bg-red-500': investigation.priority === 'Alta',
                'bg-yellow-500': investigation.priority === 'Média',
                'bg-emerald-500': investigation.priority === 'Baixa',
              })} />
              {investigation.priority}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Investigado</label>
            <div className="text-white font-medium flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <span className="truncate">{investigation.nomeInvestigado || investigation.involved || 'Não informado'}</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CPF / Documento</label>
            <div className="text-white font-medium flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <span className="truncate">{investigation.cpfInvestigado || 'Não informado'}</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Delegacia</label>
            <div className="text-white font-medium flex items-center gap-2">
              <Building2 size={16} className="text-slate-400" />
              <span className="truncate">{investigation.delegaciaResponsavel || 'Não informada'}</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Data de Abertura</label>
            <div className="text-white font-medium flex items-center gap-2">
              <CalendarIcon date={investigation.createdAt} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Delegado</label>
            <div className="text-white font-medium flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <span className="truncate">{investigation.nomeDelegado || 'Não informado'}</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Provas Coletadas</label>
            <div className="text-white font-medium flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              {investigation.proofs?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Proofs Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-federal-500" size={24} />
            Evidências e Provas
          </h3>
          
          {!isClosed && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-federal-600 hover:bg-federal-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow transition-all hover:scale-105"
            >
              <Plus size={18} />
              Adicionar Prova
            </button>
          )}
        </div>

        {/* Proofs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investigation.proofs && investigation.proofs.length > 0 ? (
            investigation.proofs.map((proof) => (
              <ProofCard 
                key={proof.id} 
                proof={proof} 
                onClick={setSelectedProof} 
                onDelete={handleDeleteProof}
                onEdit={(proof) => {
                  setProofToEdit(proof);
                  setIsEditModalOpen(true);
                }}
                canEdit={!isClosed}
              />
            ))
          ) : (
            <div className="col-span-full py-12 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Nenhuma prova adicionada ainda.</p>
              {!isClosed && <p className="text-sm mt-1">Clique em "Adicionar Prova" para começar.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddProofModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddProof} 
      />

      <EditProofModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setProofToEdit(null);
        }} 
        onSave={handleEditProof}
        proof={proofToEdit}
      />

      {/* Proof Viewer Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedProof(null)}>
          <div className="bg-slate-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedProof.title}</h3>
                <p className="text-sm text-slate-400">{selectedProof.description}</p>
              </div>
              <button 
                onClick={() => setSelectedProof(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {selectedProof.type === 'image' && (
                <img 
                  src={selectedProof.content} 
                  alt={selectedProof.title}
                  className="w-full h-auto rounded-lg"
                />
              )}
              
              {selectedProof.type === 'video' && (() => {
                // Try to extract YouTube video ID
                const youtubeMatch = selectedProof.content.match(
                  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
                );
                
                if (youtubeMatch) {
                  const youtubeId = youtubeMatch[1];
                  return (
                    <div className="aspect-video w-full rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedProof.title}
                      />
                    </div>
                  );
                }
                
                // Fallback for non-YouTube videos
                return (
                  <div className="space-y-4">
                    <video 
                      src={selectedProof.content} 
                      controls
                      className="w-full rounded-lg"
                    />
                    <a 
                      href={selectedProof.content} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 text-sm hover:underline break-all flex items-center gap-2"
                    >
                      <ExternalLink size={16} />
                      Abrir vídeo externo
                    </a>
                  </div>
                );
              })()}
              
              {selectedProof.type === 'link' && (
                <div className="flex flex-col items-center gap-4 p-8">
                  <ExternalLink size={48} className="text-blue-400" />
                  <a 
                    href={selectedProof.content} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 text-lg hover:underline break-all"
                  >
                    {selectedProof.content}
                  </a>
                  <button 
                    onClick={() => window.open(selectedProof.content, '_blank')}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    Abrir Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const CalendarIcon = ({ date }) => (
  <>
    <Clock size={16} className="text-slate-400" />
    {new Date(date).toLocaleDateString('pt-BR')}
  </>
);

export default InvestigationDetail;
