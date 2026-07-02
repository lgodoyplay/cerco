import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createLog } from '../utils/logger';
import { processImage, extractFilenameFromUrl, deleteUploadFile } from '../middlewares/uploadV2.middleware';
import { getImageUrl } from '../utils/urlHelper';

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

    // Processar imagens com Sharp (compressão + EXIF removal)
    let fotoRostoFilename: string | null = null;
    let fotoBolsaFilename: string | null = null;
    let fotoTabletFilename: string | null = null;
    let fotoAbordagemFilename: string | null = null;

    try {
      if (files?.['fotoRosto']?.[0]) {
        fotoRostoFilename = await processImage(files['fotoRosto'][0], userId);
      }
      if (files?.['fotoBolsa']?.[0]) {
        fotoBolsaFilename = await processImage(files['fotoBolsa'][0], userId);
      }
      if (files?.['fotoTablet']?.[0]) {
        fotoTabletFilename = await processImage(files['fotoTablet'][0], userId);
      }
      if (files?.['fotoAbordagem']?.[0]) {
        fotoAbordagemFilename = await processImage(files['fotoAbordagem'][0], userId);
      }
    } catch (imageError) {
      // Limpar arquivos já processados em caso de erro
      if (fotoRostoFilename) await deleteUploadFile(fotoRostoFilename);
      if (fotoBolsaFilename) await deleteUploadFile(fotoBolsaFilename);
      if (fotoTabletFilename) await deleteUploadFile(fotoTabletFilename);
      if (fotoAbordagemFilename) await deleteUploadFile(fotoAbordagemFilename);
      
      return res.status(400).json({ 
        error: `Erro ao processar imagens: ${(imageError as Error).message}` 
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
        fotoRosto: fotoRostoFilename ? getImageUrl(fotoRostoFilename) : null,
        fotoBolsa: fotoBolsaFilename ? getImageUrl(fotoBolsaFilename) : null,
        fotoTablet: fotoTabletFilename ? getImageUrl(fotoTabletFilename) : null,
        fotoAbordagem: fotoAbordagemFilename ? getImageUrl(fotoAbordagemFilename) : null,
      }
    });

    await createLog(userId, 'Prisão Efetuada', `Prisão de ${nomePreso} (Doc: ${documento}) - ${[fotoRostoFilename, fotoBolsaFilename, fotoTabletFilename, fotoAbordagemFilename].filter(Boolean).length} fotos`, req.ip);

    res.status(201).json({
      message: '✅ Prisão registrada com sucesso',
      arrest,
      imagesCount: [fotoRostoFilename, fotoBolsaFilename, fotoTabletFilename, fotoAbordagemFilename].filter(Boolean).length
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
