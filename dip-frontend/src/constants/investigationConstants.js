/**
 * CONSTANTES - INVESTIGAÇÃO
 * Use estes valores em vez de strings hardcoded
 */

export const INVESTIGATION_STATUS = {
  RASCUNHO: {
    value: 'Rascunho',
    label: '✏️ Rascunho',
    color: 'bg-slate-500',
    colorBadge: 'bg-slate-100 text-slate-800',
    description: 'Investigação em criação, ainda não iniciada'
  },
  EM_ANDAMENTO: {
    value: 'Em Andamento',
    label: '🔄 Em Andamento',
    color: 'bg-blue-600',
    colorBadge: 'bg-blue-100 text-blue-800',
    description: 'Investigação ativa, coletando provas'
  },
  AGUARDANDO_ANÁLISE: {
    value: 'Aguardando Análise',
    label: '⏳ Aguardando Análise',
    color: 'bg-amber-500',
    colorBadge: 'bg-amber-100 text-amber-800',
    description: 'Provas coletadas, aguardando análise'
  },
  CONCLUÍDA: {
    value: 'Concluída',
    label: '✅ Concluída',
    color: 'bg-emerald-600',
    colorBadge: 'bg-emerald-100 text-emerald-800',
    description: 'Análise concluída, aguardando finalização'
  },
  FINALIZADA: {
    value: 'Finalizada',
    label: '📋 Finalizada',
    color: 'bg-purple-600',
    colorBadge: 'bg-purple-100 text-purple-800',
    description: 'Investigação finalizada e entregue'
  },
  ARQUIVADA: {
    value: 'Arquivada',
    label: '📦 Arquivada',
    color: 'bg-gray-600',
    colorBadge: 'bg-gray-100 text-gray-800',
    description: 'Investigação arquivada'
  }
};

export const PRIORITY_LEVELS = {
  BAIXA: {
    value: 'Baixa',
    label: '🟢 Baixa',
    color: 'text-green-600',
    badge: 'bg-green-100 text-green-800',
    risk: 1
  },
  MÉDIA: {
    value: 'Média',
    label: '🟡 Média',
    color: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-800',
    risk: 5
  },
  ALTA: {
    value: 'Alta',
    label: '🔴 Alta',
    color: 'text-red-600',
    badge: 'bg-red-100 text-red-800',
    risk: 10
  }
};

export const INVESTIGATION_CATEGORIES = {
  CRIMINAL: {
    value: 'Criminal',
    label: '⚖️ Criminal',
    icon: '🚔',
    fields: ['tipo_crime', 'local_crime', 'data_crime', 'vitimas']
  },
  FINANCEIRA: {
    value: 'Financeira',
    label: '💰 Financeira',
    icon: '💳',
    fields: ['valor_envolvido', 'contas_bancarias', 'instituicoes']
  }
};

export const PROOF_TYPES = {
  IMAGEM: {
    value: 'Imagem',
    label: '📸 Imagem',
    icon: '🖼️',
    accept: 'image/*'
  },
  VIDEO: {
    value: 'Video',
    label: '🎥 Vídeo',
    icon: '🎬',
    accept: 'video/*'
  },
  DOCUMENTO: {
    value: 'Documento',
    label: '📄 Documento',
    icon: '📃',
    accept: '.pdf,.doc,.docx,.txt,.xlsx'
  },
  AUDIO: {
    value: 'Audio',
    label: '🔊 Áudio',
    icon: '🎙️',
    accept: 'audio/*'
  },
  LINK: {
    value: 'Link',
    label: '🔗 Link',
    icon: '🌐',
    accept: 'text/url'
  },
  TEXTO: {
    value: 'Texto',
    label: '✍️ Texto',
    icon: '📝',
    accept: 'text/plain'
  }
};

/**
 * Helper: Obter opções para Select
 */
export const getStatusOptions = () =>
  Object.values(INVESTIGATION_STATUS).map(s => ({
    value: s.value,
    label: s.label
  }));

export const getPriorityOptions = () =>
  Object.values(PRIORITY_LEVELS).map(p => ({
    value: p.value,
    label: p.label
  }));

export const getCategoryOptions = () =>
  Object.values(INVESTIGATION_CATEGORIES).map(c => ({
    value: c.value,
    label: c.label
  }));

export const getProofTypeOptions = () =>
  Object.values(PROOF_TYPES).map(p => ({
    value: p.value,
    label: p.label
  }));

/**
 * Helper: Obter cores/badges por valor
 */
export const getStatusBadge = (status) => {
  const found = Object.values(INVESTIGATION_STATUS).find(s => s.value === status);
  return found ? found.colorBadge : 'bg-gray-100 text-gray-800';
};

export const getPriorityBadge = (priority) => {
  const found = Object.values(PRIORITY_LEVELS).find(p => p.value === priority);
  return found ? found.badge : 'bg-gray-100 text-gray-800';
};

/**
 * Helper: Validar status
 */
export const isValidStatus = (status) =>
  Object.values(INVESTIGATION_STATUS).some(s => s.value === status);

export const isValidPriority = (priority) =>
  Object.values(PRIORITY_LEVELS).some(p => p.value === priority);

/**
 * Helper: Obter próximos status permitidos
 */
export const getNextStatusOptions = (currentStatus) => {
  const nextStatuses = {
    [INVESTIGATION_STATUS.RASCUNHO.value]: [
      INVESTIGATION_STATUS.EM_ANDAMENTO
    ],
    [INVESTIGATION_STATUS.EM_ANDAMENTO.value]: [
      INVESTIGATION_STATUS.AGUARDANDO_ANÁLISE
    ],
    [INVESTIGATION_STATUS.AGUARDANDO_ANÁLISE.value]: [
      INVESTIGATION_STATUS.CONCLUÍDA
    ],
    [INVESTIGATION_STATUS.CONCLUÍDA.value]: [
      INVESTIGATION_STATUS.FINALIZADA
    ],
    [INVESTIGATION_STATUS.FINALIZADA.value]: [
      INVESTIGATION_STATUS.ARQUIVADA
    ],
    [INVESTIGATION_STATUS.ARQUIVADA.value]: [] // Terminal state
  };

  return (nextStatuses[currentStatus] || []).map(s => ({
    value: s.value,
    label: s.label
  }));
};

/**
 * Helper: Validar transição de status
 */
export const isValidStatusTransition = (from, to) => {
  const nextStatuses = getNextStatusOptions(from);
  return nextStatuses.some(s => s.value === to);
};
