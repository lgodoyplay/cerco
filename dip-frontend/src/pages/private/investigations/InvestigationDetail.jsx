import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../hooks/useSettings';
import { generateInvestigationPDF } from '../../../utils/pdfGenerator';
import AddProofModal from '../../../components/investigations/AddProofModal';
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
  CheckCircle
} from 'lucide-react';
import clsx from 'clsx';

const InvestigationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Add useLocation
  const { user } = useAuth();
  const { templates } = useSettings();
  const { getInvestigation, addProof, closeInvestigation } = useInvestigations();
  
  const [investigation, setInvestigation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Determine back link based on URL path or investigation category
  const isRevenueRoute = location.pathname.includes('/revenue/');
  
  // Load data
  useEffect(() => {
    const fetchDetail = async () => {
      const data = await getInvestigation(id);
      if (!data) {
        navigate(isRevenueRoute ? '/dashboard/revenue' : '/dashboard/investigations');
        return;
      }
      setInvestigation(data);
    };
    fetchDetail();
  }, [id, getInvestigation, navigate, isModalOpen, isRevenueRoute]); // Reload when modal closes (potentially adds proof)

  if (!investigation) return null;

  const isClosed = investigation.status === 'Encerrada' || investigation.status === 'Finalizada';

  const handleAddProof = async (proofData) => {
    await addProof(id, proofData);
    // Refresh
    const data = await getInvestigation(id);
    setInvestigation(data);
  };

  const handleFinalize = async () => {
    if (window.confirm('Tem certeza que deseja finalizar esta investigação? Esta ação não pode ser desfeita.')) {
      await closeInvestigation(id);
      const updatedInv = await getInvestigation(id);
      setInvestigation(updatedInv);
      
      // Generate PDF
      setIsGeneratingPdf(true);
      try {
        await generateInvestigationPDF(updatedInv, user);
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateInvestigationPDF(investigation, user);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      
      {/* Top Nav */}
      <button 
        onClick={() => navigate(isRevenueRoute ? '/dashboard/revenue' : '/dashboard/investigations')}
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
            {isClosed ? (
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <Download size={20} />
                {isGeneratingPdf ? 'Gerando...' : 'Baixar Relatório PDF'}
              </button>
            ) : (
              <button
                onClick={handleFinalize}
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-900/50 transition-all hover:-translate-y-0.5"
              >
                <CheckCircle size={20} />
                Finalizar Investigação
              </button>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-800 relative z-10">
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Envolvidos</label>
            <div className="text-white font-medium flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <span className="truncate">{investigation.involved || 'N/A'}</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Data de Abertura</label>
            <div className="text-white font-medium flex items-center gap-2">
              <CalendarIcon date={investigation.createdAt} />
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
              <ProofCard key={proof.id} proof={proof} />
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
