/**
 * VALIDAÇÃO DE INVESTIGAÇÕES - Backend
 * Previne dados inválidos, XSS, SQL Injection
 */

const INVESTIGATION_STATUS = {
  RASCUNHO: 'Rascunho',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO_ANÁLISE: 'Aguardando Análise',
  CONCLUÍDA: 'Concluída',
  FINALIZADA: 'Finalizada',
  ARQUIVADA: 'Arquivada'
};

const PRIORITY_LEVELS = {
  BAIXA: 'Baixa',
  MÉDIA: 'Média',
  ALTA: 'Alta'
};

const INVESTIGATION_CATEGORIES = {
  CRIMINAL: 'Criminal',
  FINANCEIRA: 'Financeira'
};

const PROOF_TYPES = {
  IMAGEM: 'Imagem',
  VIDEO: 'Video',
  DOCUMENTO: 'Documento',
  AUDIO: 'Audio',
  LINK: 'Link',
  TEXTO: 'Texto'
};

// ============================================
// SANITIZAÇÃO
// ============================================

const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, 1000)
    .replace(/[<>]/g, ''); // Remover < > para prevenir XSS básico
};

const sanitizeDescription = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, 5000)
    .replace(/[<>]/g, '');
};

// ============================================
// VALIDAÇÕES ESPECÍFICAS
// ============================================

