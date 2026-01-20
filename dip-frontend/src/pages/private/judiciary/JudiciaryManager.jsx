import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../hooks/useSettings';
import { useAuth } from '../../../context/AuthContext';
import { 
  Gavel, CheckCircle, XCircle, Clock, AlertTriangle, 
  FileText, Search, Filter, MoreVertical, Archive, 
  RefreshCw, Send, Upload, Shield, Printer, MapPin, 
  User, Calendar, Lock, Siren, Eye
} from 'lucide-react';
import clsx from 'clsx';

// --- Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    // Licenses
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    judiciary_approved: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    approved: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    revoked: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    expired: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    
    // Warrants
    active: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
    executed: 'bg-green-500/10 text-green-500 border-green-500/20',
  };

  const labels = {
    // Licenses
    pending: 'Aguardando Jurídico',
    judiciary_approved: 'Deferido pelo Juiz',
    processing: 'Em Análise (PF)',
    approved: 'Porte Ativo',
    rejected: 'Indeferido',
    revoked: 'Revogado',
    expired: 'Vencido',

    // Warrants
    active: 'MANDADO ATIVO',
    executed: 'CUMPRIDO',
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
             {/* Replace with your logo if available */}
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
  
  // States
  const [activeTab, setActiveTab] = useState('requests'); // requests, warrants, archive
  const [licenses, setLicenses] = useState([]);
  const [warrants, setWarrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState(null);
  
  // Warrant Logic States
  const [isWarrantModalOpen, setIsWarrantModalOpen] = useState(false);
  const [viewingWarrant, setViewingWarrant] = useState(null);
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
      } else {
        let query = supabase.from('weapon_licenses').select('*, license_attachments(*)');
        
        if (activeTab === 'requests') {
          query = query.eq('status', 'pending');
        } else if (activeTab === 'archive') {
          query = query.in('status', ['judiciary_approved', 'rejected', 'revoked', 'expired', 'approved', 'processing']);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        setLicenses(data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- License Logic ---

  const sendWebhookNotification = async (data, type, status) => {
    // Determine webhook URL based on type
    const webhookUrl = type === 'warrant' ? discordConfig?.wantedWebhook : discordConfig?.weaponsWebhook;
    if (!webhookUrl) return;

    try {
      const colors = {
        // Licenses
        judiciary_approved: 0x8b5cf6, // Purple
        rejected: 0xef4444,   // Red
        // Warrants
        active: 0xdc2626, // Red (Warrant Issued)
        revoked: 0x94a3b8, // Slate
        executed: 0x22c55e // Green
      };

      const titles = {
        judiciary_approved: "⚖️ Porte Deferido pelo Jurídico",
        rejected: "⚖️ Porte Indeferido pelo Jurídico",
        active: "⚖️ NOVO MANDADO EXPEDIDO",
        revoked: "⚖️ Mandado Revogado",
        executed: "⚖️ Mandado Cumprido"
      };

      let fields = [];
      
      if (type === 'license') {
        fields = [
          { name: "Solicitante", value: data.full_name, inline: true },
          { name: "Passaporte", value: data.passport_id, inline: true },
          { name: "Status", value: status === 'judiciary_approved' ? 'DEFERIDO' : 'INDEFERIDO', inline: true },
          { name: "Motivo/Justificativa", value: data.reason }
        ];
      } else {
        // Warrant
        const typeLabels = {
          search_seizure: 'Busca e Apreensão',
          arrest: 'Prisão',
          preventive_arrest: 'Prisão Preventiva',
          temporary_arrest: 'Prisão Temporária',
          breach: 'Quebra de Sigilo'
        };

        fields = [
          { name: "ALVO", value: data.target_name, inline: true },
          { name: "TIPO", value: typeLabels[data.type] || data.type, inline: true },
          { name: "JUIZ EMISSOR", value: data.judge_name || 'Juiz Federal', inline: true },
          { name: "PRIORIDADE", value: data.priority.toUpperCase(), inline: true },
          { name: "ENDEREÇO", value: data.address || 'Não informado', inline: false },
          { name: "MOTIVAÇÃO", value: data.reason }
        ];
      }

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

  const updateLicenseStatus = async (id, newStatus) => {
    try {
      const updates = { status: newStatus };
      const { error } = await supabase.from('weapon_licenses').update(updates).eq('id', id);
      if (error) throw error;
      fetchData();
      setSelectedLicense(null);
      sendWebhookNotification({ ...selectedLicense, ...updates }, 'license', newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status.');
    }
  };

  // --- Warrant Logic ---

  const handleCreateWarrant = async (e) => {
    e.preventDefault();
    try {
      const newWarrant = {
        ...warrantForm,
        judge_id: user.id,
        judge_name: user.name || 'Juiz Federal',
        status: 'active'
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
      
      // Notify
      if (data && data[0]) {
        sendWebhookNotification(data[0], 'warrant', 'active');
      }
    } catch (err) {
      console.error("Erro ao criar mandado:", err);
      alert("Erro ao criar mandado. Verifique se a tabela 'warrants' foi criada.");
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
             sendWebhookNotification({ ...warrant, status: newStatus }, 'warrant', newStatus);
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
            onUpdateStatus={updateWarrantStatus}
        />
      )}

      {/* Create Warrant Modal */}
      {isWarrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Gavel className="text-federal-500" /> Expedir Novo Mandado
                    </h3>
                    <button onClick={() => setIsWarrantModalOpen(false)}><XCircle className="text-slate-400 hover:text-white" /></button>
                </div>
                
                <form onSubmit={handleCreateWarrant} className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                                <option value="breach">Quebra de Sigilo</option>
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
                                <option value="urgent">URGENTE</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                            placeholder="Endereço para busca e apreensão..."
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Motivo / Justificativa Resumida</label>
                        <input 
                            type="text"
                            value={warrantForm.reason}
                            onChange={e => setWarrantForm({...warrantForm, reason: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                            required
                            placeholder="Ex: Suspeita de tráfico de entorpecentes..."
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Determinação Judicial Detalhada</label>
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
                            type="datetime-local"
                            value={warrantForm.expires_at}
                            onChange={e => setWarrantForm({...warrantForm, expires_at: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsWarrantModalOpen(false)}
                            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-federal-600 hover:bg-federal-500 text-white rounded-lg font-bold shadow-lg"
                        >
                            Expedir Mandado
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Sidebar List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('requests')}
            className={clsx(
                "flex-1 py-2 text-xs font-bold rounded-md transition-colors",
                activeTab === 'requests' ? "bg-federal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            Porte de Armas
          </button>
          <button
            onClick={() => setActiveTab('warrants')}
            className={clsx(
                "flex-1 py-2 text-xs font-bold rounded-md transition-colors",
                activeTab === 'warrants' ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            Mandados
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={clsx(
                "flex-1 py-2 text-xs font-bold rounded-md transition-colors",
                activeTab === 'archive' ? "bg-federal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            )}
          >
            Arquivo (Portes)
          </button>
        </div>

        {/* Action Button for Warrants */}
        {activeTab === 'warrants' && (
            <button 
                onClick={() => setIsWarrantModalOpen(true)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed rounded-xl text-slate-300 hover:text-white font-bold flex items-center justify-center gap-2 transition-all"
            >
                <Gavel size={18} /> Novo Mandado Judicial
            </button>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>
          ) : activeTab === 'warrants' ? (
            warrants.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">Nenhum mandado encontrado.</div>
            ) : (
                warrants.map(warrant => (
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
          ) : licenses.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">Nenhum registro encontrado.</div>
          ) : (
            licenses.map(lic => (
                <div 
                    key={lic.id}
                    onClick={() => setSelectedLicense(lic)}
                    className={`bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all hover:border-federal-500/50 hover:bg-slate-800 ${selectedLicense?.id === lic.id ? 'border-federal-500 ring-1 ring-federal-500' : ''}`}
                >
                    <div className="flex justify-between items-start mb-3">
                        <StatusBadge status={lic.status} />
                        <span className="text-xs text-slate-500">
                        {new Date(lic.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <h3 className="font-bold text-white mb-1">{lic.full_name}</h3>
                    <p className="text-xs text-slate-400 mb-2">ID: {lic.passport_id}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{lic.reason}</p>
                </div>
            ))
          )}
        </div>
      </div>

      {/* Detail View (Licenses Only - Warrants use Modal) */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto hidden md:block">
        {activeTab === 'warrants' ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <Gavel size={48} className="opacity-50 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-300 mb-2">Gestão de Mandados</h2>
                <p className="max-w-md text-center text-slate-500">
                    Selecione um mandado na lista para visualizar o documento oficial, imprimir ou atualizar o status.
                    <br/><br/>
                    Clique em <strong>Novo Mandado Judicial</strong> para expedir uma nova ordem.
                </p>
            </div>
        ) : selectedLicense ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedLicense.full_name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  <span>Passaporte: {selectedLicense.passport_id}</span>
                  <span>•</span>
                  <span>Tel: {selectedLicense.phone}</span>
                </div>
              </div>
              <StatusBadge status={selectedLicense.status} />
            </div>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 mb-2">Motivo da Solicitação</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{selectedLicense.reason}</p>
            </div>

            {selectedLicense.license_attachments?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-3">Documentos Anexados</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedLicense.license_attachments.map(att => (
                    <a 
                      key={att.id} 
                      href={att.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-federal-500 transition-colors"
                    >
                      <FileText className="text-federal-400" size={20} />
                      <span className="text-xs text-slate-300 truncate">{att.file_name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4">Decisão Judicial</h3>
              <div className="flex flex-wrap gap-3">
                {selectedLicense.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateLicenseStatus(selectedLicense.id, 'judiciary_approved')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Deferir (Enviar para PF)
                    </button>
                    <button
                      onClick={() => updateLicenseStatus(selectedLicense.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Indeferir
                    </button>
                  </>
                )}
                
                {selectedLicense.status !== 'pending' && (
                    <p className="text-sm text-slate-500">
                        Esta solicitação já foi processada pelo jurídico ou está em outra fase.
                    </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Shield size={48} className="mb-4 opacity-20" />
            <p>Selecione uma solicitação para ver os detalhes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JudiciaryManager;
