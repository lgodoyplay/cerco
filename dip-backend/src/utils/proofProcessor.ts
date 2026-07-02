/**
 * PROCESSAMENTO E METADATA DE PROVAS
 * Extrai informações automáticas de arquivos de prova
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// ============================================
// VALIDAÇÃO DE PROVAS
// ============================================

export const validateProofFile = async (file, proofType) => {
  const errors = [];
  const warnings = [];

  // Tamanho máximo por tipo
  const maxSizeByType = {
    'Imagem': 50 * 1024 * 1024, // 50MB
    'Video': 500 * 1024 * 1024, // 500MB
    'Documento': 100 * 1024 * 1024, // 100MB
    'Audio': 200 * 1024 * 1024, // 200MB
    'Link': 0, // Sem arquivo
    'Texto': 10 * 1024 * 1024 // 10MB
  };

  // MIME types aceitos
  const acceptedMimes = {
    'Imagem': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    'Video': ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    'Documento': [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ],
    'Audio': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
    'Link': [], // Sem arquivo
    'Texto': ['text/plain']
  };

  if (!file && proofType !== 'Link') {
    errors.push('Arquivo é obrigatório para este tipo de prova');
  }

  if (file) {
    // Validar tamanho
    const maxSize = maxSizeByType[proofType] || 100 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      errors.push(`Arquivo muito grande (máx: ${sizeMB}MB)`);
    }

    // Validar MIME type
    const acceptedMimeList = acceptedMimes[proofType] || [];
    if (acceptedMimeList.length > 0 && !acceptedMimeList.includes(file.mimetype)) {
      errors.push(
        `Tipo de arquivo inválido. Aceitos: ${acceptedMimeList
          .map(m => m.split('/')[1])
          .join(', ')}`
      );
    }

    // Validação específica por tipo
    if (proofType === 'Imagem') {
      // Validação será feita após processamento
    } else if (proofType === 'Video') {
      // Poderia extrair duração com ffmpeg (opcional)
      warnings.push('Duração do vídeo será extraída automaticamente');
    } else if (proofType === 'Documento') {
      // Poderia extrair número de páginas
      warnings.push('Número de páginas será extraído automaticamente');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// ============================================
// EXTRAÇÃO DE METADATA - IMAGEM
// ============================================

export const extractImageMetadata = async (filePath) => {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    return {
      tipo_arquivo: 'Imagem',
      dimensoes: {
        largura: metadata.width,
        altura: metadata.height,
        area: (metadata.width * metadata.height) / (1024 * 1024) // em MP
      },
      formato: metadata.format,
      tamanho_arquivo: (await fs.stat(filePath)).size,
      tem_exif: !!metadata.exif,
      orientacao: metadata.orientation,
      colorspace: metadata.colorspace,
      hasAlpha: metadata.hasAlpha,
      isProgressive: metadata.isProgressive,
      density: metadata.density,
      // Gerar thumbnail automaticamente
      thumbnail: await image
        .resize(200, 200, { fit: 'cover' })
        .webp()
        .toBuffer()
        .then(b => b.toString('base64'))
    };
  } catch (error) {
    console.error('❌ Erro ao extrair metadata da imagem:', error);
    return {
      tipo_arquivo: 'Imagem',
      erro: error.message
    };
  }
};

// ============================================
// EXTRAÇÃO DE METADATA - DOCUMENTO
// ============================================

export const extractDocumentMetadata = async (filePath, mimeType) => {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();

    const metadata = {
      tipo_arquivo: 'Documento',
      extensao: ext,
      mime_type: mimeType,
      tamanho_arquivo: stats.size,
      tamanho_kb: (stats.size / 1024).toFixed(2),
      data_modificacao: stats.mtime,
      eh_pdf: mimeType === 'application/pdf'
    };

    // Para PDFs, poderia extrair número de páginas com pdf-parse
    // Deixando como commented-out pois requer dependência adicional
    /*
    if (mimeType === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const fileBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(fileBuffer);
      metadata.num_paginas = pdfData.numpages;
    }
    */

    return metadata;
  } catch (error) {
    console.error('❌ Erro ao extrair metadata do documento:', error);
    return {
      tipo_arquivo: 'Documento',
      erro: error.message
    };
  }
};

