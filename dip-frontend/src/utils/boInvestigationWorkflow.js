import { jsPDF } from 'jspdf';

const getSupabaseClient = async () => {
  const module = await import('../lib/supabase.js');
  return module.supabase;
};

export const BO_PROCESS_STEPS = [
  {
    id: 'etapa_01',
    number: 1,
    title: 'Abertura da pasta e identificação inicial',
    description: 'Registrar BO, identificar o caso e reunir a coleta inicial das informações essenciais.',
    requiredDocs: ['BO cadastrado', 'Identificação inicial', 'Coleta inicial'],
    status: 'ativa'
  },
  {
    id: 'etapa_02',
    number: 2,
    title: 'Cenário e perícia',
    description: 'Mapear o ambiente, os elementos do fato e definir a necessidade de perícia, quando houver.',
    requiredDocs: ['Mapa do local', 'Avaliação do cenário', 'Necessidade de perícia'],
    status: 'bloqueada'
  },
  {
    id: 'etapa_03',
    number: 3,
    title: 'Testemunhas',
    description: 'Registrar versões dos fatos e depoimentos relevantes para a apuração.',
    requiredDocs: ['Lista de testemunhas', 'Depoimentos'],
    status: 'bloqueada'
  },
  {
    id: 'etapa_04',
    number: 4,
    title: 'Diligências',
    description: 'Executar verificações complementares, buscas e diligências necessárias.',
    requiredDocs: ['Plano de diligência', 'Resultado da diligência'],
    status: 'bloqueada'
  },
  {
    id: 'etapa_05',
    number: 5,
    title: 'Investigados',
    description: 'Estruturar envolvidos, vínculos e informações relevantes para a investigação.',
    requiredDocs: ['Lista de investigados', 'Vínculos e observações'],
    status: 'bloqueada'
  },
  {
    id: 'etapa_06',
    number: 6,
    title: 'Encerramento e conclusão final',
    description: 'Formalizar a conclusão, preservar o histórico e encerrar o processo de forma definitiva.',
    requiredDocs: ['Conclusão final', 'Arquivamento'],
    status: 'bloqueada'
  }
];

const localStorageKey = (boId) => `cerco_bo_investigation_${boId}`;

export const createDefaultWorkflow = (boId, bo = {}) => {
  const steps = BO_PROCESS_STEPS.map((step, index) => ({
    ...step,
    status: index === 0 ? 'ativa' : 'bloqueada',
    documents: step.requiredDocs.map((doc, docIndex) => ({
      id: `${step.id}-doc-${docIndex + 1}`,
      label: doc,
      uploaded: false,
      url: ''
    })),
    notes: '',
    completedAt: null
  }));

  return {
    id: `workflow-${boId}`,
    boId,
    titulo: bo?.descricao ? `Processo - ${bo.descricao.slice(0, 80)}` : 'Pasta Digital Investigativa',
    status: 'em_processo',
    etapaAtual: 1,
    steps,
    witnesses: [],
    involved: [],
    diligences: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    auditTrail: [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'Pasta digital criada',
        user: 'Sistema'
      }
    ]
  };
};

