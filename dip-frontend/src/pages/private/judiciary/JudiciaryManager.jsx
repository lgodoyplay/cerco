import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../hooks/useSettings';
import { useAuth } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { 
  Gavel, CheckCircle, XCircle, Clock, AlertTriangle, 
  FileText, Search, Filter, MoreVertical, Archive, 
  RefreshCw, Send, Upload, Shield, Printer, MapPin, 
  User, Calendar, Lock, Siren, Eye, Scale, FileSignature, Briefcase
} from 'lucide-react';
import clsx from 'clsx';

// --- Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    // Warrants
    active: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
    executed: 'bg-green-500/10 text-green-500 border-green-500/20',
    revoked: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    
    // Generic/Process
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    concluded: 'bg-green-500/10 text-green-500 border-green-500/20',
  };

  const labels = {
    // Warrants
    active: 'MANDADO ATIVO',
    executed: 'CUMPRIDO',
    revoked: 'REVOGADO',

    // Generic
    pending: 'PENDENTE',
    scheduled: 'AGENDADO',
    concluded: 'CONCLUÍDO'
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || status.toUpperCase()}
    </span>
  );
};

const WarrantDocument = ({ warrant, onClose, onUpdateStatus }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0">
      <div className="bg-white text-black w-full max-w-3xl min-h-[80vh] shadow-2xl rounded-sm p-12 relative print:shadow-none print:w-full print:h-full print:absolute print:top-0 print:left-0">
        
        {/* Print/Close Controls - Hidden on Print */}
        <div className="absolute top-4 right-4 flex gap-2 print:hidden">
          <button 
            onClick={handlePrint}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors"
            title="Imprimir Mandado"
          >
            <Printer size={20} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-red-100 rounded-full text-slate-700 hover:text-red-600 transition-colors"
            title="Fechar"
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
            <Gavel size={600} />
        </div>

        {/* Header */}
        <div className="text-center mb-12 border-b-2 border-black pb-6">
          <div className="flex justify-center mb-4">
             <div className="w-24 h-24 border-4 border-black rounded-full flex items-center justify-center">
                <Shield size={48} />
             </div>
          </div>
          <h1 className="text-3xl font-serif font-black uppercase tracking-widest mb-2">Poder Judiciário</h1>
          <h2 className="text-xl font-serif font-bold uppercase">Tribunal de Justiça Federal</h2>
          <p className="font-serif text-sm mt-2">Vara Criminal e de Execuções Penais</p>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-black uppercase underline decoration-double underline-offset-4">
            MANDADO DE {warrant.type === 'search_seizure' ? 'BUSCA E APREENSÃO' : warrant.type === 'arrest' ? 'PRISÃO' : warrant.type === 'preventive_arrest' ? 'PRISÃO PREVENTIVA' : warrant.type === 'temporary_arrest' ? 'PRISÃO TEMPORÁRIA' : 'QUEBRA DE SIGILO'}
          </h1>
          <p className="mt-4 font-mono text-sm text-slate-600">PROCESSO Nº: {warrant.id.split('-')[0].toUpperCase()}/{new Date().getFullYear()}</p>
        </div>

        {/* Content */}
        <div className="space-y-8 font-serif text-lg leading-relaxed text-justify">
          <p>
            <span className="font-bold">O EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO</span>, 
            no uso de suas atribuições legais e na forma da lei,
          </p>

          <p>
            <span className="font-bold uppercase">MANDA</span> a qualquer autoridade policial e seus agentes a quem este for apresentado, que em cumprimento ao presente mandado:
          </p>

          <div className="bg-slate-50 p-6 border border-slate-200 rounded-sm">
            {warrant.type === 'search_seizure' && (
              <p>
                Procedam à <span className="font-bold">BUSCA E APREENSÃO</span> domiciliar/veicular no endereço/propriedade abaixo qualificado, 
                visando a coleta de provas, objetos ilícitos ou instrumentos de crime.
              </p>
            )}
            {(warrant.type === 'arrest' || warrant.type === 'preventive_arrest' || warrant.type === 'temporary_arrest') && (
              <p>
                Procedam à <span className="font-bold">PRISÃO E RECOLHIMENTO</span> da pessoa abaixo qualificada, 
                conduzindo-a imediatamente à autoridade policial competente ou estabelecimento prisional.
              </p>
            )}
             {warrant.type === 'breach' && (
              <p>
                Procedam à <span className="font-bold">QUEBRA DE SIGILO</span> (bancário, telefônico ou telemático) da pessoa/entidade abaixo qualificada, 
                disponibilizando os dados requisitados à autoridade investigativa.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 my-8">
            <div className="border-l-4 border-black pl-4">
              <h3 className="text-sm font-bold uppercase text-slate-500 mb-1">Alvo do Mandado</h3>
              <p className="text-xl font-bold uppercase">{warrant.target_name}</p>
              {warrant.target_id && <p className="font-mono">ID/Passaporte: {warrant.target_id}</p>}
            </div>
            {warrant.address && (
              <div className="border-l-4 border-black pl-4">
                <h3 className="text-sm font-bold uppercase text-slate-500 mb-1">Endereço/Local</h3>
                <p className="text-lg font-bold uppercase">{warrant.address}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-slate-500 mb-2">Motivação / Determinação Judicial</h3>
            <p className="text-base italic">{warrant.reason}</p>
            {warrant.detailed_description && <p className="mt-2 text-base">{warrant.detailed_description}</p>}
            
            {warrant.attachment_url && (
              <div className="mt-4 print:hidden">
                <a 
                  href={warrant.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 rounded text-sm text-blue-700 hover:bg-slate-200 transition-colors"
                >
                  <FileText size={16} />
                  Ver Anexo (PDF/Imagem)
                </a>
              </div>
            )}
          </div>
          
          <div className="flex justify-between text-sm mt-8 border-t border-dashed border-slate-300 pt-4">
            <p><span className="font-bold">Prioridade:</span> {warrant.priority?.toUpperCase()}</p>
            <p><span className="font-bold">Expedido em:</span> {new Date(warrant.created_at).toLocaleDateString()} às {new Date(warrant.created_at).toLocaleTimeString()}</p>
            <p><span className="font-bold">Válido até:</span> {warrant.expires_at ? new Date(warrant.expires_at).toLocaleDateString() : 'Indeterminado'}</p>
          </div>

          <p className="mt-8">
            CUMPRA-SE na forma e sob as penas da Lei.
          </p>
        </div>

        {/* Signature */}
        <div className="mt-24 flex flex-col items-center justify-center text-center">
            <div className="w-64 border-b border-black mb-2"></div>
            <p className="font-bold text-lg uppercase">{warrant.judge_name || 'Juiz Federal'}</p>
            <p className="text-sm uppercase">Juiz de Direito - Vara Criminal</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 border border-slate-200 px-3 py-1 rounded-full bg-slate-50">
                <Lock size={10} /> Assinado Digitalmente • ID: {warrant.id.split('-')[0]}
            </div>
        </div>

        {/* Action Footer (Only visible on screen) */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-center gap-4 print:hidden">
            {warrant.status === 'active' && (
                <>
                    <button 
                        onClick={() => onUpdateStatus(warrant.id, 'revoked')}
                        className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                        <XCircle size={20} /> REVOGAR MANDADO
                    </button>
                    <button 
                        onClick={() => onUpdateStatus(warrant.id, 'executed')}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2"
                    >
                        <CheckCircle size={20} /> MARCAR COMO CUMPRIDO
                    </button>
                </>
            )}
             {warrant.status === 'revoked' && (
                <div className="px-6 py-3 bg-red-50 text-red-500 rounded-lg font-bold border border-red-200 flex items-center gap-2">
                    <XCircle size={20} /> MANDADO REVOGADO
                </div>
             )}
             {warrant.status === 'executed' && (
                <div className="px-6 py-3 bg-green-50 text-green-600 rounded-lg font-bold border border-green-200 flex items-center gap-2">
                    <CheckCircle size={20} /> MANDADO CUMPRIDO
                </div>
             )}
        </div>

      </div>
    </div>
  );
};

// --- Main Component ---

const JudiciaryManager = () => {
  const { discordConfig } = useSettings();
  const { user } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  
  const canManage = can('judiciary_manage');
  const canView = can('judiciary_view');

  // Protect route
  if (!canView && !canManage) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <Shield size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
        <p>Você não tem permissão para acessar o sistema judiciário.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
        >
          Voltar para Dashboard
        </button>
      </div>
    );
  }
  
  // States
  const [activeTab, setActiveTab] = useState('warrants'); // warrants, hearings, releases, petitions
  const [warrants, setWarrants] = useState([]);
  const [petitions, setPetitions] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Warrant Logic States
  const [isWarrantModalOpen, setIsWarrantModalOpen] = useState(false);
  const [viewingWarrant, setViewingWarrant] = useState(null);
  const [viewingPetition, setViewingPetition] = useState(null);
  const [warrantFilter, setWarrantFilter] = useState('all');

  // Hearing Logic States
  const [isHearingModalOpen, setIsHearingModalOpen] = useState(false);
  const [hearingForm, setHearingForm] = useState({
    case_number: '',
    date_time: '',
    target_name: '', // Used as 'participant' or title
    type: 'instruction',
    location: 'Sala 1',
    notes: ''
  });

  // Release Logic States
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseForm, setReleaseForm] = useState({
    prisoner_name: '',
    prisoner_passport: '',
    case_number: '',
    details: ''
  });
  const [warrantFile, setWarrantFile] = useState(null);
  const [warrantForm, setWarrantForm] = useState({
    type: 'search_seizure',
    target_name: '',
    target_id: '',
    reason: '',
    detailed_description: '',
    address: '',
    priority: 'normal',
    expires_at: ''
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'warrants') {
        const { data, error } = await supabase
          .from('warrants')
          .select('*')
          .order('created_at', { ascending: false });
        if (error && error.code !== '42P01') throw error; // Ignore table not exists initially
        setWarrants(data || []);
      } else if (activeTab === 'petitions') {
        const { data, error } = await supabase
          .from('petitions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error && error.code !== '42P01') throw error;
        setPetitions(data || []);
      } else if (activeTab === 'hearings') {
        const { data, error } = await supabase
          .from('hearings')
          .select('*')
          .order('date_time', { ascending: true });

        if (error && error.code !== '42P01') throw error;
        setHearings(data || []);
      } else if (activeTab === 'releases') {
        const { data, error } = await supabase
          .from('release_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error && error.code !== '42P01') throw error;
        setReleases(data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePetitionStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('petitions').update({ status }).eq('id', id);
      if (error) throw error;
      setPetitions(petitions.map(p => p.id === id ? { ...p, status } : p));
      if (viewingPetition?.id === id) {
        setViewingPetition({ ...viewingPetition, status });
      }
    } catch (err) {
      console.error('Error updating petition:', err);
      alert('Erro ao atualizar status da petição.');
    }
  };

  const handleCreateHearing = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('hearings').insert([{
        ...hearingForm,
        judge_name: user.full_name || 'Juiz Federal',
        status: 'scheduled'
      }]);

      if (error) throw error;

      setIsHearingModalOpen(false);
      fetchData();
      setHearingForm({ case_number: '', date_time: '', target_name: '', type: 'instruction', location: 'Sala 1', notes: '' });
    } catch (err) {
      console.error('Error creating hearing:', err);
      alert('Erro ao agendar audiência.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRelease = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('release_orders').insert([{
        ...releaseForm,
        judge_name: user.full_name || 'Juiz Federal',
        status: 'approved'
      }]);

      if (error) throw error;

      setIsReleaseModalOpen(false);
      fetchData();
      setReleaseForm({ prisoner_name: '', prisoner_passport: '', case_number: '', details: '' });
    } catch (err) {
      console.error('Error issuing release:', err);
      alert('Erro ao emitir alvará.');
    } finally {
      setLoading(false);
    }
  };

  const sendWebhookNotification = async (data, status) => {
    const webhookUrl = discordConfig?.wantedWebhook; // Use wanted webhook for warrants
    if (!webhookUrl) return;

    try {
      const colors = {
        active: 0xdc2626, // Red (Warrant Issued)
        revoked: 0x94a3b8, // Slate
        executed: 0x22c55e // Green
      };

      const titles = {
        active: "⚖️ NOVO MANDADO EXPEDIDO",
        revoked: "⚖️ Mandado Revogado",
        executed: "⚖️ Mandado Cumprido"
      };

      const typeLabels = {
        search_seizure: 'Busca e Apreensão',
        arrest: 'Prisão',
        preventive_arrest: 'Prisão Preventiva',
        temporary_arrest: 'Prisão Temporária',
        breach: 'Quebra de Sigilo'
      };

      const fields = [
        { name: "ALVO", value: data.target_name, inline: true },
        { name: "TIPO", value: typeLabels[data.type] || data.type, inline: true },
        { name: "JUIZ EMISSOR", value: data.judge_name || 'Juiz Federal', inline: true },
        { name: "PRIORIDADE", value: data.priority.toUpperCase(), inline: true },
        { name: "ENDEREÇO", value: data.address || 'Não informado', inline: false },
        { name: "MOTIVAÇÃO", value: data.reason }
      ];

      const embed = {
        title: titles[status] || "Atualização Jurídica",
        color: colors[status] || 0x000000,
        fields: fields,
        footer: { text: "Sistema Judiciário - Polícia Federal" },
        timestamp: new Date().toISOString()
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    } catch (err) {
      console.error("Erro ao enviar webhook:", err);
    }
  };

  // --- Warrant Logic ---

  const handleCreateWarrant = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let attachmentUrl = null;

      // Handle File Upload
      if (warrantFile) {
        const fileExt = warrantFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('warrants')
            .upload(filePath, warrantFile);

        if (uploadError) throw new Error('Erro ao fazer upload do arquivo.');

        const { data: { publicUrl } } = supabase.storage
            .from('warrants')
            .getPublicUrl(filePath);

        attachmentUrl = publicUrl;
      }

      const newWarrant = {
        ...warrantForm,
        judge_id: user.id,
        judge_name: user.name || 'Juiz Federal',
        status: 'active',
        attachment_url: attachmentUrl
      };

      const { data, error } = await supabase.from('warrants').insert([newWarrant]).select();
      if (error) throw error;

      setIsWarrantModalOpen(false);
      fetchData();
      setWarrantForm({
        type: 'search_seizure',
        target_name: '',
        target_id: '',
        reason: '',
        detailed_description: '',
        address: '',
        priority: 'normal',
        expires_at: ''
      });
      setWarrantFile(null);
      
      // Notify
      if (data && data[0]) {
        sendWebhookNotification(data[0], 'active');
      }
    } catch (err) {
      console.error("Erro ao criar mandado:", err);
      alert("Erro ao criar mandado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateWarrantStatus = async (id, newStatus) => {
    try {
        const { error } = await supabase.from('warrants').update({ 
            status: newStatus,
            executed_at: newStatus === 'executed' ? new Date() : null,
            executed_by: newStatus === 'executed' ? user.name : null
        }).eq('id', id);
        
        if (error) throw error;
        
        // Update local state to reflect change immediately in view
        if (viewingWarrant && viewingWarrant.id === id) {
            setViewingWarrant(prev => ({ ...prev, status: newStatus }));
        }
        
        fetchData();
        
        // Notify
        const warrant = warrants.find(w => w.id === id);
        if (warrant) {
             sendWebhookNotification({ ...warrant, status: newStatus }, newStatus);
        }

    } catch (err) {
      console.error("Erro ao atualizar mandado:", err);
      alert("Erro ao atualizar mandado.");
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
      
      {/* Warrant Document Viewer Modal */}
      {viewingWarrant && (
        <WarrantDocument 
            warrant={viewingWarrant} 
            onClose={() => setViewingWarrant(null)} 
            onUpdateStatus={canManage ? updateWarrantStatus : null}
        />
      )}

      {/* Create Warrant Modal */}
      {isWarrantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={() => setIsWarrantModalOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                    <XCircle size={20} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Gavel className="text-red-500" />
                    Novo Mandado Judicial
                </h2>

                <form onSubmit={handleCreateWarrant} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Tipo de Mandado</label>
                            <select 
                                value={warrantForm.type}
                                onChange={e => setWarrantForm({...warrantForm, type: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            >
                                <option value="search_seizure">Busca e Apreensão</option>
                                <option value="arrest">Prisão</option>
                                <option value="preventive_arrest">Prisão Preventiva</option>
                                <option value="temporary_arrest">Prisão Temporária</option>
                                <option value="breach_confidentiality">Quebra de Sigilo</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Prioridade</label>
                            <select 
                                value={warrantForm.priority}
                                onChange={e => setWarrantForm({...warrantForm, priority: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            >
                                <option value="low">Baixa</option>
                                <option value="normal">Normal</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome do Alvo</label>
                            <input 
                                type="text"
                                value={warrantForm.target_name}
                                onChange={e => setWarrantForm({...warrantForm, target_name: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                                required
                                placeholder="Nome completo do suspeito"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">ID / Passaporte</label>
                            <input 
                                type="text"
                                value={warrantForm.target_id}
                                onChange={e => setWarrantForm({...warrantForm, target_id: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Endereço / Local (Se aplicável)</label>
                        <input 
                            type="text"
                            value={warrantForm.address}
                            onChange={e => setWarrantForm({...warrantForm, address: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            placeholder="Endereço da busca ou local provável"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Motivo do Mandado</label>
                        <input 
                            type="text"
                            value={warrantForm.reason}
                            onChange={e => setWarrantForm({...warrantForm, reason: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            required
                            placeholder="Resumo da motivação legal"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Descrição Detalhada / Determinações</label>
                        <textarea 
                            value={warrantForm.detailed_description}
                            onChange={e => setWarrantForm({...warrantForm, detailed_description: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none h-32 resize-none"
                            placeholder="Descreva detalhadamente o que deve ser apreendido ou as condições da prisão..."
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Data de Validade (Opcional)</label>
                        <input 
                            type="date"
                            value={warrantForm.expires_at}
                            onChange={e => setWarrantForm({...warrantForm, expires_at: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                        />
                    </div>

                     {/* File Upload */}
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Anexar Arquivo (PDF/Imagem)</label>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors">
                                <Upload size={16} />
                                {warrantFile ? 'Arquivo Selecionado' : 'Escolher Arquivo'}
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => setWarrantFile(e.target.files[0])}
                                    accept=".pdf,.png,.jpg,.jpeg"
                                />
                            </label>
                            {warrantFile && (
                                <span className="text-xs text-slate-400">{warrantFile.name}</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsWarrantModalOpen(false)}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-900/20 transition-all flex items-center gap-2"
                        >
                            {loading ? 'Processando...' : <><Gavel size={18} /> Expedir Mandado</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Hearing Modal */}
      {isHearingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={() => setIsHearingModalOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                    <XCircle size={20} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Calendar className="text-federal-500" />
                    Agendar Audiência
                </h2>

                <form onSubmit={handleCreateHearing} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Número do Processo</label>
                        <input 
                            type="text"
                            value={hearingForm.case_number}
                            onChange={e => setHearingForm({...hearingForm, case_number: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            required
                            placeholder="Ex: 001/2024"
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Data e Hora</label>
                        <input 
                            type="datetime-local"
                            value={hearingForm.date_time}
                            onChange={e => setHearingForm({...hearingForm, date_time: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome do Réu / Parte</label>
                        <input 
                            type="text"
                            value={hearingForm.target_name}
                            onChange={e => setHearingForm({...hearingForm, target_name: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            required
                            placeholder="Nome completo"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Tipo de Audiência</label>
                            <select 
                                value={hearingForm.type}
                                onChange={e => setHearingForm({...hearingForm, type: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            >
                                <option value="custody">Custódia</option>
                                <option value="instruction">Instrução e Julgamento</option>
                                <option value="judgment">Leitura de Sentença</option>
                                <option value="other">Outros</option>
                            </select>
                        </div>
                         <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Local</label>
                            <input 
                                type="text"
                                value={hearingForm.location}
                                onChange={e => setHearingForm({...hearingForm, location: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Observações / Pauta</label>
                        <textarea 
                            value={hearingForm.notes}
                            onChange={e => setHearingForm({...hearingForm, notes: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none h-32 resize-none"
                            placeholder="Detalhes sobre o caso..."
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsHearingModalOpen(false)}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-lg shadow-lg shadow-federal-900/20 transition-all flex items-center gap-2"
                        >
                            {loading ? 'Agendando...' : <><Calendar size={18} /> Agendar</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Release Modal */}
      {isReleaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button 
                    onClick={() => setIsReleaseModalOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                    <XCircle size={20} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <FileSignature className="text-green-500" />
                    Emitir Alvará de Soltura
                </h2>

                <form onSubmit={handleCreateRelease} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Número do Processo</label>
                        <input 
                            type="text"
                            value={releaseForm.case_number}
                            onChange={e => setReleaseForm({...releaseForm, case_number: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            required
                            placeholder="Ex: 001/2024"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome do Beneficiário (Preso)</label>
                        <input 
                            type="text"
                            value={releaseForm.prisoner_name}
                            onChange={e => setReleaseForm({...releaseForm, prisoner_name: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            required
                            placeholder="Nome completo"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">ID / Passaporte</label>
                        <input 
                            type="text"
                            value={releaseForm.prisoner_passport}
                            onChange={e => setReleaseForm({...releaseForm, prisoner_passport: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            placeholder="Opcional"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Motivo / Detalhes</label>
                        <textarea 
                            value={releaseForm.details}
                            onChange={e => setReleaseForm({...releaseForm, details: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none h-32 resize-none"
                            required
                            placeholder="Ex: Liberdade Provisória, Absolvição..."
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsReleaseModalOpen(false)}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/20 transition-all flex items-center gap-2"
                        >
                            {loading ? 'Emitindo...' : <><FileSignature size={18} /> Emitir Alvará</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Sidebar List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('warrants')}
            className={clsx(
                "flex-1 py-2 px-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                activeTab === 'warrants' ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            Mandados
          </button>
          <button
            onClick={() => setActiveTab('hearings')}
            className={clsx(
                "flex-1 py-2 px-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                activeTab === 'hearings' ? "bg-federal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            Audiências
          </button>
          <button
            onClick={() => setActiveTab('releases')}
            className={clsx(
                "flex-1 py-2 px-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                activeTab === 'releases' ? "bg-federal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            Alvarás
          </button>
          <button
            onClick={() => setActiveTab('petitions')}
            className={clsx(
                "flex-1 py-2 px-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap",
                activeTab === 'petitions' ? "bg-yellow-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            Petições
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
            {activeTab === 'warrants' && (
                <>
                    {canManage && (
                        <button 
                            onClick={() => setIsWarrantModalOpen(true)}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed rounded-xl text-slate-300 hover:text-white font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            <Gavel size={18} /> Novo Mandado Judicial
                        </button>
                    )}
                    
                    {/* Filters */}
                    <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg">
                        <button onClick={() => setWarrantFilter('all')} className={clsx("flex-1 py-1 text-[10px] font-bold rounded uppercase transition-colors", warrantFilter === 'all' ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}>Todos</button>
                        <button onClick={() => setWarrantFilter('active')} className={clsx("flex-1 py-1 text-[10px] font-bold rounded uppercase transition-colors", warrantFilter === 'active' ? "bg-red-500/20 text-red-500" : "text-slate-500 hover:text-slate-300")}>Ativos</button>
                        <button onClick={() => setWarrantFilter('executed')} className={clsx("flex-1 py-1 text-[10px] font-bold rounded uppercase transition-colors", warrantFilter === 'executed' ? "bg-green-500/20 text-green-500" : "text-slate-500 hover:text-slate-300")}>Cumpridos</button>
                    </div>
                </>
            )}

            {activeTab === 'hearings' && canManage && (
                <button 
                    onClick={() => setIsHearingModalOpen(true)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed rounded-xl text-slate-300 hover:text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                    <Calendar size={18} /> Agendar Audiência
                </button>
            )}

            {activeTab === 'releases' && canManage && (
                <button 
                    onClick={() => setIsReleaseModalOpen(true)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed rounded-xl text-slate-300 hover:text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                    <FileSignature size={18} /> Emitir Alvará
                </button>
            )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>
          ) : activeTab === 'warrants' ? (
            warrants.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">Nenhum mandado encontrado.</div>
            ) : (
                warrants
                .filter(w => {
                    if (warrantFilter === 'all') return true;
                    if (warrantFilter === 'active') return w.status === 'active';
                    if (warrantFilter === 'executed') return w.status === 'executed';
                    return true;
                })
                .map(warrant => (
                    <div 
                        key={warrant.id}
                        onClick={() => setViewingWarrant(warrant)}
                        className={clsx(
                            "bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800",
                            viewingWarrant?.id === warrant.id ? "border-red-500 ring-1 ring-red-500" : "border-slate-800 hover:border-red-500/30",
                            warrant.status === 'active' && "border-l-4 border-l-red-500"
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={clsx(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                                warrant.type === 'search_seizure' ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"
                            )}>
                                {warrant.type === 'search_seizure' ? 'Busca e Apreensão' : 'Prisão / Detenção'}
                            </span>
                            <span className={clsx("text-xs font-bold", warrant.status === 'active' ? "text-red-500" : "text-slate-500")}>
                                {warrant.status === 'active' ? 'ATIVO' : warrant.status.toUpperCase()}
                            </span>
                        </div>
                        <h3 className="font-bold text-white text-lg">{warrant.target_name}</h3>
                        <p className="text-xs text-slate-400 mb-2 truncate">{warrant.reason}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <Clock size={10} /> {new Date(warrant.created_at).toLocaleDateString()}
                            <span>•</span>
                            <User size={10} /> {warrant.judge_name}
                        </div>
                    </div>
                ))
            )
          ) : activeTab === 'petitions' ? (
            petitions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">Nenhuma petição encontrada.</div>
            ) : (
                petitions.map(petition => (
                    <div 
                        key={petition.id}
                        onClick={() => setViewingPetition(petition)}
                        className={clsx(
                            "p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]",
                            viewingPetition?.id === petition.id ? "bg-slate-800 border-yellow-500/50 shadow-lg" : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={clsx(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
                                petition.status === 'pending' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : 
                                petition.status === 'approved' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                                "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                                {petition.status === 'pending' ? 'PENDENTE' : petition.status === 'approved' ? 'DEFERIDO' : 'INDEFERIDO'}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock size={10} /> {new Date(petition.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="font-bold text-slate-200 text-sm mb-1">{petition.type}</h3>
                        <p className="text-xs text-slate-400 mb-2 line-clamp-2">{petition.content}</p>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 text-[10px] text-slate-500">
                            <div className="flex items-center gap-1">
                                <User size={10} /> {petition.client_name}
                            </div>
                            <div className="flex items-center gap-1">
                                <Briefcase size={10} /> {petition.lawyer_name || 'Advogado'}
                            </div>
                        </div>
                    </div>
                ))
            )
          ) : activeTab === 'hearings' ? (
            hearings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-4">
                    <Calendar size={48} className="opacity-20" />
                    <div className="text-center">
                        <p className="font-bold">Nenhuma audiência agendada</p>
                    </div>
                </div>
            ) : (
                hearings.map(hearing => (
                    <div 
                        key={hearing.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-federal-500/50 transition-colors relative overflow-hidden group cursor-default"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-federal-500"></div>
                        <div className="pl-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-federal-400 uppercase tracking-wider">
                                    {new Date(hearing.date_time).toLocaleString()}
                                </span>
                                <span className={clsx(
                                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                    hearing.status === 'scheduled' && "bg-blue-500/10 text-blue-400",
                                    hearing.status === 'concluded' && "bg-green-500/10 text-green-400",
                                    hearing.status === 'cancelled' && "bg-red-500/10 text-red-400"
                                )}>
                                    {hearing.status === 'scheduled' ? 'Agendada' : hearing.status === 'concluded' ? 'Realizada' : 'Cancelada'}
                                </span>
                            </div>
                            <h3 className="text-white font-bold text-sm mb-1">{hearing.target_name}</h3>
                            <p className="text-xs text-slate-400 mb-2">
                                <span className="text-slate-500">Tipo:</span> {hearing.type === 'custody' ? 'Custódia' : hearing.type === 'instruction' ? 'Instrução' : 'Outros'}
                            </p>
                        </div>
                    </div>
                ))
            )
          ) : (
            releases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-4">
                    <FileSignature size={48} className="opacity-20" />
                    <div className="text-center">
                        <p className="font-bold">Nenhum alvará emitido</p>
                    </div>
                </div>
            ) : (
                releases.map(release => (
                    <div 
                        key={release.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-green-500/50 transition-colors group cursor-default"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <FileSignature size={14} className="text-green-500" />
                                <span className="text-[10px] font-mono text-slate-500">
                                    {new Date(release.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                                Ativo
                            </span>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-1">{release.prisoner_name}</h3>
                        <p className="text-xs text-slate-400 mb-2">ID: {release.prisoner_id || 'N/A'}</p>
                        <p className="text-xs text-slate-500 italic">"{release.reason}"</p>
                    </div>
                ))
            )
          )}
        </div>
      </div>

      {/* Detail View Placeholder (Warrants use Modal, others are placeholders for now) */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto hidden md:block">
        {activeTab === 'petitions' && viewingPetition ? (
           <div className="h-full flex flex-col">
              <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
                  <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{viewingPetition.type}</h2>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1"><User size={14} /> {viewingPetition.client_name}</span>
                          <span className="flex items-center gap-1"><Briefcase size={14} /> {viewingPetition.lawyer_name || 'Advogado'}</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> {new Date(viewingPetition.created_at).toLocaleString()}</span>
                      </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                      viewingPetition.status === 'pending' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : 
                      viewingPetition.status === 'approved' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                      "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}>
                      {viewingPetition.status === 'pending' ? 'PENDENTE' : viewingPetition.status === 'approved' ? 'DEFERIDO' : 'INDEFERIDO'}
                  </div>
              </div>

              <div className="flex-1 bg-slate-950 rounded-xl p-6 border border-slate-800 font-serif text-lg leading-relaxed text-slate-300 overflow-y-auto mb-6 whitespace-pre-wrap">
                  {viewingPetition.content}
              </div>

              {viewingPetition.status === 'pending' && canManage && (
                  <div className="flex gap-4 pt-4 border-t border-slate-800">
                      <button 
                          onClick={() => updatePetitionStatus(viewingPetition.id, 'rejected')}
                          className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold transition-colors"
                      >
                          INDEFERIR
                      </button>
                      <button 
                          onClick={() => updatePetitionStatus(viewingPetition.id, 'approved')}
                          className="flex-1 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-xl font-bold transition-colors"
                      >
                          DEFERIR
                      </button>
                  </div>
              )}
           </div>
        ) : (
        <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                {activeTab === 'warrants' ? (
                    <Gavel size={48} className="opacity-50 text-red-500" />
                ) : activeTab === 'petitions' ? (
                    <FileSignature size={48} className="opacity-50 text-yellow-500" />
                ) : activeTab === 'hearings' ? (
                    <Calendar size={48} className="opacity-50 text-federal-500" />
                ) : (
                    <FileSignature size={48} className="opacity-50 text-green-500" />
                )}
            </div>
            
            {activeTab === 'warrants' ? (
                <>
                    <h2 className="text-2xl font-bold text-slate-300 mb-2">Gestão de Mandados</h2>
                    <p className="max-w-md text-center text-slate-500">
                        Selecione um mandado na lista para visualizar o documento oficial, imprimir ou atualizar o status.
                        <br/><br/>
                        {canManage && "Clique em Novo Mandado Judicial para expedir uma nova ordem."}
                    </p>
                </>
            ) : activeTab === 'petitions' ? (
                <>
                    <h2 className="text-2xl font-bold text-slate-300 mb-2">Gestão de Petições</h2>
                    <p className="max-w-md text-center text-slate-500">
                        Selecione uma petição na lista para analisar o conteúdo e emitir um parecer (Deferir/Indeferir).
                    </p>
                </>
            ) : activeTab === 'hearings' ? (
                <>
                    <h2 className="text-2xl font-bold text-slate-300 mb-2">Pauta de Audiências</h2>
                    <p className="max-w-md text-center text-slate-500">
                        Gerencie a pauta de audiências de custódia e instrução.
                        <br/>
                        Em breve: Integração com calendário e notificações.
                    </p>
                </>
            ) : (
                <>
                    <h2 className="text-2xl font-bold text-slate-300 mb-2">Alvarás de Soltura</h2>
                    <p className="max-w-md text-center text-slate-500">
                        Emissão e consulta de alvarás de soltura para o sistema prisional.
                        <br/>
                        Em breve: Assinatura digital e envio automático.
                    </p>
                </>
            )}
        </div>
        )}
      </div>
    </div>
  );
};

export default JudiciaryManager;
