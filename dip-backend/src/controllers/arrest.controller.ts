import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createLog } from '../utils/logger';

export const createArrest = async (req: Request, res: Response) => {
  try {
    const { nomePreso, documento, motivo, artigos, data, descricao, status } = req.body;
    // Assuming files are handled by multer and mapped
    // In a real scenario, we'd map req.files fields to database columns
    // For simplicity, let's assume if files are sent, we just pick the first one for each category if provided
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const fotoRosto = files?.['fotoRosto']?.[0]?.filename;
    // Other photos...

    const userId = (req as any).user.id;

    const arrest = await prisma.arrest.create({
      data: {
        nomePreso,
        documento,
        motivo,
        artigos,
        policialId: userId, // From auth middleware
        data: new Date(data),
        descricao,
        status: status || 'Preso',
        fotoRosto: fotoRosto ? `/uploads/${fotoRosto}` : null,
        // Add other photos logic here
      }
    });

    await createLog(userId, 'Prisão Efetuada', `Prisão de ${nomePreso} (Doc: ${documento})`, req.ip);

    res.status(201).json(arrest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar prisão' });
  }
};

export const listArrests = async (req: Request, res: Response) => {
  try {
    const arrests = await prisma.arrest.findMany({
      include: { policial: { select: { nome: true } } },
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
      include: { policial: { select: { nome: true } } }
    });
    if (!arrest) return res.status(404).json({ error: 'Prisão não encontrada' });
    res.json(arrest);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
  }
};
