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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const { orderBy, where } = buildQueryParams(req);

    const [bos, total] = await Promise.all([
      prisma.bO.findMany({
        include: { policial: { select: { nome: true } } },
        orderBy: orderBy,
        skip,
        take: limit,
        where
      }),
      prisma.bO.count({ where })
    ]);

    res.json({
      data: bos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar BOs' });
  }
};

function buildQueryParams(req: Request) {
  const where: any = {};
  const orderBy: any = { data: 'desc' };

  if (req.query.status) {
    where.status = req.query.status as string;
  }
  if (req.query.orderBy) {
    orderBy[req.query.orderBy as string] = (req.query.orderDir as string) || 'desc';
  }

  return { where, orderBy };
}