const validateInvestigationCreate = (data) => {
  const errors = [];

  // Título
  if (!data.titulo || typeof data.titulo !== 'string') {
    errors.push('Título é obrigatório e deve ser texto');
  } else if (data.titulo.trim().length < 5) {
    errors.push('Título deve ter pelo menos 5 caracteres');
  } else if (data.titulo.trim().length > 200) {
    errors.push('Título não pode exceder 200 caracteres');
  }

  // Descrição
  if (!data.descricao || typeof data.descricao !== 'string') {
    errors.push('Descrição é obrigatória');
  } else if (data.descricao.trim().length < 10) {
    errors.push('Descrição deve ter pelo menos 10 caracteres');
  } else if (data.descricao.trim().length > 5000) {
    errors.push('Descrição não pode exceder 5000 caracteres');
  }

  // Prioridade
  if (!Object.values(PRIORITY_LEVELS).includes(data.prioridade)) {
    errors.push(`Prioridade deve ser: ${Object.values(PRIORITY_LEVELS).join(', ')}`);
  }

  // Status
  if (data.status && !Object.values(INVESTIGATION_STATUS).includes(data.status)) {
    errors.push(`Status inválido. Aceitos: ${Object.values(INVESTIGATION_STATUS).join(', ')}`);
  }

  // Categoria
  if (data.categoria && !Object.values(INVESTIGATION_CATEGORIES).includes(data.categoria)) {
    errors.push(`Categoria deve ser: ${Object.values(INVESTIGATION_CATEGORIES).join(', ')}`);
  }

  // Delegacia
  if (data.delegacia && typeof data.delegacia !== 'string') {
    errors.push('Delegacia deve ser texto');
  } else if (data.delegacia && data.delegacia.trim().length > 100) {
    errors.push('Delegacia não pode exceder 100 caracteres');
  }

  // Envolvidos
  if (data.envolvidos && typeof data.envolvidos !== 'string') {
    errors.push('Envolvidos deve ser texto');
  } else if (data.envolvidos && data.envolvidos.length > 2000) {
    errors.push('Envolvidos não pode exceder 2000 caracteres');
  }

  // Investigados JSON (múltiplas pessoas)
  if (data.investigados_json) {
    if (!Array.isArray(data.investigados_json)) {
      errors.push('Investigados deve ser um array');
    } else if (data.investigados_json.length > 100) {
      errors.push('Não pode ter mais de 100 investigados');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const validateInvestigationUpdate = (data) => {
  // Validar apenas campos que estão sendo atualizados
  const errors = [];

  if (data.titulo !== undefined) {
    if (typeof data.titulo !== 'string' || data.titulo.trim().length < 5) {
      errors.push('Título deve ter pelo menos 5 caracteres');
    } else if (data.titulo.length > 200) {
      errors.push('Título não pode exceder 200 caracteres');
    }
  }

  if (data.descricao !== undefined) {
    if (typeof data.descricao !== 'string' || data.descricao.trim().length < 10) {
      errors.push('Descrição deve ter pelo menos 10 caracteres');
    } else if (data.descricao.length > 5000) {
      errors.push('Descrição não pode exceder 5000 caracteres');
    }
  }

  if (data.prioridade !== undefined) {
    if (!Object.values(PRIORITY_LEVELS).includes(data.prioridade)) {
      errors.push(`Prioridade deve ser: ${Object.values(PRIORITY_LEVELS).join(', ')}`);
    }
  }

  if (data.status !== undefined) {
    if (!Object.values(INVESTIGATION_STATUS).includes(data.status)) {
      errors.push(`Status deve ser: ${Object.values(INVESTIGATION_STATUS).join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const validateProofCreate = (data) => {
  const errors = [];

  // Investigação ID
  if (!data.investigacao_id || typeof data.investigacao_id !== 'number') {
    errors.push('ID da investigação é obrigatório');
  }

  // Tipo de prova
  if (!Object.values(PROOF_TYPES).includes(data.tipo)) {
    errors.push(`Tipo de prova deve ser: ${Object.values(PROOF_TYPES).join(', ')}`);
  }

  // Conteúdo (URL ou texto)
  if (!data.conteudo || typeof data.conteudo !== 'string') {
    errors.push('Conteúdo/URL é obrigatório');
  } else if (data.conteudo.length > 2000) {
    errors.push('Conteúdo não pode exceder 2000 caracteres');
  }

  // Descrição
  if (data.descricao) {
    if (typeof data.descricao !== 'string') {
      errors.push('Descrição deve ser texto');
    } else if (data.descricao.length > 1000) {
      errors.push('Descrição não pode exceder 1000 caracteres');
    }
  }

  // URL validation para certos tipos
  if (['Video', 'Link'].includes(data.tipo)) {
    if (!isValidUrl(data.conteudo)) {
      errors.push('URL inválida para este tipo de prova');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const validateProofUpdate = (data) => {
  const errors = [];

  if (data.tipo !== undefined) {
    if (!Object.values(PROOF_TYPES).includes(data.tipo)) {
      errors.push(`Tipo de prova deve ser: ${Object.values(PROOF_TYPES).join(', ')}`);
    }
  }

  if (data.conteudo !== undefined) {
    if (!data.conteudo || data.conteudo.length > 2000) {
      errors.push('Conteúdo deve ter entre 1 e 2000 caracteres');
    }
  }

  if (data.descricao !== undefined && data.descricao.length > 1000) {
    errors.push('Descrição não pode exceder 1000 caracteres');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const validateNoteCreate = (data) => {
  const errors = [];

  if (!data.investigacao_id || typeof data.investigacao_id !== 'number') {
    errors.push('ID da investigação é obrigatório');
  }

  if (!data.conteudo || typeof data.conteudo !== 'string') {
    errors.push('Conteúdo da nota é obrigatório');
  } else if (data.conteudo.trim().length < 3) {
    errors.push('Nota deve ter pelo menos 3 caracteres');
  } else if (data.conteudo.length > 2000) {
    errors.push('Nota não pode exceder 2000 caracteres');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// UTILITÁRIOS
// ============================================

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ============================================
// EXPORTS
// ============================================

export {
  INVESTIGATION_STATUS,
  PRIORITY_LEVELS,
  INVESTIGATION_CATEGORIES,
  PROOF_TYPES,
  validateInvestigationCreate,
  validateInvestigationUpdate,
  validateProofCreate,
  validateProofUpdate,
  validateNoteCreate,
  sanitizeString,
  sanitizeDescription,
  isValidUrl
};
