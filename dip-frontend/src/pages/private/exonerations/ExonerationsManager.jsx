import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../context/AuthContext';
import NotificationBanner from '../../../components/feedback/NotificationBanner';
import {
  BadgeX,
  Plus,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Image as ImageIcon,
  FileText,
  ExternalLink
} from 'lucide-react';

const STATUS_STYLES = {
  catalogado: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  exonerado: 'bg-red-500/10 text-red-300 border-red-500/20',
  cancelado: 'bg-slate-500/10 text-slate-300 border-slate-500/20'
};

const STATUS_LABELS = {
  catalogado: 'Catalogado',
  exonerado: 'Exonerado',
  cancelado: 'Cancelado'
};

const normalizeExternalUrl = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const openExternalLink = (value) => {
  const normalized = normalizeExternalUrl(value);
  if (!normalized) return;
  window.open(normalized, '_blank', 'noopener,noreferrer');
};

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('pt-BR');
};

const toInputDateValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-md text-xs font-bold border ${STATUS_STYLES[status] || STATUS_STYLES.catalogado}`}>
    {STATUS_LABELS[status] || status}
  </span>
);

const createEmptyForm = () => ({
  fullName: '',
  passportId: '',
  roleName: '',
  department: '',
  reason: '',
  notes: '',
  decisionDate: toInputDateValue(new Date())
});

const ExonerationsManager = () => {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canView = can('exonerations_view');
  const canManage = can('exonerations_manage');

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalogado');
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [notification, setNotification] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm());
  const [proofs, setProofs] = useState([]);
  const [linkInput, setLinkInput] = useState('');

  const fetchRecords = async () => {
    if (!canView) return;

    setLoading(true);
    try {
      let query = supabase
        .from('exonerations')
        .select('*, exoneration_proofs(*)')
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRecords(data || []);

      if (selectedRecord) {
        const refreshed = (data || []).find((item) => item.id === selectedRecord.id);
        if (refreshed) setSelectedRecord(refreshed);
      }
    } catch (error) {
      console.error('Erro ao carregar exonerações:', error);
      setNotification({
        type: 'error',
        title: 'Falha ao carregar',
        message: 'Nao foi possivel carregar a aba de exoneracao.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeTab]);

  const handleOpenCreate = () => {
    setFormData(createEmptyForm());
    setProofs([]);
    setLinkInput('');
    setCreateOpen(true);
    setNotification(null);
  };

  const handleFormInput = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    const nextProofs = selectedFiles.map((file) => ({
      id: crypto.randomUUID(),
      type: 'image',
      file,
      title: file.name,
      preview: URL.createObjectURL(file)
    }));

    setProofs((prev) => [...prev, ...nextProofs]);
    event.target.value = '';
  };

  const addLinkProof = () => {
    if (!linkInput.trim()) return;

    setProofs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'link',
        url: linkInput.trim(),
        title: linkInput.trim()
      }
    ]);
    setLinkInput('');
  };

  const removeProof = (proofId) => {
    setProofs((prev) => {
      const proof = prev.find((item) => item.id === proofId);
      if (proof?.preview) URL.revokeObjectURL(proof.preview);
      return prev.filter((item) => item.id !== proofId);
    });
  };

  const uploadProofs = async (exonerationId) => {
    const rows = [];

    for (const proof of proofs) {
      if (proof.type === 'link') {
        rows.push({
          exoneration_id: exonerationId,
          proof_type: 'link',
          url: proof.url.trim(),
          title: proof.title || proof.url.trim(),
          file_name: null,
          uploaded_by: user?.id || null
        });
        continue;
      }

      const fileExt = proof.file.name.split('.').pop();
      const storageFileName = `${exonerationId}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('exoneration-proofs')
        .upload(storageFileName, proof.file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('exoneration-proofs')
        .getPublicUrl(storageFileName);

      rows.push({
        exoneration_id: exonerationId,
        proof_type: 'image',
        url: publicUrlData.publicUrl,
        title: proof.title || proof.file.name,
        file_name: proof.file.name,
        uploaded_by: user?.id || null
      });
    }

    if (!rows.length) return;

    const { error } = await supabase.from('exoneration_proofs').insert(rows);
    if (error) throw error;
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!canManage) {
      setNotification({
        type: 'error',
        title: 'Sem permissao',
        message: 'Voce nao tem permissao para catalogar exonerações.'
      });
      return;
    }

    if (!formData.fullName.trim() || !formData.passportId.trim() || !formData.reason.trim()) {
      setNotification({
        type: 'warning',
        title: 'Campos obrigatorios',
        message: 'Preencha nome, passaporte e motivo da exoneração.'
      });
      return;
    }

    if (proofs.length === 0) {
      setNotification({
        type: 'warning',
        title: 'Provas obrigatorias',
        message: 'Adicione pelo menos uma prova com imagem ou link.'
      });
      return;
    }

    setCreating(true);
    try {
      const exonerationId = crypto.randomUUID();
      const decisionDate = new Date(`${formData.decisionDate}T12:00:00`);

      const { error: insertError } = await supabase
        .from('exonerations')
        .insert({
          id: exonerationId,
          status: 'catalogado',
          full_name: formData.fullName,
          passport_id: formData.passportId,
          role_name: formData.roleName || null,
          department: formData.department || null,
          reason: formData.reason,
          notes: formData.notes || null,
          decision_date: decisionDate.toISOString(),
          created_by: user?.id || null
        });

      if (insertError) throw insertError;

      await uploadProofs(exonerationId);

      const { data: createdRecord, error: fetchError } = await supabase
        .from('exonerations')
        .select('*, exoneration_proofs(*)')
        .eq('id', exonerationId)
        .single();

      if (fetchError) throw fetchError;

      proofs.forEach((proof) => proof.preview && URL.revokeObjectURL(proof.preview));
      setProofs([]);
      setFormData(createEmptyForm());
      setCreateOpen(false);
      setSelectedRecord(createdRecord);
      setActiveTab('catalogado');
      await fetchRecords();

      setNotification({
        type: 'success',
        title: 'Exoneração catalogada',
        message: 'O registro e as provas foram salvos com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao criar exoneração:', error);
      setNotification({
        type: 'error',
        title: 'Falha ao salvar',
        message: 'Nao foi possivel salvar a exoneração.'
      });
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (record, nextStatus) => {
    if (!record) return;

    try {
      const updates = {
        status: nextStatus,
        updated_at: new Date().toISOString()
      };

      if (nextStatus === 'exonerado') {
        updates.finalized_at = new Date().toISOString();
        updates.finalized_by = user?.id || null;
      }

      const { data, error } = await supabase
        .from('exonerations')
        .update(updates)
        .eq('id', record.id)
        .select('*, exoneration_proofs(*)')
        .single();

      if (error) throw error;

      setSelectedRecord(data);
      setActiveTab(nextStatus === 'catalogado' ? 'catalogado' : nextStatus);
      await fetchRecords();
      setNotification({
        type: 'success',
        title: 'Status atualizado',
        message: nextStatus === 'exonerado'
          ? 'A exoneração foi concluida.'
          : 'O processo de exoneração foi cancelado.'
      });
    } catch (error) {
      console.error('Erro ao atualizar exoneração:', error);
      setNotification({
        type: 'error',
        title: 'Falha na acao',
        message: 'Nao foi possivel atualizar o status da exoneração.'
      });
    }
  };

  const selectedProofs = useMemo(
    () => selectedRecord?.exoneration_proofs || [],
    [selectedRecord]
  );

  return (
    <div className="space-y-6">
      <NotificationBanner notification={notification} onClose={() => setNotification(null)} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BadgeX className="text-red-500" />
            Exoneração
          </h1>
          <p className="text-slate-400 mt-1">
            Catalogue quem sera exonerado, organize provas com imagens e links e acompanhe o processo.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold transition-colors"
          >
            <Plus size={18} />
            Nova Exoneração
          </button>
        )}
      </div>

      <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('catalogado')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'catalogado' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Catalogados
            </button>
            <button
              onClick={() => setActiveTab('exonerado')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'exonerado' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Exonerados
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'all' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Todos
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">Nenhum registro encontrado.</div>
            ) : (
              records.map((record) => (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={`bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all hover:border-federal-500/50 hover:bg-slate-800 ${selectedRecord?.id === record.id ? 'border-federal-500 ring-1 ring-federal-500' : ''}`}
                >
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <StatusBadge status={record.status} />
                    <span className="text-xs text-slate-500">{formatDate(record.created_at)}</span>
                  </div>
                  <h3 className="font-bold text-white">{record.full_name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Passaporte: {record.passport_id}</p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{record.reason}</p>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Provas: {record.exoneration_proofs?.length || 0}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto">
          {selectedRecord ? (
            <div className="space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedRecord.full_name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                    <span>Passaporte: {selectedRecord.passport_id}</span>
                    <span>Cargo: {selectedRecord.role_name || '--'}</span>
                    <span>Setor: {selectedRecord.department || '--'}</span>
                  </div>
                </div>
                <StatusBadge status={selectedRecord.status} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Data da decisão</p>
                  <p className="text-white font-semibold">{formatDate(selectedRecord.decision_date)}</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Conclusão</p>
                  <p className="text-white font-semibold">{formatDate(selectedRecord.finalized_at)}</p>
                </div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-300 mb-2">Motivo</h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedRecord.reason}
                </p>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-300 mb-2">Observações</h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedRecord.notes || 'Sem observações adicionais.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-white">Provas anexadas</h3>
                  <span className="text-xs text-slate-500">{selectedProofs.length} prova(s)</span>
                </div>

                {selectedProofs.length > 0 ? (
                  <div className="grid xl:grid-cols-2 gap-4">
                    {selectedProofs.map((proof) => {
                      const isLink = proof.proof_type === 'link';
                      const isImage = !isLink && /\.(jpg|jpeg|png|gif|webp)$/i.test(proof.url || '');

                      return (
                        <div key={proof.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            {isLink ? <LinkIcon size={16} className="text-blue-400" /> : isImage ? <ImageIcon size={16} className="text-federal-400" /> : <FileText size={16} className="text-slate-400" />}
                            <p className="text-sm text-white font-semibold truncate">{proof.title || proof.file_name || 'Prova'}</p>
                          </div>

                          {isImage && (
                            <div className="bg-slate-900 rounded-xl border border-slate-800 p-2">
                              <img src={proof.url} alt={proof.title || proof.file_name || 'Prova'} className="w-full max-h-64 object-contain rounded-lg" />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => openExternalLink(proof.url)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
                          >
                            <ExternalLink size={16} />
                            Abrir prova
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma prova anexada.</p>
                )}
              </div>

              {canManage && selectedRecord.status === 'catalogado' && (
                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Ações</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => updateStatus(selectedRecord, 'exonerado')}
                      className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Confirmar Exoneração
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(selectedRecord, 'cancelado')}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg flex items-center gap-2"
                    >
                      <AlertTriangle size={16} />
                      Cancelar Processo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <BadgeX size={48} className="mb-4 opacity-20" />
              <p>Selecione um registro para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => !creating && setCreateOpen(false)}>
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">Nova Exoneração</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Cadastre o agente e anexe quantas provas forem necessárias.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !creating && setCreateOpen(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Nome</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(event) => handleFormInput('fullName', event.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Passaporte</label>
                  <input
                    type="text"
                    value={formData.passportId}
                    onChange={(event) => handleFormInput('passportId', event.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Cargo/Patente</label>
                  <input
                    type="text"
                    value={formData.roleName}
                    onChange={(event) => handleFormInput('roleName', event.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Setor</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(event) => handleFormInput('department', event.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Data da decisão</label>
                <input
                  type="date"
                  value={formData.decisionDate}
                  onChange={(event) => handleFormInput('decisionDate', event.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Motivo da exoneração</label>
                <textarea
                  value={formData.reason}
                  onChange={(event) => handleFormInput('reason', event.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Observações adicionais</label>
                <textarea
                  value={formData.notes}
                  onChange={(event) => handleFormInput('notes', event.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 resize-none"
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Adicionar imagens</label>
                  <label className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-red-600 transition-colors">
                    <Upload size={22} className="text-slate-500" />
                    <span className="text-slate-300 font-medium">Selecionar imagens</span>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Adicionar link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={linkInput}
                      onChange={(event) => setLinkInput(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addLinkProof())}
                      className="flex-1 px-4 py-4 bg-slate-950 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                      placeholder="Cole um link de prova"
                    />
                    <button
                      type="button"
                      onClick={addLinkProof}
                      disabled={!linkInput.trim()}
                      className="px-4 py-4 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {proofs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">Provas adicionadas</p>
                    <span className="text-xs text-slate-500">{proofs.length} item(s)</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {proofs.map((proof) => (
                      <div key={proof.id} className="relative bg-slate-950 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                        {proof.type === 'image' ? (
                          <img src={proof.preview} alt={proof.title} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                            <LinkIcon size={20} className="text-blue-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{proof.title}</p>
                          <p className="text-xs text-slate-500">{proof.type === 'image' ? 'Imagem' : 'Link'}</p>
                        </div>
                        <button type="button" onClick={() => removeProof(proof.id)} className="p-1 hover:bg-slate-800 rounded">
                          <X size={18} className="text-slate-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => !creating && setCreateOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Salvar catálogo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExonerationsManager;
