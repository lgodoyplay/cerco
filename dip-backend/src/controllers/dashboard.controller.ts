import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalPresos, totalProcurados, totalInvestigacoes, totalBos, totalUsuarios] = await Promise.all([
      prisma.arrest.count(),
      prisma.wanted.count({ where: { status: 'Procurado' } }),
      prisma.investigation.count({ where: { status: 'Em Andamento' } }),
      prisma.bO.count(),
      prisma.user.count({ where: { ativo: true } })
    ]);

    // Calcular variações (mockadas por enquanto ou calculadas se tiver histórico suficiente)
    // Para simplificar, retornamos os totais
    res.json({
      totalPresos,
      totalProcurados,
      totalInvestigacoes,
      totalBos,
      totalUsuarios
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.log.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            nome: true,
            patente: true
          }
        }
      }
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades recentes' });
  }
};
