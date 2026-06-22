import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../context/AuthContext';
import NotificationBanner from '../../../components/feedback/NotificationBanner';
import {
  ShieldAlert,
  CalendarClock,
  Plus,
  FileText,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';

const STATUS_STYLES = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  withdrawn: 'bg-red-500/10 text-red-300 border-red-500/20',
  expired: 'bg-orange-500/10 text-orange-300 border-orange-500/20'
};

const STATUS_LABELS = {
  active: 'Ativa',
  withdrawn: 'Retirada',
  expired: 'Vencida'
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

const getRenewalState = (measure) => {
  if (!measure) return null;
  if (measure.status !== 'active') return null;
  if (!measure.valid_until) return null;

  const diff = new Date(measure.valid_until).getTime() - Date.now();

  if (diff <= 0) {
    return {
      type: 'expired',
      title: 'Medida vencida',
      message: `A medida de ${measure.victim_name} venceu em ${formatDate(measure.valid_until)}.`
    };
  }

  if (diff <= 24 * 60 * 60 * 1000) {
    return {
      type: 'warning',
      title: 'Vence em 1 dia',
      message: `A medida de ${measure.victim_name} vence em ${formatDate(measure.valid_until)}.`
    };
  }

  return null;
};

const getMeasureStatus = (measure) => {
  if (!measure) return 'active';
  if (measure.status === 'withdrawn') return 'withdrawn';
  if (measure.valid_until && new Date(measure.valid_until).getTime() < Date.now()) return 'expired';
  return measure.status || 'active';
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-md text-xs font-bold border ${STATUS_STYLES[status] || STATUS_STYLES.active}`}>
    {STATUS_LABELS[status] || status}
  </span>
);

const createEmptyForm = () => ({
  victimName: '',
  victimPassport: '',
  victimPhone: '',
  aggressorName: '',
  aggressorPassport: '',
  authority: '',
  restrictions: '',
  details: '',
  validFrom: toInputDateValue(new Date()),
  validUntil: toInputDateValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  file: null
});

const ProtectiveMeasuresManager = () => {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canView = can('protective_measures_view');
  const canManage = can('protective_measures_manage');

  const [loading, setLoading] = useState(true);
  const [measures, setMeasures] = useState([]);
  const [selectedMeasure, setSelectedMeasure] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [renewalAlerts, setRenewalAlerts] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(createEmptyForm());

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  const syncExpiredMeasures = async () => {
    if (!canManage) return;

    try {
      await supabase
        .from('protective_measures')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'active')
        .lt('valid_until', new Date().toISOString());
    } catch (error) {
      console.error('Erro ao atualizar medidas vencidas:', error);
    }
  };

  const refreshRenewalAlerts = async () => {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('protective_measures')
        .select('id, victim_name, victim_passport, aggressor_name, aggressor_passport, valid_until, status, created_at')
        .eq('status', 'active')
        .gte('valid_until', now.toISOString())
        .lte('valid_until', tomorrow.toISOString())
        .order('valid_until', { ascending: true });

      if (error) throw error;

      setRenewalAlerts(data || []);
    } catch (error) {
      console.error('Erro ao carregar alertas de validade:', error);
      setRenewalAlerts([]);
    }
  };

  const fetchMeasures = async () => {
    if (!canView) return;

    setLoading(true);
    try {
      await syncExpiredMeasures();

      let query = supabase
        .from('protective_measures')
        .select('*, protective_measure_attachments(*)')
        .order('created_at', { ascending: false });

      if (activeTab === 'active') {
        query = query.eq('status', 'active');
      } else if (activeTab === 'withdrawn') {
        query = query.eq('status', 'withdrawn');
      } else if (activeTab === 'all') {
      }

      const { data, error } = await query;
      if (error) throw error;

      setMeasures(data || []);
      await refreshRenewalAlerts();

      if (selectedMeasure) {
        const refreshed = (data || []).find((m) => m.id === selectedMeasure.id);
        if (refreshed) setSelectedMeasure(refreshed);
      }
    } catch (error) {
      console.error('Erro ao carregar medidas protetivas:', error);
      setNotification({
        type: 'error',
        title: 'Falha ao carregar',
        message: 'Nao foi possivel carregar as medidas protetivas.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeasures();
  }, [activeTab]);

  useEffect(() => {
    if (!selectedMeasure) {
      setSelectedAttachment(null);
      return;
    }
    const attachment = selectedMeasure.protective_measure_attachments?.[0] || null;
    setSelectedAttachment(attachment);
  }, [selectedMeasure]);

  const handleOpenCreate = () => {
    setCreateForm(createEmptyForm());
    setCreateOpen(true);
    setNotification(null);
  };

  const handleCreateInput = (key, value) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!canManage) {
      setNotification({
        type: 'error',
        title: 'Sem permissao',
        message: 'Voce nao tem permissao para gerar medida protetiva.'
      });
      return;
    }

    if (!createForm.victimName || !createForm.victimPassport || !createForm.aggressorName || !createForm.aggressorPassport) {
      setNotification({
        type: 'warning',
        title: 'Campos obrigatorios',
        message: 'Preencha vitima e agressor (nome e passaporte).'
      });
      return;
    }

    if (!createForm.validFrom || !createForm.validUntil) {
      setNotification({
        type: 'warning',
        title: 'Validade',
        message: 'Informe o tempo de validade da medida (inicio e fim).'
      });
      return;
    }

    const validFromDate = new Date(`${createForm.validFrom}T00:00:00`);
    const validUntilDate = new Date(`${createForm.validUntil}T23:59:59`);

    if (Number.isNaN(validFromDate.getTime()) || Number.isNaN(validUntilDate.getTime()) || validUntilDate < validFromDate) {
      setNotification({
        type: 'warning',
        title: 'Validade invalida',
        message: 'A data final precisa ser maior que a data inicial.'
      });
      return;
    }

    if (!createForm.file) {
      setNotification({
        type: 'warning',
        title: 'Documento obrigatorio',
        message: 'Envie o documento em PDF, PNG ou JPG que foi dado em jogo.'
      });
      return;
    }

    const acceptedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!acceptedTypes.includes(createForm.file.type)) {
      setNotification({
        type: 'warning',
        title: 'Formato invalido',
        message: 'Formato permitido: PDF, PNG ou JPG.'
      });
      return;
    }

    setCreating(true);
    try {
      const measureId = crypto.randomUUID();

      const { error: insertError } = await supabase
        .from('protective_measures')
        .insert({
          id: measureId,
          status: 'active',
          victim_name: createForm.victimName,
          victim_passport: createForm.victimPassport,
          victim_phone: createForm.victimPhone || null,
          aggressor_name: createForm.aggressorName,
          aggressor_passport: createForm.aggressorPassport,
          authority: createForm.authority || null,
          restrictions: createForm.restrictions || null,
          details: createForm.details || null,
          valid_from: validFromDate.toISOString(),
          valid_until: validUntilDate.toISOString(),
          created_by: user?.id || null
        });

      if (insertError) throw insertError;

      const fileExt = createForm.file.name.split('.').pop();
      const storageFileName = `${measureId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('protective-measure-docs')
        .upload(storageFileName, createForm.file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('protective-measure-docs')
        .getPublicUrl(storageFileName);

      const { error: attachmentError } = await supabase
        .from('protective_measure_attachments')
        .insert({
          measure_id: measureId,
          url: publicUrlData.publicUrl,
          file_name: createForm.file.name,
          file_type: createForm.file.type,
          uploaded_by: user?.id || null
        });

      if (attachmentError) throw attachmentError;

      const { data: createdMeasure, error: fetchError } = await supabase
        .from('protective_measures')
        .select('*, protective_measure_attachments(*)')
        .eq('id', measureId)
        .single();

      if (fetchError) throw fetchError;

      setNotification({
        type: 'success',
        title: 'Medida criada',
        message: 'A medida protetiva foi salva com sucesso.'
      });
      setCreateOpen(false);
      setSelectedMeasure(createdMeasure);
      setActiveTab('active');
      await fetchMeasures();
    } catch (error) {
      console.error('Erro ao criar medida protetiva:', error);
      setNotification({
        type: 'error',
        title: 'Falha ao criar',
        message: 'Nao foi possivel salvar a medida protetiva.'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedMeasure) return;

    setWithdrawing(true);
    try {
      const { data: updated, error } = await supabase
        .from('protective_measures')
        .update({
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString(),
          withdrawn_by: user?.id || null,
          withdrawn_reason: withdrawReason || null
        })
        .eq('id', selectedMeasure.id)
        .select('*, protective_measure_attachments(*)')
        .single();

      if (error) throw error;

      setSelectedMeasure(updated);
      setNotification({
        type: 'success',
        title: 'Medida retirada',
        message: 'A medida protetiva foi retirada com sucesso.'
      });
      setWithdrawOpen(false);
      setWithdrawReason('');
      await fetchMeasures();
    } catch (error) {
      console.error('Erro ao retirar medida:', error);
      setNotification({
        type: 'error',
        title: 'Falha ao retirar',
        message: 'Nao foi possivel retirar a medida protetiva.'
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const selectedStatus = useMemo(() => getMeasureStatus(selectedMeasure), [selectedMeasure]);
  const selectedRenewalState = useMemo(() => getRenewalState(selectedMeasure), [selectedMeasure]);
  const selectedFileType = selectedAttachment?.file_type || '';
  const isImageAttachment = selectedFileType === 'image/png' || selectedFileType === 'image/jpeg';

  return (
    <div className="space-y-6">
      <NotificationBanner notification={notification} onClose={() => setNotification(null)} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-federal-500" />
            Medida Protetiva
          </h1>
          <p className="text-slate-400 mt-1">
            Gere medidas protetivas, anexe o documento oficial e gerencie a validade.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-federal-600 hover:bg-federal-500 text-white font-bold transition-colors"
          >
            <Plus size={18} />
            Nova Medida
          </button>
        )}
      </div>

      {renewalAlerts.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-300 font-bold mb-3">
            <CalendarClock size={18} />
            Medidas vencendo (hoje/amanha)
          </div>
          <div className="space-y-2">
            {renewalAlerts.map((measure) => (
              <button
                key={measure.id}
                type="button"
                onClick={() => {
                  setActiveTab('active');
                  setSelectedMeasure(measure);
                }}
                className="w-full text-left px-3 py-3 rounded-xl bg-slate-950/50 border border-amber-500/10 hover:border-amber-400/40 transition-colors"
              >
                <p className="text-sm text-white font-semibold">{measure.victim_name}</p>
                <p className="text-xs text-amber-200">
                  Valida ate {formatDate(measure.valid_until)}. Faltando 1 dia para vencer.
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'active' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Ativas
            </button>
            <button
              onClick={() => setActiveTab('withdrawn')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'withdrawn' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Retiradas
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === 'all' ? 'bg-federal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Todas
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-center py-10 text-slate-500 text-sm">Carregando...</div>
            ) : measures.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">Nenhuma medida encontrada.</div>
            ) : (
              measures.map((measure) => {
                const status = getMeasureStatus(measure);
                const renewalState = getRenewalState(measure);
                return (
                  <div
                    key={measure.id}
                    onClick={() => setSelectedMeasure(measure)}
                    className={`bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer transition-all hover:border-federal-500/50 hover:bg-slate-800 ${selectedMeasure?.id === measure.id ? 'border-federal-500 ring-1 ring-federal-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <StatusBadge status={status} />
                      <span className="text-xs text-slate-500">{formatDate(measure.created_at)}</span>
                    </div>
                    <h3 className="font-bold text-white mb-1">{measure.victim_name}</h3>
                    <p className="text-xs text-slate-400 mb-2">Vitima: {measure.victim_passport}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      Agressor: {measure.aggressor_name} ({measure.aggressor_passport})
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Valida ate: {formatDate(measure.valid_until)}
                    </p>
                    {renewalState?.type === 'warning' && (
                      <p className="text-[11px] text-amber-300 mt-2">
                        {renewalState.message}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto">
          {selectedMeasure ? (
            <div className="space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Medida Protetiva</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                    <span>Vitima: {selectedMeasure.victim_name} ({selectedMeasure.victim_passport})</span>
                    <span>Agressor: {selectedMeasure.aggressor_name} ({selectedMeasure.aggressor_passport})</span>
                  </div>
                </div>
                <StatusBadge status={selectedStatus} />
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

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Validade</p>
                  <p className="text-white font-semibold">
                    {formatDate(selectedMeasure.valid_from)} até {formatDate(selectedMeasure.valid_until)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Status: {STATUS_LABELS[selectedStatus] || selectedStatus}
                  </p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Contato</p>
                  <p className="text-white font-semibold">{selectedMeasure.victim_phone || '--'}</p>
                  <p className="text-xs text-slate-500 mt-2">Autoridade: {selectedMeasure.authority || '--'}</p>
                </div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-300 mb-2">Restricoes</h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedMeasure.restrictions || 'Nao informado.'}
                </p>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-300 mb-2">Detalhes</h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedMeasure.details || 'Nao informado.'}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300">Documento Oficial (PDF/PNG/JPG)</h3>
                {selectedAttachment ? (
                  <div className="space-y-3">
                    <a
                      href={selectedAttachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-federal-500 transition-colors"
                    >
                      <FileText className="text-federal-400" size={18} />
                      <span className="text-xs text-slate-300 truncate">{selectedAttachment.file_name}</span>
                    </a>
                    {isImageAttachment && (
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
                        <img
                          src={selectedAttachment.url}
                          alt="Documento da medida protetiva"
                          className="w-full max-h-[520px] object-contain rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum documento anexado.</p>
                )}
              </div>

              {selectedMeasure.status === 'withdrawn' && (
                <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-4">
                  <p className="text-sm text-red-200 font-bold">Medida retirada</p>
                  <p className="text-sm text-red-200/80 mt-1">
                    Retirada em {formatDate(selectedMeasure.withdrawn_at)}.
                  </p>
                  {selectedMeasure.withdrawn_reason && (
                    <p className="text-sm text-red-200/80 mt-2 whitespace-pre-wrap">
                      Motivo: {selectedMeasure.withdrawn_reason}
                    </p>
                  )}
                </div>
              )}

              {canManage && selectedMeasure.status === 'active' && (
                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Acoes</h3>
                  <button
                    type="button"
                    onClick={() => setWithdrawOpen(true)}
                    className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 text-sm font-bold rounded-lg flex items-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    Retirar Medida
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <ShieldAlert size={48} className="mb-4 opacity-20" />
              <p>Selecione uma medida para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => !creating && setCreateOpen(false)}
        >
          <div
            className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">Nova Medida Protetiva</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Preencha os dados e envie o documento oficial do jogo.
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

            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Nome da vitima</label>
                  <input
                    type="text"
                    value={createForm.victimName}
                    onChange={(e) => handleCreateInput('victimName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Passaporte da vitima</label>
                  <input
                    type="text"
                    value={createForm.victimPassport}
                    onChange={(e) => handleCreateInput('victimPassport', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Telefone da vitima</label>
                  <input
                    type="text"
                    value={createForm.victimPhone}
                    onChange={(e) => handleCreateInput('victimPhone', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Autoridade/Juizo</label>
                  <input
                    type="text"
                    value={createForm.authority}
                    onChange={(e) => handleCreateInput('authority', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Nome do agressor</label>
                  <input
                    type="text"
                    value={createForm.aggressorName}
                    onChange={(e) => handleCreateInput('aggressorName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Passaporte do agressor</label>
                  <input
                    type="text"
                    value={createForm.aggressorPassport}
                    onChange={(e) => handleCreateInput('aggressorPassport', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Valida a partir de</label>
                  <input
                    type="date"
                    value={createForm.validFrom}
                    onChange={(e) => handleCreateInput('validFrom', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Valida ate</label>
                  <input
                    type="date"
                    value={createForm.validUntil}
                    min={createForm.validFrom}
                    onChange={(e) => handleCreateInput('validUntil', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Restricoes da medida</label>
                <textarea
                  value={createForm.restrictions}
                  onChange={(e) => handleCreateInput('restrictions', e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 resize-none"
                  placeholder="Ex: Manter distancia minima, nao se aproximar, nao entrar em locais..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Detalhes adicionais</label>
                <textarea
                  value={createForm.details}
                  onChange={(e) => handleCreateInput('details', e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 resize-none"
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Documento oficial (obrigatorio)</label>
                <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center bg-slate-950/50 hover:border-federal-500/50 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    onChange={(e) => handleCreateInput('file', e.target.files?.[0] || null)}
                    className="hidden"
                    id="protective-measure-file"
                    required
                  />
                  <label htmlFor="protective-measure-file" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-500" />
                    <span className="text-sm text-slate-400">
                      Clique para enviar PDF, PNG ou JPG
                    </span>
                    {createForm.file?.name && (
                      <span className="text-xs text-slate-300 mt-2">{createForm.file.name}</span>
                    )}
                  </label>
                </div>
              </div>

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
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-federal-600 hover:bg-federal-500 text-white font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Salvar Medida
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {withdrawOpen && selectedMeasure && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => !withdrawing && setWithdrawOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">Retirar Medida</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Essa acao marca a medida como retirada e deixa registrada no historico.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !withdrawing && setWithdrawOpen(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <p className="text-sm text-slate-300 font-bold">Vitima</p>
                <p className="text-sm text-slate-400 mt-1">{selectedMeasure.victim_name} ({selectedMeasure.victim_passport})</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Motivo (opcional)</label>
                <textarea
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 resize-none"
                  placeholder="Ex: decisao judicial, acordo, revogacao solicitada..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => !withdrawing && setWithdrawOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {withdrawing ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Retirando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={18} />
                      Confirmar Retirada
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtectiveMeasuresManager;
