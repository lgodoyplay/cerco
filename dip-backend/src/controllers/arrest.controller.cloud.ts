/**
 * ARREST CONTROLLER - Versão com Supabase Storage (Cloud)
 * 
 * Para usar esta versão:
 * 1. Configurar .env com SUPABASE_URL e SUPABASE_SERVICE_KEY
 * 2. Criar 3 buckets no Supabase: arrests, wanted, evidence
 * 3. Substituir import em arrest.routes.ts
 * 
 * Benefícios:
 * - Backup automático
 * - Escalável (sem limite de disco)
 * - CDN global
 * - Versionamento automático
 */

import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createLog } from '../utils/logger';
import { uploadArrestPhoto, deleteFromSupabase } from '../utils/supabaseStorage';

export const createArrest = async (req: Request, res: Response) => {
  try {
    const { nomePreso, documento, motivo, artigos, data, descricao, status } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const userId = (req as any).user.id;

    // Validar campos obrigatórios
    if (!nomePreso || !documento || !motivo || !data) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios faltando: nomePreso, documento, motivo, data' 
      });
    }

    // Upload de imagens para Supabase Storage
    let fotoRostoUrl: string | null = null;
    let fotoBolsaUrl: string | null = null;
    let fotoTabletUrl: string | null = null;
    let fotoAbordagemUrl: string | null = null;

    try {
      if (files?.['fotoRosto']?.[0]) {
        fotoRostoUrl = await uploadArrestPhoto(files['fotoRosto'][0], userId);
      }
      if (files?.['fotoBolsa']?.[0]) {
        fotoBolsaUrl = await uploadArrestPhoto(files['fotoBolsa'][0], userId);
      }
      if (files?.['fotoTablet']?.[0]) {
        fotoTabletUrl = await uploadArrestPhoto(files['fotoTablet'][0], userId);
      }
      if (files?.['fotoAbordagem']?.[0]) {
        fotoAbordagemUrl = await uploadArrestPhoto(files['fotoAbordagem'][0], userId);
      }
    } catch (uploadError) {
      // Limpar uploads bem-sucedidos em caso de erro
      if (fotoRostoUrl) await deleteFromSupabase(fotoRostoUrl);
      if (fotoBolsaUrl) await deleteFromSupabase(fotoBolsaUrl);
      if (fotoTabletUrl) await deleteFromSupabase(fotoTabletUrl);
      if (fotoAbordagemUrl) await deleteFromSupabase(fotoAbordagemUrl);
      
      return res.status(400).json({ 
        error: `Erro ao fazer upload de imagens: ${(uploadError as Error).message}` 
      });
    }

    // Criar registro de prisão
    const arrest = await prisma.arrest.create({
      data: {
        nomePreso,
        documento,
        motivo,
        artigos,
        policialId: userId,
        data: new Date(data),
        descricao: descricao || '',
        status: status || 'Preso',
        fotoRosto: fotoRostoUrl,
        fotoBolsa: fotoBolsaUrl,
        fotoTablet: fotoTabletUrl,
        fotoAbordagem: fotoAbordagemUrl,
      }
    });

    const photoCount = [fotoRostoUrl, fotoBolsaUrl, fotoTabletUrl, fotoAbordagemUrl].filter(Boolean).length;

    await createLog(
      userId, 
      'Prisão Efetuada', 
      `Prisão de ${nomePreso} (Doc: ${documento}) - ${photoCount} fotos no cloud`, 
      req.ip
    );

    res.status(201).json({
      message: '✅ Prisão registrada com sucesso no cloud storage',
      arrest,
      imagesCount: photoCount,
      storage: '☁️ Supabase (Backup automático)'
    });
  } catch (error) {
    console.error('❌ Erro ao registrar prisão:', error);
    res.status(500).json({ error: `Erro ao registrar prisão: ${(error as Error).message}` });
  }
};

export const listArrests = async (req: Request, res: Response) => {
  try {
    const arrests = await prisma.arrest.findMany({
      include: { policial: { select: { nome: true, patente: true } } },
      orderBy: { data: 'desc' }
    });
    res.json(arrests);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar prisões' });
  }
};

export const getArrest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const arrest = await prisma.arrest.findUnique({
      where: { id },
      include: { policial: { select: { nome: true, patente: true, cargo: true } } }
    });
    if (!arrest) return res.status(404).json({ error: 'Prisão não encontrada' });
    res.json(arrest);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
  }
};

/**
 * DELETE com limpeza de arquivos Supabase
 */
export const deleteArrest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Buscar arrest para limpar arquivos
    const arrest = await prisma.arrest.findUnique({ where: { id } });
    if (!arrest) {
      return res.status(404).json({ error: 'Prisão não encontrada' });
    }

    // Deletar arquivos do Supabase
    if (arrest.fotoRosto) await deleteFromSupabase(arrest.fotoRosto);
    if (arrest.fotoBolsa) await deleteFromSupabase(arrest.fotoBolsa);
    if (arrest.fotoTablet) await deleteFromSupabase(arrest.fotoTablet);
    if (arrest.fotoAbordagem) await deleteFromSupabase(arrest.fotoAbordagem);

    // Deletar registro
    await prisma.arrest.delete({ where: { id } });

    await createLog(userId, 'Prisão Deletada', `Prisão ${id} e imagens removidas`, req.ip);

    res.json({ message: '✅ Prisão deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar prisão:', error);
    res.status(500).json({ error: 'Erro ao deletar prisão' });
  }
};
