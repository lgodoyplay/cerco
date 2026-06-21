import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../hooks/useSettings';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../context/AuthContext';
import WeaponLicenseRequestFlow from '../../../components/weapons/WeaponLicenseRequestFlow';
import NotificationBanner from '../../../components/feedback/NotificationBanner';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  Send,
  Upload,
  CalendarClock
} from 'lucide-react';

const PROCESS_DOCUMENTS = [
  {
    key: 'medical_report',
    label: 'Laudo Medico',
    description: 'Laudo medico ou psicologico exigido para o porte.'
  },
  {
    key: 'judicial_report',
    label: 'Laudo do Juridico',
    description: 'Documento ou parecer emitido pelo juridico.'
  },
  {
    key: 'judicial_payment_receipt',
    label: 'Comprovante do Juridico',
    description: 'Comprovante de pagamento da etapa juridica.'
  }
];

const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  judiciary_approved: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  approved: 'bg-green-500/10 text-green-500 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  revoked: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  expired: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
};

const STATUS_LABELS = {
  pending: 'Pedido Recebido',
  judiciary_approved: 'Triagem Deferida',
  processing: 'Em Processo',
  approved: 'Porte Ativo',
  rejected: 'Negado',
  revoked: 'Revogado',
  expired: 'Vencido'
};

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('pt-BR');
};

const formatDateTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('pt-BR');
};

const toInputDateValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultRenewalDate = () => {
  const renewalDate = new Date();
  renewalDate.setDate(renewalDate.getDate() + 30);
  return toInputDateValue(renewalDate);
};

const getAttachmentCategory = (attachment) => {
  const fileName = attachment?.file_name || '';
  const match = fileName.match(/^\[([^\]]+)\]\s*/);
  return match ? match[1] : 'request_document';
};

const getDisplayFileName = (attachment) => {
  const fileName = attachment?.file_name || 'Documento';
  return fileName.replace(/^\[[^\]]+\]\s*/, '');
};

const getAttachmentsByCategory = (license, category) =>
  (license?.license_attachments || []).filter((attachment) => getAttachmentCategory(attachment) === category);

const hasAllRequiredProcessDocuments = (license) =>
  PROCESS_DOCUMENTS.every((document) => getAttachmentsByCategory(license, document.key).length > 0);

const getProcessCompletion = (license) =>
  PROCESS_DOCUMENTS.filter((document) => getAttachmentsByCategory(license, document.key).length > 0).length;

const getRenewalState = (license) => {
  if (!license?.expires_at || license.status !== 'approved') return null;

  const diff = new Date(license.expires_at).getTime() - Date.now();

  if (diff <= 0) {
    return {
      type: 'expired',
      title: 'Porte vencido',
      message: `O porte de ${license.full_name} venceu em ${formatDate(license.expires_at)}.`
    };
  }

  if (diff <= 24 * 60 * 60 * 1000) {
    return {
      type: 'warning',
      title: 'Renovacao em 1 dia',
      message: `${license.full_name} precisa renovar ate ${formatDate(license.expires_at)}.`
    };
  }

  return null;
};

const getTabForStatus = (status) => {
  if (status === 'processing') return 'process';
  if (['approved', 'rejected', 'revoked', 'expired'].includes(status)) return 'archive';
  return 'requests';
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-md text-xs font-bold border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
    {STATUS_LABELS[status] || status}
  </span>
);

const WeaponsManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { discordConfig } = useSettings();
  const { can } = usePermissions();
  const canManage = can('weapons_manage');

  const [activeTab, setActiveTab] = useState('requests');
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [showRequestFlow, setShowRequestFlow] = useState(false);
  const [requestPrefill, setRequestPrefill] = useState({});
  const [renewalDate, setRenewalDate] = useState(getDefaultRenewalDate());
  const [uploadingCategory, setUploadingCategory] = useState('');
  const [notification, setNotification] = useState(null);
  const [renewalAlerts, setRenewalAlerts] = useState([]);

  useEffect(() => {
    fetchLicenses(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenRequest = params.get('request') === 'new';
    const storedDraftRaw = window.localStorage.getItem('weaponLicenseDraft');
    let storedDraft = null;

    if (storedDraftRaw) {
      try {
        storedDraft = JSON.parse(storedDraftRaw);
      } catch (_error) {
        storedDraft = null;
      }
    }

    if (!shouldOpenRequest && !storedDraft) return;

    setRequestPrefill({
      fullName: storedDraft?.fullName || user?.full_name || user?.name || '',
      passportId: storedDraft?.passportId || user?.passport_id || '',
      phone: storedDraft?.phone || user?.phone || ''
    });
    setShowRequestFlow(true);
    setSelectedLicense(null);
    window.localStorage.removeItem('weaponLicenseDraft');

    if (shouldOpenRequest) {
      navigate('/dashboard/weapons', { replace: true });
    }
  }, [location.search, navigate, user]);

  useEffect(() => {
    if (!selectedLicense) {
      setRenewalDate(getDefaultRenewalDate());
      return;
    }

    setRenewalDate(
      selectedLicense.expires_at ? toInputDateValue(selectedLicense.expires_at) : getDefaultRenewalDate()
    );
  }, [selectedLicense]);

  const requestDocuments = useMemo(
    () => getAttachmentsByCategory(selectedLicense, 'request_document'),
    [selectedLicense]
  );

  const processDocumentsComplete = useMemo(
    () => hasAllRequiredProcessDocuments(selectedLicense),
    [selectedLicense]
  );

  const selectedRenewalState = useMemo(
    () => getRenewalState(selectedLicense),
    [selectedLicense]
  );

  const syncExpiredLicenses = async () => {
    if (!canManage) return;

    try {
      await supabase
        .from('weapon_licenses')
        .update({ status: 'expired' })
        .eq('status', 'approved')
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Erro ao atualizar portes vencidos:', error);
    }
  };

  const refreshRenewalAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('weapon_licenses')
        .select('*, license_attachments(*)')
        .eq('status', 'approved')
        .order('expires_at', { ascending: true });

      if (error) throw error;

      setRenewalAlerts((data || []).filter((license) => getRenewalState(license)?.type === 'warning'));
    } catch (error) {
      console.error('Erro ao carregar alertas de renovacao:', error);
    }
  };

  const fetchLicenses = async (tab = activeTab) => {
    setLoading(true);

    try {
      await syncExpiredLicenses();

      let query = supabase
        .from('weapon_licenses')
        .select('*, license_attachments(*)');

      if (tab === 'requests') {
        query = query.in('status', ['pending', 'judiciary_approved']);
      } else if (tab === 'process') {
        query = query.eq('status', 'processing');
      } else if (tab === 'archive') {
        query = query.in('status', ['approved', 'rejected', 'revoked', 'expired']);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setLicenses(data || []);

      if (selectedLicense) {
        const refreshedSelected = (data || []).find((license) => license.id === selectedLicense.id);
        if (refreshedSelected) {
          setSelectedLicense(refreshedSelected);
        }
      }

      await refreshRenewalAlerts();
    } catch (error) {
      console.error('Erro ao carregar portes:', error);
      setNotification({
        type: 'error',
        title: 'Falha ao carregar',
        message: 'Nao foi possivel carregar a aba de porte de armas.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleLicense = async (licenseId) => {
    const { data, error } = await supabase
      .from('weapon_licenses')
      .select('*, license_attachments(*)')
      .eq('id', licenseId)
      .single();

    if (error) throw error;
    return data;
  };

  const handleOpenRequestFlow = () => {
    setRequestPrefill({
      fullName: user?.full_name || user?.name || '',
      passportId: user?.passport_id || '',
      phone: user?.phone || ''
    });
    setShowRequestFlow(true);
    setSelectedLicense(null);
  };

  const handleRequestSubmitted = async (licenseId) => {
    setActiveTab('requests');
    setShowRequestFlow(false);
    await fetchLicenses('requests');

    if (!licenseId) return;

    try {
      const createdLicense = await fetchSingleLicense(licenseId);
      setSelectedLicense(createdLicense);
      setNotification({
        type: 'success',
        title: 'Pedido registrado',
        message: 'A primeira etapa foi criada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao abrir solicitacao criada:', error);
    }
  };

  const handleFileUpload = async (category, event) => {
    if (!selectedLicense || !event.target.files || event.target.files.length === 0) return;

    setUploadingCategory(category);

    try {
      const files = Array.from(event.target.files);
      const {
        data: { user: currentUser }
      } = await supabase.auth.getUser();

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const storageFileName = `${selectedLicense.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('license-docs')
          .upload(storageFileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('license-docs')
          .getPublicUrl(storageFileName);

        const { error: attachmentError } = await supabase
          .from('license_attachments')
          .insert({
            license_id: selectedLicense.id,
            url: publicUrlData.publicUrl,
            file_name: `[${category}] ${file.name}`,
            file_type: file.type,
            uploaded_by: currentUser?.id || null
          });

        if (attachmentError) throw attachmentError;
      }

      const refreshedLicense = await fetchSingleLicense(selectedLicense.id);
      setSelectedLicense(refreshedLicense);
      setLicenses((previousLicenses) =>
        previousLicenses.map((license) => (license.id === refreshedLicense.id ? refreshedLicense : license))
      );
      setNotification({
        type: 'success',
        title: 'Documento anexado',
        message: 'A etapa de processo foi atualizada com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao enviar documento do processo:', error);
      setNotification({
        type: 'error',
        title: 'Falha no envio',
        message: 'Nao foi possivel anexar o documento do processo.'
      });
    } finally {
      setUploadingCategory('');
      event.target.value = '';
    }
  };

  const sendWebhookNotification = async (license, newStatus) => {
    if (!discordConfig?.weaponsWebhook) return;

    try {
      const colors = {
        processing: 0x3b82f6,
        approved: 0x22c55e,
        rejected: 0xef4444,
        revoked: 0x94a3b8,
        expired: 0xf97316
      };

      const titles = {
        processing: 'Etapa 2 iniciada',
        approved: 'Porte liberado',
        rejected: 'Solicitacao negada',
        revoked: 'Porte revogado',
        expired: 'Porte vencido'
      };

      const embed = {
        title: titles[newStatus] || 'Atualizacao de porte',
        color: colors[newStatus] || 0x000000,
        fields: [
          { name: 'Solicitante', value: license.full_name, inline: true },
          { name: 'Passaporte', value: license.passport_id, inline: true },
          { name: 'Status', value: STATUS_LABELS[newStatus] || newStatus, inline: true },
          { name: 'Motivo', value: license.reason || 'Nao informado' }
        ],
        footer: { text: 'Sistema de Armas - CIVIL EUFORIA' },
        timestamp: new Date().toISOString()
      };

      if (newStatus === 'approved') {
        embed.fields.push(
          { name: 'Data da Liberacao', value: formatDate(license.approved_at), inline: true },
          { name: 'Renovar em', value: formatDate(license.expires_at), inline: true }
        );
      }

      await fetch(discordConfig.weaponsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    } catch (error) {
      console.error('Erro ao enviar webhook do porte:', error);
    }
  };

  const updateStatus = async (license, newStatus) => {
    if (!license) return;

    try {
      const updates = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'processing') {
        updates.assigned_to = user?.id || null;
      }

      if (newStatus === 'approved') {
        const today = new Date();
        const renewalTarget = renewalDate ? new Date(`${renewalDate}T23:59:59`) : null;

        if (!renewalTarget || Number.isNaN(renewalTarget.getTime())) {
          setNotification({
            type: 'error',
            title: 'Data invalida',
            message: 'Informe a data de renovacao antes de liberar o porte.'
          });
          return;
        }

        updates.approved_at = today.toISOString();
        updates.expires_at = renewalTarget.toISOString();
      }

      const { data: updatedLicense, error } = await supabase
        .from('weapon_licenses')
        .update(updates)
        .eq('id', license.id)
        .select('*, license_attachments(*)')
        .single();

      if (error) throw error;

      const targetTab = getTabForStatus(newStatus);
      setActiveTab(targetTab);
      setSelectedLicense(updatedLicense);
      await fetchLicenses(targetTab);
      await sendWebhookNotification(updatedLicense, newStatus);

      const successMessages = {
        processing: 'A solicitacao foi movida para a etapa de processo.',
        approved: 'O porte foi liberado com a data de hoje e a renovacao definida.',
        rejected: 'A solicitacao foi encerrada como negada.',
        revoked: 'O porte foi revogado com sucesso.',
        expired: 'O porte foi marcado como vencido.',
        pending: 'O pedido voltou para a etapa inicial.'
      };

      setNotification({
        type: 'success',
        title: 'Status atualizado',
        message: successMessages[newStatus] || 'A situacao do porte foi atualizada.'
      });
    } catch (error) {
      console.error('Erro ao atualizar status do porte:', error);
      setNotification({
        type: 'error',
        title: 'Falha na acao',
        message: 'Nao foi possivel atualizar o status do porte.'
      });
    }
  };

  const LicenseCard = ({ license }) => {
    const renewalState = getRenewalState(license);
    const processCount = getProcessCompletion(license);

    return (
      <div
        onClick={() => setSelectedLicense(license)}
        className={`bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all hover:border-federal-500/50 hover:bg-slate-800 ${selectedLicense?.id === license.id ? 'border-federal-500 ring-1 ring-federal-500' : ''}`}
      >
        <div className="flex justify-between items-start mb-3 gap-3">
          <StatusBadge status={license.status} />
          <span className="text-xs text-slate-500">{formatDate(license.created_at)}</span>
        </div>

        <h3 className="font-bold text-white mb-1">{license.full_name}</h3>
        <p className="text-xs text-slate-400 mb-2">Passaporte: {license.passport_id}</p>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{license.reason}</p>

        {(license.status === 'processing' || license.status === 'approved') && (
          <p className="text-[11px] text-slate-400">
            Processo: {processCount}/{PROCESS_DOCUMENTS.length} documentos obrigatorios
          </p>
        )}

        {renewalState?.type === 'warning' && (
          <p className="text-[11px] text-amber-400 mt-2">{renewalState.message}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <NotificationBanner
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-federal-500" />
            Porte de Armas
          </h1>
          <p className="text-slate-400 mt-1">
            Etapa 1 pedido, etapa 2 processo com documentos obrigatorios e etapa 3 porte ativo com renovacao.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenRequestFlow}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-federal-600 hover:bg-federal-500 text-white font-bold transition-colors"
        >
          <Send size={18} />
          Solicitar Porte
        </button>
      </div>

      {renewalAlerts.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-300 font-bold mb-3">
            <CalendarClock size={18} />
            Aviso de renovacao
          </div>
          <div className="space-y-2">
            {renewalAlerts.map((license) => (
              <button
                key={license.id}
                type="button"
                onClick={() => {
                  setActiveTab('archive');
                  setSelectedLicense(license);
                }}
                className="w-full text-left px-3 py-3 rounded-xl bg-slate-950/50 border border-amber-500/10 hover:border-amber-400/40 transition-colors"
              >
                <p className="text-sm text-white font-semibold">{license.full_name}</p>
                <p className="text-xs text-amber-200">
                  Renovar ate {formatDate(license.expires_at)}. Faltando 1 dia para vencer.
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {showRequestFlow && (
        <WeaponLicenseRequestFlow
          initialData={requestPrefill}
          onCancel={() => setShowRequestFlow(false)}
          onSubmitted={handleRequestSubmitted}
        />
      )}

      <div className={`${showRequestFlow ? 'min-h-[620px]' : 'h-[calc(100vh-6rem)]'} flex flex-col md:flex-row gap-6`}>
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'requests' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              1. Pedido
            </button>
            <button
              onClick={() => setActiveTab('process')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'process' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              2. Processo
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'archive' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              3. Porte
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>
            ) : licenses.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">Nenhum registro encontrado.</div>
            ) : (
              licenses.map((license) => <LicenseCard key={license.id} license={license} />)
            )}
          </div>
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto">
          {selectedLicense ? (
            <div className="space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedLicense.full_name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                    <span>Passaporte: {selectedLicense.passport_id}</span>
                    <span>Telefone: {selectedLicense.phone}</span>
                    <span>Criado em: {formatDateTime(selectedLicense.created_at)}</span>
                  </div>
                </div>
                <StatusBadge status={selectedLicense.status} />
              </div>

              {selectedRenewalState && (
                <NotificationBanner
                  notification={{
                    type: selectedRenewalState.type === 'expired' ? 'error' : 'warning',
                    title: selectedRenewalState.title,
                    message: selectedRenewalState.message
                  }}
                />
              )}

              <div className="grid lg:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Etapa 1</p>
                  <p className="text-white font-semibold">Pedido</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Nome, passaporte, telefone do jogo e motivo da solicitacao.
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Etapa 2</p>
                  <p className="text-white font-semibold">Processo</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Laudo medico, laudo juridico e comprovante do juridico.
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Etapa 3</p>
                  <p className="text-white font-semibold">Porte ativo</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Data de hoje gravada no sistema, renovacao e possibilidade de revogacao.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-300 mb-2">Motivo da Solicitacao</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{selectedLicense.reason}</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300">Documentos do Pedido</h3>
                {requestDocuments.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {requestDocuments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-federal-500 transition-colors"
                      >
                        <FileText className="text-federal-400" size={18} />
                        <span className="text-xs text-slate-300 truncate">{getDisplayFileName(attachment)}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum documento foi anexado no pedido inicial.</p>
                )}
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Etapa 2 - Processo</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      O botao de liberar o porte so aparece habilitado quando os 3 documentos obrigatorios estiverem anexados.
                    </p>
                  </div>
                  <div className="text-xs text-slate-400">
                    Checklist: {getProcessCompletion(selectedLicense)}/{PROCESS_DOCUMENTS.length}
                  </div>
                </div>

                <div className="grid xl:grid-cols-3 gap-4">
                  {PROCESS_DOCUMENTS.map((document) => {
                    const documentFiles = getAttachmentsByCategory(selectedLicense, document.key);
                    const completed = documentFiles.length > 0;
                    const isUploading = uploadingCategory === document.key;

                    return (
                      <div key={document.key} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-white">{document.label}</p>
                            <p className="text-xs text-slate-500 mt-1">{document.description}</p>
                          </div>
                          {completed ? (
                            <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Ok
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Pendente
                            </span>
                          )}
                        </div>

                        {documentFiles.length > 0 ? (
                          <div className="space-y-2">
                            {documentFiles.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-federal-500 transition-colors"
                              >
                                <FileText size={16} className="text-federal-400 shrink-0" />
                                <span className="text-xs text-slate-300 truncate">{getDisplayFileName(attachment)}</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">Nenhum arquivo anexado ainda.</p>
                        )}

                        {selectedLicense.status === 'processing' && (
                          <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isUploading ? 'border-federal-500 bg-slate-900 opacity-70' : 'border-slate-700 hover:border-federal-500 hover:bg-slate-900'}`}>
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(event) => handleFileUpload(document.key, event)}
                              disabled={Boolean(uploadingCategory)}
                            />
                            {isUploading ? (
                              <RefreshCw className="animate-spin text-federal-500" size={18} />
                            ) : (
                              <Upload className="text-slate-400" size={18} />
                            )}
                            <span className="text-xs font-bold text-slate-300">
                              {isUploading ? 'Enviando...' : 'Anexar documento'}
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {(selectedLicense.status === 'approved' || selectedLicense.status === 'revoked' || selectedLicense.status === 'expired') && (
                <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Data do porte</p>
                    <p className="text-lg text-white font-semibold">{formatDate(selectedLicense.approved_at)}</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Renovar em</p>
                    <p className="text-lg text-white font-semibold">{formatDate(selectedLicense.expires_at)}</p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Acoes</h3>

                {(selectedLicense.status === 'pending' || selectedLicense.status === 'judiciary_approved') && canManage && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => updateStatus(selectedLicense, 'processing')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Iniciar Processo
                    </button>
                    <button
                      onClick={() => updateStatus(selectedLicense, 'rejected')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Negar Pedido
                    </button>
                  </div>
                )}

                {selectedLicense.status === 'processing' && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                    <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-end">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                          Data para renovacao
                        </label>
                        <input
                          type="date"
                          value={renewalDate}
                          min={toInputDateValue(new Date())}
                          onChange={(event) => setRenewalDate(event.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          Ao clicar em dar porte, o sistema grava a data de hoje e a renovacao informada acima.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateStatus(selectedLicense, 'approved')}
                        disabled={!processDocumentsComplete || !canManage}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle size={18} />
                        Dar Porte
                      </button>
                    </div>

                    {!processDocumentsComplete && (
                      <p className="text-sm text-amber-400">
                        Faltam documentos obrigatorios para liberar o porte.
                      </p>
                    )}

                    {!canManage && (
                      <p className="text-sm text-slate-400">
                        Aguarde um responsavel com permissao concluir a liberacao final.
                      </p>
                    )}

                    <button
                      onClick={() => updateStatus(selectedLicense, 'rejected')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Encerrar Sem Liberacao
                    </button>
                  </div>
                )}

                {selectedLicense.status === 'approved' && canManage && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => updateStatus(selectedLicense, 'revoked')}
                      className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <AlertTriangle size={16} />
                      Revogar Porte
                    </button>
                  </div>
                )}

                {(selectedLicense.status === 'revoked' || selectedLicense.status === 'expired') && canManage && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => updateStatus(selectedLicense, 'processing')}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <RefreshCw size={16} />
                      Reabrir Para Renovacao
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Shield size={48} className="mb-4 opacity-20" />
              <p>Selecione uma solicitacao para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeaponsManager;
