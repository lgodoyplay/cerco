import type { NextFunction, Request, Response } from 'express';

export const requireDashboardUser = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const dashboardUserId = req.headers['x-dashboard-user-id'];
  const allowAnon = process.env.DISCORD_ALLOW_ANON === 'true';

  if (allowAnon) {
    return next();
  }

  if (authHeader?.startsWith('Bearer ') || dashboardUserId) {
    return next();
  }

  return res.status(401).json({ error: 'Autenticação necessária para acessar o módulo Discord.' });
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
