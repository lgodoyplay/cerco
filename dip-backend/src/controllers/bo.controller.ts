import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createLog } from '../utils/logger';

export const createBO = async (req: Request, res: Response) => {
  try {
    const { comunicante, descricao, local, data } = req.body;
    const userId = (req as any).user.id;
    const bo = await prisma.bO.create({
      data: {
        comunicante,
        descricao,
        local,
        data: new Date(data),
        policialId: userId
      }
    });

    await createLog(userId, 'B.O. Registrado', `Ocorrência registrada: ${descricao.substring(0, 30)}...`, req.ip);

    res.status(201).json(bo);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar BO' });
  }
};

export const listBO = async (req: Request, res: Response) => {
  try {
    const bos = await prisma.bO.findMany({
      include: { policial: { select: { nome: true } } },
      orderBy: { data: 'desc' }
    });
    res.json(bos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar BOs' });
  }
};
