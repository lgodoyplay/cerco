import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg', 'application/pdf', 'text/plain', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const normalizedMime = file.mimetype?.toLowerCase() || '';
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.txt', '.mp4', '.mov', '.webm', '.mp3', '.wav', '.ogg'];

  if (!ALLOWED_MIMES.includes(normalizedMime) && !allowedExts.includes(ext)) {
    return cb(new Error(`❌ Tipo de arquivo não permitido. Aceitos: ${ALLOWED_MIMES.join(', ')}`));
  }

  cb(null, true);
};

const limits = {
  fileSize: MAX_FILE_SIZE,
  files: 10
};

export const upload = multer({ storage, fileFilter, limits });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const uploadToSupabaseBucket = async (file: Express.Multer.File, userId: string, filename: string) => {
  if (!supabase) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY não configurados');
  }

  const finalName = `${userId}-${filename}`;
  const processedBuffer = await sharp(file.buffer)
    .rotate()
    .webp({ quality: 80 })
    .toBuffer();

  const { error } = await supabase.storage.from('uploads').upload(finalName, processedBuffer, {
    contentType: 'image/webp',
    upsert: false,
    duplex: 'half'
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('uploads').getPublicUrl(finalName);
  return data.publicUrl;
};

export const processImage = async (file: Express.Multer.File, userId: string): Promise<string> => {
  try {
    if (!file.buffer) {
      throw new Error('Buffer do arquivo não encontrado');
    }

    const uniqueName = `${userId}-${uuid()}.webp`;
    if (supabase) {
      const processedBuffer = await sharp(file.buffer).rotate().webp({ quality: 80 }).toBuffer();
      const { error } = await supabase.storage.from('uploads').upload(uniqueName, processedBuffer, {
        contentType: 'image/webp',
        upsert: false,
        duplex: 'half'
      });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from('uploads').getPublicUrl(uniqueName);
      return data.publicUrl;
    }

    const filePath = path.join(UPLOAD_DIR, uniqueName);
    await sharp(file.buffer).rotate().webp({ quality: 80 }).toFile(filePath);
    return uniqueName;
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error);
    throw new Error(`Falha ao processar imagem: ${(error as Error).message}`);
  }
};

export const storeUploadedFile = async (file: Express.Multer.File, userId: string): Promise<string> => {
  try {
    if (!file.buffer) {
      throw new Error('Buffer do arquivo não encontrado');
    }

    const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
    const uniqueName = `${userId}-${uuid()}${ext}`;

    if (supabase) {
      const { error } = await supabase.storage.from('uploads').upload(uniqueName, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
        duplex: 'half'
      });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from('uploads').getPublicUrl(uniqueName);
      return data.publicUrl;
    }

    const filePath = path.join(UPLOAD_DIR, uniqueName);
    await fs.promises.writeFile(filePath, file.buffer);
    return uniqueName;
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo:', error);
    throw new Error(`Falha ao salvar arquivo: ${(error as Error).message}`);
  }
};

export const deleteUploadFile = async (filename: string | null): Promise<void> => {
  if (!filename) return;

  try {
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      if (!supabase) return;
      const url = new URL(filename);
      const key = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '');
      if (!key) return;
      const { error } = await supabase.storage.from('uploads').remove([key]);
      if (error) console.warn('⚠️ Erro ao deletar arquivo do Supabase:', error.message);
      return;
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (!filePath.startsWith(UPLOAD_DIR)) {
      throw new Error('Tentativa de acesso inválido');
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error);
  }
};

export const extractFilenameFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  const parts = url.split('/');
  return parts[parts.length - 1] || null;
};
