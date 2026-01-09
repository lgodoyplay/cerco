import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createLog } from '../utils/logger';

export const createWanted = async (req: Request, res: Response) => {
  try {
    const { nome, documento, motivo, periculosidade, recompensa, status, observacoes } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const fotoPrincipal = files?.['fotoPrincipal']?.[0]?.filename;

    const wanted = await prisma.wanted.create({
      data: {
        nome,
        documento,
        motivo,
        periculosidade,
        recompensa,
        status: status || 'Procurado',
        observacoes,
        fotoPrincipal: fotoPrincipal ? `/uploads/${fotoPrincipal}` : null
      }
    });

    const userId = (req as any).user.id;
    await createLog(userId, 'Novo Procurado', `Procurado cadastrado: ${nome} (Periculosidade: ${periculosidade})`, req.ip);

    res.status(201).json(wanted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar procurado' });
  }
};

export const listWanted = async (req: Request, res: Response) => {
  try {
    const wanted = await prisma.wanted.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(wanted);
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