// ============================================
// EXTRAÇÃO DE METADATA - ÁUDIO
// ============================================

export const extractAudioMetadata = async (filePath, mimeType) => {
  try {
    const stats = await fs.stat(filePath);

    const metadata = {
      tipo_arquivo: 'Audio',
      mime_type: mimeType,
      tamanho_arquivo: stats.size,
      tamanho_mb: (stats.size / (1024 * 1024)).toFixed(2)
      // Duração seria extraída com ffmpeg-fluent (dependência adicional)
    };

    return metadata;
  } catch (error) {
    console.error('❌ Erro ao extrair metadata de áudio:', error);
    return {
      tipo_arquivo: 'Audio',
      erro: error.message
    };
  }
};

// ============================================
// EXTRAÇÃO DE METADATA - VÍDEO
// ============================================

export const extractVideoMetadata = async (filePath, mimeType) => {
  try {
    const stats = await fs.stat(filePath);

    const metadata = {
      tipo_arquivo: 'Video',
      mime_type: mimeType,
      tamanho_arquivo: stats.size,
      tamanho_mb: (stats.size / (1024 * 1024)).toFixed(2)
      // Resolução, duração, codec seria extraído com ffmpeg-fluent
    };

    return metadata;
  } catch (error) {
    console.error('❌ Erro ao extrair metadata de vídeo:', error);
    return {
      tipo_arquivo: 'Video',
      erro: error.message
    };
  }
};

// ============================================
// FUNÇÃO PRINCIPAL - PROCESSAR PROVA
// ============================================

export const processProofFile = async (file, proofType) => {
  try {
    // 1. Validar arquivo
    const validation = await validateProofFile(file, proofType);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    // 2. Extrair metadata conforme tipo
    let metadata = null;

    if (proofType === 'Imagem' && file) {
      metadata = await extractImageMetadata(file.path);
    } else if (proofType === 'Documento' && file) {
      metadata = await extractDocumentMetadata(file.path, file.mimetype);
    } else if (proofType === 'Audio' && file) {
      metadata = await extractAudioMetadata(file.path, file.mimetype);
    } else if (proofType === 'Video' && file) {
      metadata = await extractVideoMetadata(file.path, file.mimetype);
    } else if (proofType === 'Link') {
      metadata = {
        tipo_arquivo: 'Link',
        validacao: 'URL será validada'
      };
    } else if (proofType === 'Texto') {
      metadata = {
        tipo_arquivo: 'Texto',
        tamanho_arquivo: file?.size,
        mime_type: file?.mimetype
      };
    }

    return {
      success: true,
      metadata,
      warnings: validation.warnings,
      tamanho_arquivo: file?.size,
      nome_arquivo: file?.originalname,
      tipo_prova: proofType
    };
  } catch (error) {
    console.error('❌ Erro ao processar prova:', error);
    return {
      success: false,
      errors: [`Erro ao processar arquivo: ${error.message}`]
    };
  }
};

// ============================================
// VERIFICAR INTEGRIDADE
// ============================================

/**
 * Verificar se arquivo não foi corrompido/alterado
 * Usando hash SHA256
 */
export const calcularHashProva = async (filePath) => {
  const crypto = require('crypto');
  const fileBuffer = await fs.readFile(filePath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  return hash;
};

/**
 * Verificar integridade comparando com hash anterior
 */
export const verificarIntegridade = async (filePath, hashAnterior) => {
  const hashAtual = await calcularHashProva(filePath);
  return {
    integro: hashAtual === hashAnterior,
    hash_atual: hashAtual,
    hash_anterior: hashAnterior,
    alterado: hashAtual !== hashAnterior
  };
};

export default {
  validateProofFile,
  extractImageMetadata,
  extractDocumentMetadata,
  extractAudioMetadata,
  extractVideoMetadata,
  processProofFile,
  calcularHashProva,
  verificarIntegridade
};