export const loadWorkflowForBo = (boId) => {
  if (!boId || typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(localStorageKey(boId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.error('Erro ao carregar workflow do BO:', error);
    return null;
  }
};

const hasSupabaseConfig = () => Boolean(
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const loadWorkflowFromSupabase = async (boId) => {
  if (!boId || !hasSupabaseConfig()) return null;

  try {
    const supabase = await getSupabaseClient();
    const { data: processoRows, error: processoError } = await supabase
      .from('bo_processos')
      .select('*')
      .eq('bo_id', boId)
      .limit(1);

    if (processoError) throw processoError;

    const processo = processoRows?.[0];
    if (!processo) return null;

    const [{ data: etapas = [] }, { data: testemunhas = [] }, { data: investigados = [] }, { data: diligencias = [] }, { data: auditoria = [] }] = await Promise.all([
      supabase.from('bo_processo_etapas').select('*').eq('processo_id', processo.id),
      supabase.from('bo_testemunhas').select('*').eq('processo_id', processo.id),
      supabase.from('bo_investigados').select('*').eq('processo_id', processo.id),
      supabase.from('bo_diligencias').select('*').eq('processo_id', processo.id),
      supabase.from('bo_auditoria').select('*').eq('processo_id', processo.id)
    ]);

    const steps = (etapas || []).sort((a, b) => Number(a.numero) - Number(b.numero)).map((step) => ({
      id: step.codigo || step.id,
      number: Number(step.numero),
      title: step.titulo,
      description: step.descricao || '',
      requiredDocs: Array.isArray(step.documentos) ? step.documentos.map((document) => document.label || document.nome || 'Documento') : [],
      status: step.status || 'bloqueada',
      documents: Array.isArray(step.documentos) ? step.documentos : [],
      notes: step.observacoes || '',
      completedAt: step.concluido_em || null
    }));

    return {
      id: processo.id,
      boId: boId,
      titulo: processo.titulo || 'Pasta Digital Investigativa',
      status: processo.status || 'em_processo',
      etapaAtual: Number(processo.etapa_atual || 1),
      steps: steps.length ? steps : createDefaultWorkflow(boId).steps,
      witnesses: (testemunhas || []).map((person) => ({ id: person.id, name: person.nome, document: person.documento || '', depoimento: person.depoimento || '' })),
      involved: (investigados || []).map((person) => ({ id: person.id, name: person.nome, document: person.documento || '', papel: person.papel || '', observacoes: person.observacoes || '' })),
      diligences: (diligencias || []).map((item) => ({ id: item.id, title: item.titulo, description: item.descricao || '', responsavel: item.responsavel || '', status: item.status || 'pendente' })),
      createdAt: processo.created_at || new Date().toISOString(),
      updatedAt: processo.updated_at || new Date().toISOString(),
      auditTrail: (auditoria || []).map((item) => ({
        id: item.id,
        timestamp: item.created_at || new Date().toISOString(),
        action: item.acao || 'Atualização do workflow',
        user: item.usuario_id || 'Sistema'
      }))
    };
  } catch (error) {
    console.error('Erro ao carregar workflow do Supabase:', error);
    return null;
  }
};

export const syncWorkflowToSupabase = async (boId, workflow) => {
  if (!boId || !workflow || !hasSupabaseConfig()) return workflow;

  try {
    const supabase = await getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const { data: processoRows, error: processoError } = await supabase
      .from('bo_processos')
      .select('id')
      .eq('bo_id', boId)
      .limit(1);

    if (processoError) throw processoError;

    let processoId = processoRows?.[0]?.id;

    if (!processoId) {
      const { data: insertedProcesso, error: insertError } = await supabase
        .from('bo_processos')
        .insert([
          {
            bo_id: boId,
            titulo: workflow.titulo || 'Pasta Digital Investigativa',
            status: workflow.status || 'em_processo',
            etapa_atual: Number(workflow.etapaAtual || 1),
            created_by: userData?.user?.id || null
          }
        ])
        .select('id')
        .single();

      if (insertError) throw insertError;
      processoId = insertedProcesso?.id;
    }

    if (!processoId) return workflow;

    const normalized = workflow.steps || createDefaultWorkflow(boId).steps;
    const stepPayload = normalized.map((step) => ({
      processo_id: processoId,
      numero: Number(step.number),
      codigo: step.id,
      titulo: step.title,
      descricao: step.description || '',
      status: step.status || 'bloqueada',
      documentos: Array.isArray(step.documents) ? step.documents : [],
      observacoes: step.notes || '',
      concluido_em: step.completedAt || null
    }));

    if (stepPayload.length) {
      const { error: stepError } = await supabase
        .from('bo_processo_etapas')
        .upsert(stepPayload, { onConflict: 'processo_id,numero' });

      if (stepError) throw stepError;
    }

    await supabase.from('bo_testemunhas').delete().eq('processo_id', processoId);
    await supabase.from('bo_investigados').delete().eq('processo_id', processoId);
    await supabase.from('bo_diligencias').delete().eq('processo_id', processoId);

    const witnesses = (workflow.witnesses || []).map((person) => ({
      processo_id: processoId,
      nome: person.name || 'Testeemunha',
      documento: person.document || '',
      depoimento: person.depoimento || ''
    }));

    const involved = (workflow.involved || []).map((person) => ({
      processo_id: processoId,
      nome: person.name || 'Investigado',
      documento: person.document || '',
      papel: person.papel || '',
      observacoes: person.observacoes || ''
    }));

    const diligences = (workflow.diligences || []).map((item) => ({
      processo_id: processoId,
      titulo: item.title || item.name || 'Diligência',
      descricao: item.description || '',
      responsavel: item.responsavel || '',
      status: item.status || 'pendente'
    }));

    if (witnesses.length) {
      const { error: witnessError } = await supabase.from('bo_testemunhas').insert(witnesses);
      if (witnessError) throw witnessError;
    }

    if (involved.length) {
      const { error: involvedError } = await supabase.from('bo_investigados').insert(involved);
      if (involvedError) throw involvedError;
    }

    if (diligences.length) {
      const { error: diligenceError } = await supabase.from('bo_diligencias').insert(diligences);
      if (diligenceError) throw diligenceError;
    }

    const { error: workflowError } = await supabase
      .from('bo_processos')
      .update({
        titulo: workflow.titulo || 'Pasta Digital Investigativa',
        status: workflow.status || 'em_processo',
        etapa_atual: Number(workflow.etapaAtual || 1),
        updated_at: new Date().toISOString()
      })
      .eq('id', processoId);

    if (workflowError) throw workflowError;

    const auditEntry = {
      processo_id: processoId,
      usuario_id: userData?.user?.id || null,
      acao: 'workflow_atualizado',
      detalhes: {
        bo_id: boId,
        etapa_atual: Number(workflow.etapaAtual || 1),
        status: workflow.status || 'em_processo',
        updated_at: new Date().toISOString()
      }
    };

    await supabase.from('bo_auditoria').insert([auditEntry]);

    const nextWorkflow = {
      ...workflow,
      updatedAt: new Date().toISOString(),
      auditTrail: [
        ...(workflow.auditTrail || []),
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Workflow sincronizado com Supabase',
          user: userData?.user?.email || 'Sistema'
        }
      ]
    };

    return nextWorkflow;
  } catch (error) {
    console.error('Erro ao sincronizar workflow com Supabase:', error);
    return workflow;
  }
};

export const saveWorkflowForBo = (boId, workflow) => {
  if (!boId || typeof window === 'undefined') return null;

  const next = {
    ...workflow,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(localStorageKey(boId), JSON.stringify(next));

  if (hasSupabaseConfig()) {
    syncWorkflowToSupabase(boId, next).catch(() => undefined);
  }

  return next;
};

export const generateBoInvestigationProcessPDF = (bo, workflow, user) => {
  if (!bo || !workflow) return false;

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PROCESSO INVESTIGATIVO - BO', pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`BO: ${bo.id}`, margin, y);
    doc.text(`Responsável: ${bo.policial_responsavel || user?.full_name || user?.nome || user?.username || 'Não informado'}`, pageWidth / 2, y);
    y += 8;
    doc.text(`Local: ${bo.localizacao || 'Não informado'}`, margin, y);
    doc.text(`Data do fato: ${bo.data_fato || 'Não informado'}`, pageWidth / 2, y);
    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.text('Resumo dos fatos', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(bo.descricao || 'Sem descrição.', pageWidth - margin * 2);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 5 + 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Etapas do processo', margin, y);
    y += 8;

    const stepEntries = (workflow.steps || []).filter((step) => step.status === 'concluida' || step.number === workflow.etapaAtual || step.number <= workflow.etapaAtual);

    stepEntries.forEach((step) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${step.number}. ${step.title}`, margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const notes = step.notes?.trim() ? step.notes.trim() : 'Sem observações registradas.';
      const wrappedNotes = doc.splitTextToSize(notes, pageWidth - margin * 2);
      doc.text(wrappedNotes, margin + 4, y);
      y += wrappedNotes.length * 4.5 + 6;

      if ((workflow.witnesses || []).length && step.number === 5) {
        const witnessText = (workflow.witnesses || []).map((w) => `- ${w.name || 'Testemunha'}: ${w.statement || 'Sem depoimento'}`).join('\n');
        const lines = doc.splitTextToSize(witnessText, pageWidth - margin * 2);
        doc.text(lines, margin + 4, y);
        y += lines.length * 4.5 + 6;
      }

      if ((workflow.diligences || []).length && step.number === 6) {
        const diligenceText = (workflow.diligences || []).map((d) => `- ${d.title || 'Diligência'}: ${d.plan || 'Sem plano registrado'}`).join('\n');
        const lines = doc.splitTextToSize(diligenceText, pageWidth - margin * 2);
        doc.text(lines, margin + 4, y);
        y += lines.length * 4.5 + 6;
      }
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Conclusão final', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const finalStepNumber = workflow.steps?.length ? workflow.steps[workflow.steps.length - 1].number : 1;
    const conclusion = (workflow.steps || []).find((step) => step.number === finalStepNumber)?.notes || 'Conclusão final não registrada.';
    const conclusionLines = doc.splitTextToSize(conclusion, pageWidth - margin * 2);
    doc.text(conclusionLines, margin, y);

    doc.save(`processo_bo_${bo.id}.pdf`);
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF do processo do BO:', error);
    return false;
  }
};

export const ensureWorkflowForBo = async (boId, bo = {}) => {
  if (!boId) return null;

  try {
    const remoteWorkflow = await loadWorkflowFromSupabase(boId);
    if (remoteWorkflow) {
      const cached = loadWorkflowForBo(boId);
      if (!cached || JSON.stringify(cached) !== JSON.stringify(remoteWorkflow)) {
        saveWorkflowForBo(boId, remoteWorkflow);
      }
      return remoteWorkflow;
    }

    const existing = loadWorkflowForBo(boId);
    if (existing) {
      const synced = await syncWorkflowToSupabase(boId, existing);
      return synced || existing;
    }

    const created = createDefaultWorkflow(boId, bo);
    return saveWorkflowForBo(boId, created);
  } catch (error) {
    console.error('Erro ao garantir workflow do BO:', error);
    const fallback = loadWorkflowForBo(boId) || createDefaultWorkflow(boId, bo);
    return saveWorkflowForBo(boId, fallback);
  }
};

export const advanceWorkflowStep = (boId, workflow) => {
  if (!workflow || !workflow.steps?.length) return workflow;

  const nextStageIndex = Math.min(workflow.etapaAtual, workflow.steps.length - 1);
  const nextSteps = workflow.steps.map((step, index) => {
    if (index < nextStageIndex) {
      return {
        ...step,
        status: 'concluida',
        completedAt: step.completedAt || new Date().toISOString(),
        documents: step.documents || []
      };
    }

    if (index === nextStageIndex) {
      return {
        ...step,
        status: 'concluida',
        completedAt: step.completedAt || new Date().toISOString(),
        documents: step.documents?.map((document) => ({
          ...document,
          uploaded: document.uploaded || true
        })) || step.documents || []
      };
    }

    if (index === nextStageIndex + 1 && workflow.etapaAtual < workflow.steps.length) {
      return {
        ...step,
        status: 'ativa',
        documents: step.documents || []
      };
    }

    return {
      ...step,
      status: 'bloqueada',
      documents: step.documents || []
    };
  });

  const nextNumber = Math.min(workflow.etapaAtual + 1, workflow.steps.length);
  const nextWorkflow = {
    ...workflow,
    status: 'em_processo',
    etapaAtual: nextNumber,
    steps: nextSteps,
    auditTrail: [
      ...(workflow.auditTrail || []),
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: `Etapa ${String(Math.min(workflow.etapaAtual, workflow.steps.length)).padStart(2, '0')} concluída`,
        user: 'Sistema'
      }
    ]
  };

  return saveWorkflowForBo(boId, nextWorkflow);
};

export const isStepUnlocked = (step, workflow) => {
  if (!workflow) return false;
  const stepIndex = workflow.steps?.findIndex((item) => item.id === step.id) ?? -1;
  if (stepIndex === -1) return false;
  if (stepIndex === 0) return true;
  return workflow.steps.slice(0, stepIndex).every((item) => item.status === 'concluida');
};

export const updateWorkflowStepDocument = (boId, workflow, stepNumber, documentId, nextValue) => {
  if (!workflow || !boId) return workflow;

  const nextWorkflow = {
    ...workflow,
    steps: workflow.steps.map((step) => {
      if (step.number !== stepNumber) return step;

      return {
        ...step,
        documents: (step.documents || []).map((document) => ({
          ...document,
          uploaded: document.id === documentId ? Boolean(nextValue ?? !document.uploaded) : document.uploaded
        }))
      };
    })
  };

  return saveWorkflowForBo(boId, nextWorkflow);
};

export const appendWorkflowEntry = (boId, workflow, type, entry) => {
  if (!workflow || !boId || !entry) return workflow;

  const keyMap = {
    witness: 'witnesses',
    involved: 'involved',
    diligence: 'diligences'
  };

  const key = keyMap[type] || 'witnesses';
  const nextWorkflow = {
    ...workflow,
    [key]: [...(workflow[key] || []), { ...entry, id: entry.id || `entry-${Date.now()}` }],
    auditTrail: [
      ...(workflow.auditTrail || []),
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: `${type === 'witness' ? 'Testemunha' : type === 'involved' ? 'Investigado' : 'Diligência'} registrada`,
        user: 'Sistema'
      }
    ]
  };

  return saveWorkflowForBo(boId, nextWorkflow);
};

export const updateWorkflowNote = (boId, workflow, stepNumber, value) => {
  if (!workflow || !boId) return workflow;

  const nextWorkflow = {
    ...workflow,
    steps: workflow.steps.map((step) => (step.number === stepNumber ? { ...step, notes: value } : step))
  };

  return saveWorkflowForBo(boId, nextWorkflow);
};
