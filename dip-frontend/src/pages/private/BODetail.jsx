import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, Edit3, FileText, MapPin, Printer, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSettingsContext } from '../../context/SettingsContext';
import { usePermissions } from '../../hooks/usePermissions';
import { generateProfessionalPDF } from '../../utils/pdfGeneratorPro';
import NotificationBanner from '../../components/feedback/NotificationBanner';
import { getPeopleList } from '../../utils/boHelpers';
import {
  advanceWorkflowStep,
  appendWorkflowEntry,
  ensureWorkflowForBo,
  generateBoInvestigationProcessPDF,
  isStepUnlocked,
  loadWorkflowForBo,
  loadWorkflowFromSupabase,
  saveWorkflowForBo,
  updateWorkflowNote,
  updateWorkflowStepDocument
} from '../../utils/boInvestigationWorkflow';

const BODetail = ({ variant = 'default' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { templates } = useSettingsContext();
  const { can } = usePermissions();
  const isInternal = variant === 'internal';
  const storageTable = isInternal ? 'boletins_internos' : 'boletins';
  const backPath = isInternal ? '/dashboard/bo-interno-list' : '/dashboard/bo-list';
  const editPath = isInternal ? '/dashboard/bo-interno' : '/dashboard/bo';

  const [bo, setBo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showDescription, setShowDescription] = useState(true);
  const [workflow, setWorkflow] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [newWitness, setNewWitness] = useState('');
  const [newWitnessStatement, setNewWitnessStatement] = useState('');
  const [newInvolved, setNewInvolved] = useState('');
  const [newInvolvedRole, setNewInvolvedRole] = useState('');
  const [newDiligence, setNewDiligence] = useState('');
  const [newDiligencePlan, setNewDiligencePlan] = useState('');

  const canManage = can('bo_manage');

  useEffect(() => {
    const fetchBo = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(storageTable)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setBo(data);
      } catch (error) {
        console.error('Erro ao carregar BO:', error);
        setNotification({
          type: 'error',
          message: error?.message || 'Nao foi possivel carregar os detalhes do BO.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBo();
  }, [id]);

  useEffect(() => {
    if (!bo?.id) return;

    const hydrateWorkflow = async () => {
      const remoteWorkflow = await loadWorkflowFromSupabase(bo.id);
      if (remoteWorkflow) {
        setWorkflow(remoteWorkflow);
        return;
      }

      const existingWorkflow = loadWorkflowForBo(bo.id);
      if (existingWorkflow) {
        setWorkflow(existingWorkflow);
        return;
      }

      const createdWorkflow = await ensureWorkflowForBo(bo.id, bo);
      setWorkflow(createdWorkflow);
    };

    hydrateWorkflow();
  }, [bo?.id, bo?.descricao]);

  useEffect(() => {
    if (!workflow?.steps?.length) return;
    const nextIndex = Math.min(currentStepIndex, workflow.steps.length - 1);
    if (nextIndex !== currentStepIndex) {
      setCurrentStepIndex(nextIndex);
    }
  }, [workflow, currentStepIndex]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const complainants = useMemo(
    () => getPeopleList(bo?.comunicantes_json, bo?.comunicante),
    [bo]
  );

  const reportedPeople = useMemo(
    () => getPeopleList(bo?.denunciados_json),
    [bo]
  );

  const handlePrint = async () => {
    if (!bo) return;
    try {
      await generateProfessionalPDF(
        bo,
        user,
        templates?.bo,
        'bo',
        templates?.__layoutConfig?.bo,
        templates?.__pageHeaderConfig
      );
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel gerar o PDF do BO.'
      });
    }
  };

  const updateWorkflowState = (updater) => {
    if (!bo?.id || !workflow) return;

    const nextWorkflow = typeof updater === 'function' ? updater(workflow) : updater;
    if (!nextWorkflow) return;

    const saved = saveWorkflowForBo(bo.id, nextWorkflow);
    setWorkflow(saved || nextWorkflow);
  };

  const currentStep = workflow?.steps?.[currentStepIndex] || null;

  const normalizeWorkflowStatus = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized.includes('resol')) return 'Resolvido';
    if (normalized.includes('process') || normalized.includes('andamento') || normalized.includes('aberto')) return 'Em processo';
    return 'Em processo';
  };

  const isWorkflowResolved = () => {
    const normalized = String(workflow?.status || '').trim().toLowerCase();
    return normalized.includes('resol') || normalized.includes('conclu');
  };

  const handleAdvanceWorkflow = () => {
    if (!bo?.id || !workflow || !currentStep || isWorkflowResolved()) return;

    const nextWorkflow = advanceWorkflowStep(bo.id, workflow);
    setWorkflow(nextWorkflow);
    setCurrentStepIndex((prev) => Math.min(prev + 1, (workflow.steps?.length || 1) - 1));
  };

  const handleToggleDocument = (stepNumber, documentId) => {
    if (!bo?.id || !workflow) return;
    const nextWorkflow = updateWorkflowStepDocument(bo.id, workflow, stepNumber, documentId);
    setWorkflow(nextWorkflow);
  };

  const handleWorkflowNote = (stepNumber, value) => {
    if (!bo?.id || !workflow) return;
    const nextWorkflow = updateWorkflowNote(bo.id, workflow, stepNumber, value);
    setWorkflow(nextWorkflow);
  };

  const handleAddWitness = () => {
    if (!bo?.id || !workflow || !newWitness.trim()) return;
    const nextWorkflow = appendWorkflowEntry(bo.id, workflow, 'witness', {
      name: newWitness.trim(),
      statement: newWitnessStatement.trim(),
      document: ''
    });
    setWorkflow(nextWorkflow);
    setNewWitness('');
    setNewWitnessStatement('');
  };

  const handleAddInvolved = () => {
    if (!bo?.id || !workflow || !newInvolved.trim()) return;
    const nextWorkflow = appendWorkflowEntry(bo.id, workflow, 'involved', {
      name: newInvolved.trim(),
      papel: newInvolvedRole.trim(),
      observacoes: ''
    });
    setWorkflow(nextWorkflow);
    setNewInvolved('');
    setNewInvolvedRole('');
  };

  const handleAddDiligence = () => {
    if (!bo?.id || !workflow || !newDiligence.trim()) return;
    const nextWorkflow = appendWorkflowEntry(bo.id, workflow, 'diligence', {
      title: newDiligence.trim(),
      plan: newDiligencePlan.trim(),
      status: 'pendente'
    });
    setWorkflow(nextWorkflow);
    setNewDiligence('');
    setNewDiligencePlan('');
  };

  const handleFinalizeWorkflow = async () => {
    if (!bo || !workflow) return;

    const lastStep = workflow.steps?.[workflow.steps.length - 1];
    const hasFinalConclusion = Boolean(lastStep?.notes?.trim());
    if (!hasFinalConclusion) {
      setNotification({ type: 'warning', message: 'Inclua uma conclusão final antes de encerrar o processo.' });
      setCurrentStepIndex(workflow.steps.length - 1);
      return;
    }

    const finalWorkflow = {
      ...workflow,
      status: 'resolvido',
      etapaAtual: workflow.steps.length,
      steps: (workflow.steps || []).map((step) => ({
        ...step,
        status: 'concluida',
        completedAt: step.completedAt || new Date().toISOString()
      })),
      updatedAt: new Date().toISOString()
    };

    const saved = saveWorkflowForBo(bo.id, finalWorkflow);
    setWorkflow(saved || finalWorkflow);
    setBo((previous) => (previous ? { ...previous, status: 'Resolvido' } : previous));

    try {
      await supabase.from(storageTable).update({ status: 'Resolvido', updated_at: new Date().toISOString() }).eq('id', bo.id);
    } catch (error) {
      console.error('Erro ao atualizar status do BO para resolvido:', error);
    }

    const generated = generateBoInvestigationProcessPDF(bo, saved || finalWorkflow, user);
    if (generated) {
      setNotification({ type: 'success', message: 'Processo finalizado e PDF gerado com sucesso.' });
    } else {
      setNotification({ type: 'error', message: 'Processo registrado, mas não foi possível gerar o PDF final.' });
    }
  };

  const handleReopenWorkflow = async () => {
    if (!bo || !workflow) return;

    const reopenedWorkflow = {
      ...workflow,
      status: 'em_processo',
      etapaAtual: Math.max(1, workflow.steps?.length || 1),
      steps: (workflow.steps || []).map((step, index) => ({
        ...step,
        status: index === (workflow.steps.length || 1) - 1 ? 'ativa' : index < (workflow.steps.length || 1) - 1 ? 'concluida' : 'bloqueada',
        completedAt: step.completedAt || (index < (workflow.steps.length || 1) - 1 ? new Date().toISOString() : null)
      })),
      updatedAt: new Date().toISOString()
    };

    const saved = saveWorkflowForBo(bo.id, reopenedWorkflow);
    setWorkflow(saved || reopenedWorkflow);
    setCurrentStepIndex((workflow.steps?.length || 1) - 1);
    setBo((previous) => (previous ? { ...previous, status: 'Em processo' } : previous));

    try {
      await supabase.from(storageTable).update({ status: 'Em processo', updated_at: new Date().toISOString() }).eq('id', bo.id);
    } catch (error) {
      console.error('Erro ao reabrir o processo do BO:', error);
    }

    setNotification({ type: 'success', message: 'Pasta reaberta com sucesso. O processo voltou para andamento.' });
  };

  const canAdvanceCurrentStep = () => {
    if (!currentStep) return false;

    if (currentStep.number === 5) {
      return (workflow?.witnesses || []).some((w) => w.name?.trim() && w.statement?.trim());
    }

    if (currentStep.number === 6) {
      return (workflow?.diligences || []).some((d) => d.title?.trim() && (d.plan || '').trim());
    }

    if (currentStep.number === 9 || currentStep.number === 10) {
      return Boolean(currentStep.notes?.trim());
    }

    return Boolean(currentStep.notes?.trim()) || (currentStep.documents || []).some((document) => document.uploaded || document.url);
  };

  return (
    <div className="space-y-6">
      <NotificationBanner notification={notification} onClose={() => setNotification(null)} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para BOs
          </button>
          <h2 className="mt-3 text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-federal-500" size={26} />
            Detalhes do BO
          </h2>
          <p className="text-slate-400 mt-1">Visualização completa do boletim de ocorrência em página própria.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!bo || loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-federal-600 hover:bg-federal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors"
          >
            <Printer size={18} />
            Imprimir BO
          </button>
          {canManage && bo && (
            <button
              type="button"
              onClick={() => navigate(`${editPath}/${bo.id}/edit`)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors"
            >
              <Edit3 size={18} />
              Editar BO
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
          Carregando detalhes do BO...
        </div>
      )}

      {!loading && !bo && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
          BO não encontrado.
        </div>
      )}

      {!loading && bo && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">ID do Registro</p>
              <p className="text-white font-mono text-sm break-all">{bo.id}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Data e Hora do Fato</p>
              <div className="flex items-center gap-2 text-slate-200">
                <Calendar size={16} className="text-federal-500" />
                {bo.data_fato && !isNaN(new Date(bo.data_fato).getTime())
                  ? format(new Date(bo.data_fato), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                  : 'Data inválida'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Status</p>
              <span className="px-3 py-1 rounded-lg text-sm font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {bo.status}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Local da Ocorrência</p>
              <p className="text-slate-300 flex items-center gap-2">
                <MapPin size={16} className="text-federal-500 shrink-0" />
                <span>{bo.localizacao || 'Nao informado'}</span>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <Shield size={20} className="text-federal-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Policial Responsável</p>
                  <p className="text-xs text-slate-400">{bo.policial_responsavel || 'Nao informado'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Comunicantes</h3>
              <div className="space-y-3">
                {complainants.map((person, index) => (
                  <div key={`complainant-${index}`} className="bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3">
                    <div className="flex items-start gap-3">
                      <User size={18} className="text-slate-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-white font-medium">{person.name || 'Nao informado'}</p>
                        {person.passport && (
                          <p className="text-xs text-slate-400 mt-1">Passaporte: {person.passport}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Pessoas Denunciadas</h3>
              <div className="space-y-3">
                {reportedPeople.length > 0 ? reportedPeople.map((person, index) => (
                  <div key={`reported-${index}`} className="bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                    <p className="text-white font-medium">{person.name || 'Nao informado'}</p>
                    {person.passport && (
                      <p className="text-xs text-red-200/80 mt-1">Passaporte: {person.passport}</p>
                    )}
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">Nenhuma pessoa denunciada informada.</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Pasta Digital Investigativa</p>
                  <h4 className="text-lg font-bold text-white mt-1">Fluxo do BO por etapas</h4>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                    disabled={!workflow || currentStepIndex === 0}
                    className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-300 disabled:opacity-40"
                  >
                    Etapa anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep?.number === workflow?.steps?.length) {
                        handleFinalizeWorkflow();
                        return;
                      }
                      handleAdvanceWorkflow();
                    }}
                    disabled={!workflow || !canAdvanceCurrentStep() || isWorkflowResolved()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold transition-colors"
                  >
                    {currentStep?.number === workflow?.steps?.length ? 'Concluir processo' : 'Avançar etapa'}
                  </button>
                  {workflow && isWorkflowResolved() && (
                    <button
                      type="button"
                      onClick={handleReopenWorkflow}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
                    >
                      Abrir novamente
                    </button>
                  )}
                </div>
              </div>

              {workflow ? (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                      <p className="text-white font-bold">{normalizeWorkflowStatus(workflow.status)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Etapa atual</p>
                      <p className="text-white font-bold">{(currentStep?.number || workflow.etapaAtual || 1)}/{workflow.steps.length || 10}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    {currentStep && (
                      <>
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-federal-500/15 text-federal-300 font-bold border border-federal-500/30">
                              {String(currentStep.number).padStart(2, '0')}
                            </span>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Etapa ativa</p>
                              <h5 className="text-lg font-bold text-white">{currentStep.title}</h5>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold uppercase">
                            {currentStep.status === 'concluida' ? 'Concluída' : 'Em andamento'}
                          </span>
                        </div>

                        <p className="text-sm text-slate-300 mb-4">{currentStep.description}</p>

                        {currentStep.number === 1 && (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Abertura da pasta</p>
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-200">
                                  <input type="checkbox" checked readOnly className="h-4 w-4 accent-emerald-500" />
                                  BO cadastrado
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-200">
                                  <input type="checkbox" checked readOnly className="h-4 w-4 accent-emerald-500" />
                                  Identificação e coleta inicial da ocorrência incluidas
                                </label>
                              </div>
                            </div>
                            <textarea
                              value={currentStep.notes || ''}
                              onChange={(event) => handleWorkflowNote(currentStep.number, event.target.value)}
                              placeholder="Descreva a abertura da pasta, o contexto e a identificação inicial do caso..."
                              className="w-full min-h-[110px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-federal-500"
                            />
                          </div>
                        )}

                        {currentStep.number === 2 && (
                          <div className="space-y-3">
                            <textarea
                              value={currentStep.notes || ''}
                              onChange={(event) => handleWorkflowNote(currentStep.number, event.target.value)}
                              placeholder="Descreva a coleta inicial, dados da vítima, local, horário, partes envolvidas e informações preliminares..."
                              className="w-full min-h-[120px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-federal-500"
                            />
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Documentos de apoio</p>
                              <div className="space-y-2">
                                {(currentStep.documents || []).map((document) => (
                                  <label key={document.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-300">
                                    <span>{document.label}</span>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(document.uploaded)}
                                      onChange={() => handleToggleDocument(currentStep.number, document.id)}
                                      className="h-4 w-4 accent-emerald-500"
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {currentStep.number === 3 && (
                          <div className="space-y-3">
                            <textarea
                              value={currentStep.notes || ''}
                              onChange={(event) => handleWorkflowNote(currentStep.number, event.target.value)}
                              placeholder="Descreva o cenário, perícia inicialmente necessária, vestígios, ambiente e elementos físicos relevantes..."
                              className="w-full min-h-[120px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-federal-500"
                            />
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">Necessidade de perícia</p>
                              <label className="flex items-center gap-2 text-sm text-slate-200">
                                <input type="checkbox" checked={Boolean(currentStep.documents?.some((item) => item.uploaded))} onChange={() => handleToggleDocument(currentStep.number, currentStep.documents?.[0]?.id || 'scenario-check')} className="h-4 w-4 accent-emerald-500" />
                                Cenário e perícia foram avaliados para este caso
                              </label>
                            </div>
                          </div>
                        )}

                        {currentStep.number === 4 && (
                          <div className="space-y-3">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">Catalogar provas digitais</p>
                              <div className="space-y-2">
                                {(currentStep.documents || []).map((document) => (
                                  <label key={document.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-300">
                                    <span>{document.label}</span>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(document.uploaded)}
                                      onChange={() => handleToggleDocument(currentStep.number, document.id)}
                                      className="h-4 w-4 accent-emerald-500"
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                            <textarea
                              value={currentStep.notes || ''}
                              onChange={(event) => handleWorkflowNote(currentStep.number, event.target.value)}
                              placeholder="Liste fotos, vídeos, áudios, links ou referências digitais da prova. Descreva origem, data e observação..."
                              className="w-full min-h-[120px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-federal-500"
                            />
                          </div>
                        )}

                        {currentStep.number === 5 && (
                          <div className="space-y-4">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">Registrar testemunhas</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  value={newWitness}
                                  onChange={(event) => setNewWitness(event.target.value)}
                                  placeholder="Nome da testemunha"
                                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-federal-500"
                                />
                                <input
                                  value={newWitnessStatement}
                                  onChange={(event) => setNewWitnessStatement(event.target.value)}
                                  placeholder="Depoimento da testemunha"
                                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-federal-500"
                                />
                              </div>
                              <button type="button" onClick={handleAddWitness} className="mt-3 rounded-lg bg-federal-600 hover:bg-federal-500 px-3 py-2 text-xs font-bold text-white">Adicionar testemunha</button>
                            </div>

                            <div className="space-y-3">
                              {(workflow.witnesses || []).length ? (
                                workflow.witnesses.map((item) => (
                                  <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                                    <div className="font-bold text-white mb-1">{item.name || 'Testemunha sem nome'}</div>
                                    <textarea
                                      value={item.statement || ''}
                                      onChange={(event) => updateWorkflowState((prev) => ({
                                        ...prev,
                                        witnesses: prev.witnesses.map((w) => w.id === item.id ? { ...w, statement: event.target.value } : w)
                                      }))}
                                      placeholder="Depoimento da testemunha..."
                                      className="w-full min-h-[80px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-federal-500"
                                    />
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500">Nenhuma testemunha registrada.</p>
                              )}
                            </div>
                          </div>
                        )}

                        {currentStep.number === 6 && (
                          <div className="space-y-4">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">Registrar diligências</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  value={newDiligence}
                                  onChange={(event) => setNewDiligence(event.target.value)}
                                  placeholder="Título da diligência"
                                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-federal-500"
                                />
                                <input
                                  value={newDiligencePlan}
                                  onChange={(event) => setNewDiligencePlan(event.target.value)}
                                  placeholder="Responsável / plano"
                                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-federal-500"
                                />
                              </div>
                              <button type="button" onClick={handleAddDiligence} className="mt-3 rounded-lg bg-federal-600 hover:bg-federal-500 px-3 py-2 text-xs font-bold text-white">Adicionar diligência</button>
                            </div>

                            <div className="space-y-3">
                              {(workflow.diligences || []).length ? (
                                workflow.diligences.map((item) => (
                                  <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                                    <div className="font-bold text-white mb-2">{item.title || 'Diligência'}</div>
                                    <textarea
                                      value={item.plan || ''}
                                      onChange={(event) => updateWorkflowState((prev) => ({
                                        ...prev,
                                        diligences: prev.diligences.map((d) => d.id === item.id ? { ...d, plan: event.target.value } : d)
                                      }))}
                                      placeholder="Escreva o plano, objetivo e resultado esperado da diligência..."
                                      className="w-full min-h-[90px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-federal-500"
                                    />
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500">Nenhuma diligência registrada.</p>
                              )}
                            </div>
                          </div>
                        )}

                        {currentStep.number === 7 && (
                          <div className="space-y-4">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">Registrar investigados</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  value={newInvolved}
                                  onChange={(event) => setNewInvolved(event.target.value)}
                                  placeholder="Nome do investigado"
                                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-federal-500"
                                />
                                <input
                                  value={newInvolvedRole}
                                  onChange={(event) => setNewInvolvedRole(event.target.value)}
                                  placeholder="Papel / vínculo"
                                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-federal-500"
                                />
                              </div>
                              <button type="button" onClick={handleAddInvolved} className="mt-3 rounded-lg bg-federal-600 hover:bg-federal-500 px-3 py-2 text-xs font-bold text-white">Adicionar investigado</button>
                            </div>

                            <div className="space-y-3">
                              {(workflow.involved || []).length ? (
                                workflow.involved.map((item) => (
                                  <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                                    <div className="font-bold text-white mb-1">{item.name || 'Investigado sem nome'}</div>
                                    <div className="text-xs text-slate-400 mb-2">{item.papel || 'Sem vínculo informado'}</div>
                                    <textarea
                                      value={item.observacoes || ''}
                                      onChange={(event) => updateWorkflowState((prev) => ({
                                        ...prev,
                                        involved: prev.involved.map((i) => i.id === item.id ? { ...i, observacoes: event.target.value } : i)
                                      }))}
                                      placeholder="Observações sobre vínculo, contatos e contexto..."
                                      className="w-full min-h-[80px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-federal-500"
                                    />
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500">Nenhum investigado registrado.</p>
                              )}
                            </div>
                          </div>
                        )}

                        {currentStep.number === 8 && (
                          <div className="space-y-3">
                            <textarea
                              value={currentStep.notes || ''}
                              onChange={(event) => handleWorkflowNote(currentStep.number, event.target.value)}
                              placeholder="Faça o confronto e o cruzamento de informações, relatos, provas e elementos objetivos..."
                              className="w-full min-h-[140px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-federal-500"
                            />
                          </div>
                        )}

                        {currentStep.number === 9 && (
                          <div className="space-y-3">
                            <textarea
                              value={currentStep.notes || ''}
                              onChange={(event) => handleWorkflowNote(currentStep.number, event.target.value)}
                              placeholder="Escreva a conclusão técnica com síntese das provas, depoimentos, diligências e fundamentos da análise..."
                              className="w-full min-h-[150px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-federal-500"
                            />
                            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-3 text-sm text-slate-300">
                              Obrigatório: anexar ao menos um documento ou texto conclusivo para encerrar esta etapa.
                            </div>
                          </div>
                        )}

                        {currentStep.number === 10 && (
                          <div className="space-y-3">
                            <textarea
                              value={currentStep.notes || ''}
                              onChange={(event) => handleWorkflowNote(currentStep.number, event.target.value)}
                              placeholder="Descreva o encerramento, a arquivação, a decisão final e os documentos que encerram o processo..."
                              className="w-full min-h-[150px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-federal-500"
                            />
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-200">
                              Ao concluir esta etapa, será gerado o PDF final do processo investigativo.
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400">Aguardando criação da pasta digital.</div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDescription((value) => !value)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Descrição</p>
                  <h4 className="text-lg font-bold text-white mt-1">Clique para visualizar os fatos</h4>
                </div>
                {showDescription ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
              </button>

              {showDescription && (
                <div className="px-6 pb-6">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 uppercase font-bold block mb-2">Descrição dos Fatos</span>
                    <p className="text-slate-300 whitespace-pre-wrap">{bo.descricao || 'Nao informado.'}</p>
                  </div>
                </div>
              )}
            </div>

            {bo.nome_policial_prisao && (
              <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                <span className="text-xs text-amber-400 uppercase font-bold block mb-1">Policial Responsável pela Prisão em Flagrante</span>
                <div className="text-white font-medium">{bo.nome_policial_prisao}</div>
                {bo.id_policial_prisao && (
                  <div className="text-amber-300 text-sm mt-1">ID/Distintivo: {bo.id_policial_prisao}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BODetail;
