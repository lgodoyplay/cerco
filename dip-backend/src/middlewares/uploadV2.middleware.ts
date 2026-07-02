import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';

// ======================== CONFIGURAÇÃO ========================
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Garantir que a pasta uploads existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ======================== MULTER STORAGE ========================
const storage = multer.memoryStorage(); // Armazenar em memória para processar com Sharp

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Validar tipo MIME
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error(`❌ Tipo de arquivo não permitido. Aceitos: ${ALLOWED_MIMES.join(', ')}`));
  }

  // Validar extensão (segurança extra)
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`❌ Extensão inválida: ${ext}`));
  }

  cb(null, true);
};

const limits = {
  fileSize: MAX_FILE_SIZE,
  files: 10 // Máximo de arquivos por request
};

export const upload = multer({
  storage,
  fileFilter,
  limits
});

// ======================== COMPRESSÃO E PROCESSAMENTO ========================
/**
 * Processa imagem: comprime, remove EXIF e salva como WebP
 * @param file Arquivo enviado pelo multer
 * @param userId ID do usuário (para organização)
 * @returns Nome do arquivo processado
 */
export const processImage = async (file: Express.Multer.File, userId: string): Promise<string> => {
  try {
    if (!file.buffer) {
      throw new Error('Buffer do arquivo não encontrado');
    }

    // Gerar nome único com UUID
    const uniqueName = `${userId}-${uuid()}.webp`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    // Processar com Sharp:
    // 1. Remover EXIF/metadata
    // 2. Converter para WebP
    // 3. Comprimir com quality 80
    await sharp(file.buffer)
      .rotate() // Remove EXIF automaticamente
      .webp({ quality: 80 })
      .toFile(filePath);

    console.log(`✅ Imagem processada: ${uniqueName}`);
    return uniqueName;
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error);
    throw error;
  }
};

/**
 * Deleta arquivo de upload
 * @param filename Nome do arquivo
 */
export const deleteUploadFile = async (filename: string | null): Promise<void> => {
  if (!filename) return;

  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // Segurança: Garantir que está dentro da pasta uploads
    if (!filePath.startsWith(UPLOAD_DIR)) {
      throw new Error('Tentativa de acesso inválido');
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Arquivo deletado: ${filename}`);
    }
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error);
    // Não falhar a requisição se arquivo não existe
  }
};

/**
 * Extrai nome do arquivo da URL
 */
export const extractFilenameFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  const parts = url.split('/');
  return parts[parts.length - 1];
};
