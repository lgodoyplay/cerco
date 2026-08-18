import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const requireDashboardUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboardUserId = req.headers['x-dashboard-user-id'];
    const allowAnon = process.env.DISCORD_ALLOW_ANON === 'true';

    if (allowAnon || dashboardUserId) {
      const user = await prisma.user.findFirst({
        where: { login: typeof dashboardUserId === 'string' && dashboardUserId.trim() ? dashboardUserId.trim() : 'dashboard' }
      });

      if (!user) {
        return res.status(401).json({ error: 'Usuário do dashboard não encontrado.' });
      }

      (req as any).user = {
        id: user.id,
        login: user.login,
        role: 'authenticated'
      };
      return next();
    }

    return res.status(401).json({ error: 'Autenticação necessária para acessar o módulo Discord.' });
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ error: 'Erro de autenticação.' });
  }
};

export const requireBotSecret = (req: Request, res: Response, next: NextFunction) => {
  const provided = req.headers['x-bot-secret'];
  const expected = process.env.BOT_API_SECRET;

  if (!expected) {
    return res.status(500).json({ error: 'BOT_API_SECRET não configurado.' });
  }

  if (provided === expected) {
    return next();
  }

  return res.status(403).json({ error: 'Segredo inválido para comunicação bot/backend.' });
};
