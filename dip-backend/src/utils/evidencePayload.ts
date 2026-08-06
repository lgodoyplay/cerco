import { sanitizeDescription } from './investigationValidator';

export const normalizeProofType = (type: string | undefined | null = '') => {
  const value = String(type || '').trim().toLowerCase();
  const normalized: Record<string, string> = {
    imagem: 'Imagem',
    image: 'Imagem',
    foto: 'Imagem',
    fotografia: 'Imagem',
    video: 'Video',
    vídeo: 'Video',
    documento: 'Documento',
    arquivo: 'Documento',
    audio: 'Audio',
    link: 'Link',
    texto: 'Texto'
  };

  return normalized[value] || value;
};

export const isValidInvestigationId = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return typeof value === 'number' && Number.isFinite(value);
};

export const buildEvidencePayload = async ({
  investigationId,
  tipo,
  descricao,
  conteudo,
  file,
  userId
}: {
  investigationId: unknown;
  tipo?: string;
  descricao?: string;
  conteudo?: string;
  file?: Express.Multer.File;
  userId: string;
}) => {
  const normalizedType = normalizeProofType(tipo);
  const normalizedContent = typeof conteudo === 'string' ? conteudo.trim() : '';
  const normalizedDescription = typeof descricao === 'string' ? sanitizeDescription(descricao) : '';

  if (!isValidInvestigationId(investigationId)) {
    throw new Error('ID da investigação inválido');
  }

  if (!['Imagem', 'Video', 'Documento', 'Audio', 'Link', 'Texto'].includes(normalizedType)) {
    throw new Error('Tipo de prova inválido');
  }

  const requiresFile = !['Link', 'Texto'].includes(normalizedType);
  if (requiresFile && !file) {
    throw new Error('Arquivo obrigatório para este tipo de prova');
  }

  if (normalizedType === 'Link') {
    if (!normalizedContent) {
      throw new Error('URL obrigatória para provas do tipo Link');
    }

    return {
      tipo: normalizedType,
      descricao: normalizedDescription,
      conteudo: normalizedContent
    };
  }

  if (normalizedType === 'Texto') {
    if (!normalizedContent) {
      throw new Error('Texto obrigatório para provas do tipo Texto');
    }

    return {
      tipo: normalizedType,
      descricao: normalizedDescription,
      conteudo: normalizedContent
    };
  }

  const { processImage, storeUploadedFile } = await import('../middlewares/uploadV2.middleware');
  const { getImageUrl } = await import('../utils/urlHelper');

  const filename = normalizedType === 'Imagem'
    ? await processImage(file as Express.Multer.File, userId)
    : await storeUploadedFile(file as Express.Multer.File, userId);

  return {
    tipo: normalizedType,
    descricao: normalizedDescription,
    conteudo: getImageUrl(filename)
  };
};
