import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../hooks/useSettings';
import { 
  Gavel, CheckCircle, XCircle, Clock, AlertTriangle, 
  FileText, Search, Filter, MoreVertical, Archive, RefreshCw, Send, Upload, Shield
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    judiciary_approved: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    approved: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    revoked: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    expired: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
  };

  const labels = {
    pending: 'Aguardando Jurídico',
    judiciary_approved: 'Deferido pelo Juiz',
    processing: 'Em Análise (PF)',
    approved: 'Porte Ativo',
    rejected: 'Indeferido',
    revoked: 'Revogado',
    expired: 'Vencido'
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const JudiciaryManager = () => {
  const { discordConfig } = useSettings();
  const [activeTab, setActiveTab] = useState('requests'); // requests, warrants, archive
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState(null);
  
  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'warrants') return;
    fetchLicenses();
  }, [activeTab]);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('weapon_licenses')
        .select('*, license_attachments(*)');

      if (activeTab === 'requests') {
        query = query.eq('status', 'pending');
      } else if (activeTab === 'archive') {
        query = query.in('status', ['judiciary_approved', 'rejected', 'revoked', 'expired', 'approved', 'processing']);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setLicenses(data || []);
    } catch (err) {
      console.error('Error fetching licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendWebhookNotification = async (license, newStatus) => {
    if (!discordConfig?.weaponsWebhook) return;

    try {
      const colors = {
        judiciary_approved: 0x8b5cf6, // Purple
        rejected: 0xef4444,   // Red
      };

      const titles = {
        judiciary_approved: "⚖️ Deferido pelo Jurídico",
        rejected: "⚖️ Indeferido pelo Jurídico",
      };

      const embed = {
        title: titles[newStatus] || "Atualização Jurídica",
        color: colors[newStatus] || 0x000000,
        fields: [
          { name: "Solicitante", value: license.full_name, inline: true },
          { name: "Passaporte", value: license.passport_id, inline: true },
          { name: "Status", value: newStatus === 'judiciary_approved' ? 'DEFERIDO' : 'INDEFERIDO', inline: true },
          { name: "Motivo/Justificativa", value: license.reason }
        ],
        footer: { text: "Sistema Judiciário - Polícia Federal" },
        timestamp: new Date().toISOString()
      };

      await fetch(discordConfig.weaponsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    } catch (err) {
      console.error("Erro ao enviar webhook:", err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const updates = { status: newStatus };
      
      const { error } = await supabase
        .from('weapon_licenses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Refresh list
      fetchLicenses();
      setSelectedLicense(null);
      
      sendWebhookNotification({ ...selectedLicense, ...updates }, newStatus);
      
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status.');
    }
  };

  const LicenseCard = ({ license }) => (
    <div 
      onClick={() => setSelectedLicense(license)}
      className={`bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all hover:border-federal-500/50 hover:bg-slate-800 ${selectedLicense?.id === license.id ? 'border-federal-500 ring-1 ring-federal-500' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <StatusBadge status={license.status} />
        <span className="text-xs text-slate-500">
          {new Date(license.created_at).toLocaleDateString()}
        </span>
      </div>
      <h3 className="font-bold text-white mb-1">{license.full_name}</h3>
      <p className="text-xs text-slate-400 mb-2">ID: {license.passport_id}</p>
      <p className="text-xs text-slate-500 line-clamp-2">{license.reason}</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'requests' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setActiveTab('warrants')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'warrants' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Mandados
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'archive' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Arquivo
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {activeTab === 'warrants' ? (
             <div className="text-center py-10 text-slate-500 text-sm">
                <Gavel className="mx-auto mb-2 opacity-50" size={32} />
                <p>Sistema de Mandados em Desenvolvimento</p>
             </div>
          ) : loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">Nenhum registro encontrado.</div>
          ) : (
            licenses.map(lic => <LicenseCard key={lic.id} license={lic} />)
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto">
        {activeTab === 'warrants' ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Gavel size={64} className="mb-6 opacity-20" />
                <h2 className="text-2xl font-bold text-slate-300 mb-2">Área do Juiz</h2>
                <p className="max-w-md text-center">
                    Aqui serão gerenciados os mandados de busca, apreensão e prisão. 
                    Funcionalidade sendo implementada.
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
                      onClick={() => updateStatus(selectedLicense.id, 'judiciary_approved')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Deferir (Enviar para PF)
                    </button>
                    <button
                      onClick={() => updateStatus(selectedLicense.id, 'rejected')}
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