/**
 * Upload middleware usando Supabase Storage
 * Alternativa ao disco local - escalável e com backup automático
 * 
 * Configuração no Supabase:
 * 1. Storage > Create bucket: "arrests"
 * 2. Storage > Create bucket: "wanted"
 * 3. Storage > Create bucket: "evidence"
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import type { Request } from 'express';

// ======================== SUPABASE CLIENT ========================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ SUPABASE_URL e SUPABASE_SERVICE_KEY obrigatórios para cloud storage');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ======================== BUCKETS ========================
const BUCKETS = {
  arrests: 'arrests',
  wanted: 'wanted',
  evidence: 'evidence',
  avatars: 'avatars'
};

// ======================== UPLOAD PARA SUPABASE ========================
/**
 * Upload de arquivo para Supabase Storage
 * @param file Arquivo em memória
 * @param userId ID do usuário
 * @param bucket Nome do bucket
 * @returns URL pública do arquivo
 */
export const uploadToSupabase = async (
  file: Express.Multer.File,
  userId: string,
  bucket: string = 'arrests'
): Promise<string> => {
  try {
    // Validar bucket
    if (!Object.values(BUCKETS).includes(bucket)) {
      throw new Error(`Bucket inválido: ${bucket}`);
    }

    // Processar imagem com Sharp
    let processedBuffer: Buffer;
    const fileName = `${userId}/${Date.now()}-${uuid()}.webp`;

    processedBuffer = await sharp(file.buffer)
      .rotate() // Remove EXIF
      .webp({ quality: 80 })
      .toBuffer();

    // Upload para Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, processedBuffer, {
        contentType: 'image/webp',
        upsert: false,
        duplex: 'half'
      });

    if (error) {
      throw new Error(`Erro Supabase: ${error.message}`);
    }

    // Gerar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`✅ Upload Supabase: ${bucket}/${fileName}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ Erro ao upload em Supabase:', error);
    throw error;
  }
};

/**
 * Deletar arquivo do Supabase
 */
export const deleteFromSupabase = async (publicUrl: string): Promise<void> => {
  try {
    if (!publicUrl) return;

    // Extrair path da URL pública
    const urlParts = publicUrl.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) return;

    const [bucketName, filePath] = urlParts[1].split('/').slice(0, 2).join('/').split('/').reduce((acc, val, idx) => {
      if (idx === 0) acc[0] = val;
      else acc[1] = acc[1] ? acc[1] + '/' + val : val;
      return acc;
    }, [] as string[]);

    if (!bucketName || !filePath) return;

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.warn(`⚠️ Erro ao deletar arquivo: ${error.message}`);
    } else {
      console.log(`🗑️ Arquivo deletado: ${publicUrl}`);
    }
  } catch (error) {
    console.error('❌ Erro ao deletar de Supabase:', error);
  }
};

/**
 * Upload para bucket específico (arrests, wanted, evidence)
 */
export const uploadArrestPhoto = (file: Express.Multer.File, userId: string) =>
  uploadToSupabase(file, userId, BUCKETS.arrests);

export const uploadWantedPhoto = (file: Express.Multer.File, userId: string) =>
  uploadToSupabase(file, userId, BUCKETS.wanted);

export const uploadEvidence = (file: Express.Multer.File, userId: string) =>
  uploadToSupabase(file, userId, BUCKETS.evidence);

export const uploadAvatar = (file: Express.Multer.File, userId: string) =>
  uploadToSupabase(file, userId, BUCKETS.avatars);
