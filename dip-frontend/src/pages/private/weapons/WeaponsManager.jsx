import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../hooks/useSettings';
import { usePermissions } from '../../../hooks/usePermissions';
import { 
  Shield, CheckCircle, XCircle, Clock, AlertTriangle, 
  FileText, Search, Filter, MoreVertical, Archive, RefreshCw, Send, Upload
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
    processing: 'Em Análise',
    approved: 'Aprovado',
    rejected: 'Negado',
    revoked: 'Revogado',
    expired: 'Vencido'
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const WeaponsManager = () => {
  const { discordConfig } = useSettings();
  const [activeTab, setActiveTab] = useState('requests'); // requests, process, archive
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  
  // Fetch data based on active tab
  useEffect(() => {
    fetchLicenses();
  }, [activeTab]);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('weapon_licenses')
        .select('*, license_attachments(*)');

      if (activeTab === 'requests') {
        // Police sees only what Judiciary approved
        query = query.eq('status', 'judiciary_approved');
      } else if (activeTab === 'process') {
        query = query.eq('status', 'processing');
      } else if (activeTab === 'archive') {
        query = query.in('status', ['approved', 'rejected', 'revoked', 'expired']);
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

  const handleFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      const user = (await supabase.auth.getUser()).data.user;
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedLicense.id}/${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('license-docs')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('license-docs')
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from('license_attachments')
          .insert({
            license_id: selectedLicense.id,
            url: publicUrl,
            file_name: file.name,
            file_type: file.type,
            uploaded_by: user?.id
          });
          
        if (dbError) throw dbError;
      }
      
      // Refresh current license data
      const { data: updatedLicense } = await supabase
        .from('weapon_licenses')
        .select('*, license_attachments(*)')
        .eq('id', selectedLicense.id)
        .single();
        
      if (updatedLicense) {
        setSelectedLicense(updatedLicense);
        // Also update the list item
        setLicenses(prev => prev.map(l => l.id === updatedLicense.id ? updatedLicense : l));
      }
      
      alert('Documentos adicionados com sucesso!');
      
    } catch (err) {
      console.error('Error uploading files:', err);
      alert('Erro ao enviar documentos: ' + err.message);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = null;
    }
  };

  const sendWebhookNotification = async (license, newStatus) => {
    if (!discordConfig?.weaponsWebhook) return;

    try {
      const colors = {
        processing: 0x3b82f6, // Blue
        approved: 0x22c55e,   // Green
        rejected: 0xef4444,   // Red
        revoked: 0x94a3b8,    // Gray
        expired: 0xf97316     // Orange
      };

      const titles = {
        processing: "📝 Solicitação em Análise",
        approved: "✅ Porte de Arma Aprovado",
        rejected: "❌ Solicitação Negada",
        revoked: "🚫 Porte Revogado",
        expired: "⚠️ Porte Vencido"
      };

      const embed = {
        title: titles[newStatus] || "Atualização de Status",
        color: colors[newStatus] || 0x000000,
        fields: [
          { name: "Solicitante", value: license.full_name, inline: true },
          { name: "Passaporte", value: license.passport_id, inline: true },
          { name: "Status", value: newStatus.toUpperCase(), inline: true },
          { name: "Motivo/Justificativa", value: license.reason }
        ],
        footer: { text: "Sistema de Armas - Polícia Federal" },
        timestamp: new Date().toISOString()
      };

      if (newStatus === 'approved') {
        embed.fields.push(
          { name: "Data de Aprovação", value: new Date(license.approved_at).toLocaleDateString(), inline: true },
          { name: "Vencimento", value: new Date(license.expires_at).toLocaleDateString(), inline: true }
        );
      }

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
      
      if (newStatus === 'approved') {
        const now = new Date();
        const expires = new Date();
        expires.setDate(now.getDate() + 30); // 30 dias de validade
        
        updates.approved_at = now.toISOString();
        updates.expires_at = expires.toISOString();
      }

      const { error } = await supabase
        .from('weapon_licenses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Refresh list
      fetchLicenses();
      setSelectedLicense(null);
      
      // Send Webhook notification
      // We pass the license object with updated status for the notification context
      // Note: sendWebhookNotification uses the passed status, not the license.status (which is old in the object)
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
            Solicitações
          </button>
          <button
            onClick={() => setActiveTab('process')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'process' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Em Processo
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
          {loading ? (
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
        {selectedLicense ? (
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
              
              {selectedLicense.status === 'processing' && (
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 mb-6">
                  <h3 className="text-sm font-bold text-slate-300 mb-3">Adicionar Documentos do Processo</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Anexe laudos médicos, psicológicos e comprovantes de pagamento enviados pelo cidadão.
                  </p>
                  
                  <label className={`flex items-center justify-center gap-3 p-4 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-federal-500 hover:bg-slate-900 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <RefreshCw className="animate-spin text-federal-500" size={24} />
                    ) : (
                      <Upload className="text-slate-400" size={24} />
                    )}
                    <span className="text-sm font-bold text-slate-300">
                      {uploading ? 'Enviando...' : 'Clique para selecionar arquivos'}
                    </span>
                  </label>
                </div>
              )}

              <h3 className="text-sm font-bold text-white mb-4">Ações</h3>
              <div className="flex flex-wrap gap-3">
                {(selectedLicense.status === 'pending' || selectedLicense.status === 'judiciary_approved') && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedLicense.id, 'processing')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Aceitar Processo
                    </button>
                    <button
                      onClick={() => updateStatus(selectedLicense.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Negar Solicitação
                    </button>
                  </>
                )}

                {selectedLicense.status === 'processing' && canManage && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedLicense.id, 'approved')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Finalizar e Aprovar
                    </button>
                    <button
                      onClick={() => updateStatus(selectedLicense.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Finalizar por Falta de Conclusão
                    </button>
                  </>
                )}

                {selectedLicense.status === 'approved' && canManage && (
                  <button
                    onClick={() => updateStatus(selectedLicense.id, 'revoked')}
                    className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 text-sm font-bold rounded-lg flex items-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    Revogar Porte
                  </button>
                )}
                
                {(selectedLicense.status === 'revoked' || selectedLicense.status === 'expired') && canManage && (
                   <button
                    onClick={() => updateStatus(selectedLicense.id, 'processing')}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Reabrir para Renovação
                  </button>
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

export default WeaponsManager;
