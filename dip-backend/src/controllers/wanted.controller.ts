import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createLog } from '../utils/logger';
import { processImage, deleteUploadFile } from '../middlewares/uploadV2.middleware';
import { getImageUrl } from '../utils/urlHelper';

export const createWanted = async (req: Request, res: Response) => {
  try {
    const { nome, documento, motivo, periculosidade, recompensa, status, observacoes } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const userId = (req as any).user.id;

    // Validar campos obrigatórios
    if (!nome || !motivo || !periculosidade) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios faltando: nome, motivo, periculosidade' 
      });
    }

    // Processar foto principal
    let fotoPrincipalFilename: string | null = null;
    const processedFiles: string[] = [];

    try {
      if (files?.['fotoPrincipal']?.[0]) {
        fotoPrincipalFilename = await processImage(files['fotoPrincipal'][0], userId);
        processedFiles.push(fotoPrincipalFilename);
      }

      // Processar fotos adicionais
      const outrasFotosFilenames: string[] = [];
      if (files?.['outrasFotos']) {
        for (const file of files['outrasFotos']) {
          const filename = await processImage(file, userId);
          outrasFotosFilenames.push(filename);
          processedFiles.push(filename);
        }
      }

      // Criar registro de procurado
      const wanted = await prisma.wanted.create({
        data: {
          nome,
          documento: documento || null,
          motivo,
          periculosidade,
          recompensa: recompensa || null,
          status: status || 'Procurado',
          observacoes: observacoes || null,
          fotoPrincipal: fotoPrincipalFilename ? getImageUrl(fotoPrincipalFilename) : null,
          outrasFotos: outrasFotosFilenames.length > 0 ? JSON.stringify(outrasFotosFilenames.map(f => getImageUrl(f))) : null
        }
      });

      await createLog(userId, 'Novo Procurado', `Procurado cadastrado: ${nome} (Periculosidade: ${periculosidade}) - ${processedFiles.length} fotos`, req.ip);

      res.status(201).json({
        message: '✅ Procurado registrado com sucesso',
        wanted,
        imagesCount: processedFiles.length
      });
    } catch (imageError) {
      // Limpar arquivos já processados em caso de erro
      for (const filename of processedFiles) {
        await deleteUploadFile(filename);
      }
      
      return res.status(400).json({ 
        error: `Erro ao processar imagens: ${(imageError as Error).message}` 
      });
    }
  } catch (error) {
    console.error('❌ Erro ao registrar procurado:', error);
    res.status(500).json({ error: `Erro ao registrar procurado: ${(error as Error).message}` });
  }
};

export const listWanted = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    const orderBy: any = { createdAt: 'desc' };

    if (req.query.status) {
      where.status = req.query.status as string;
    }
    if (req.query.orderBy) {
      orderBy[req.query.orderBy as string] = (req.query.orderDir as string) || 'desc';
    }

    const [wanted, total] = await Promise.all([
      prisma.wanted.findMany({ where, orderBy, skip, take: limit }),
      prisma.wanted.count({ where })
    ]);

    res.json({
      data: wanted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar procurados' });
  }
};

export const getWanted = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const wanted = await prisma.wanted.findUnique({ where: { id } });
    if (!wanted) return res.status(404).json({ error: 'Procurado não encontrado' });
    res.json(wanted);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
  }
};
