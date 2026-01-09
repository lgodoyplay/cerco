import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getPublicWanted = async (req: Request, res: Response) => {
  try {
    const wanted = await prisma.wanted.findMany({
      where: { status: { not: 'Capturado' } }, // Show active wanted
      select: {
        id: true,
        nome: true,
        motivo: true,
        periculosidade: true,
        recompensa: true,
        fotoPrincipal: true,
        status: true
      },
      orderBy: { periculosidade: 'desc' }
    });
    res.json(wanted);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar procurados públicos' });
  }
};

export const getPublicArrests = async (req: Request, res: Response) => {
  try {
    const arrests = await prisma.arrest.findMany({
      orderBy: { data: 'desc' },
      take: 20, // Limit to recent 20
      select: {
        id: true,
        nomePreso: true,
        data: true,
        motivo: true,
        status: true,
        fotoRosto: true
      }
    });
    res.json(arrests);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar prisões públicas' });
  }
};
