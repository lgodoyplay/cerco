import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { broadcastInternalEvent } from '../websocket/socketServer';

export const internalCommsController = {
  async listServers(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado.' });

      const servers = await prisma.server.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        },
        include: {
          members: {
            include: { user: { select: { id: true, nome: true } } }
          },
          channels: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json(servers);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar servidores.' });
    }
  },

  async createServer(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Não autorizado.' });

      const { name, icon_url } = req.body;
      const server = await prisma.server.create({
        data: {
          name,
          iconUrl: icon_url,
          ownerId: userId
        }
      });

      await prisma.member.create({
        data: {
          serverId: server.id,
          userId
        }
      });

      broadcastInternalEvent('server:created', server);
      return res.status(201).json(server);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar servidor.' });
    }
  },

  async listChannels(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const channels = await prisma.channel.findMany({
        where: { serverId: id },
        orderBy: { position: 'asc' }
      });
      return res.json(channels);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar canais.' });
    }
  },

  async createChannel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, type } = req.body;

      const channel = await prisma.channel.create({
        data: {
          serverId: id,
          name,
          type: type === 'voice' ? 'voice' : 'text'
        }
      });

      broadcastInternalEvent('channel:created', channel);
      return res.status(201).json(channel);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar canal.' });
    }
  },

  async listMessages(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { channelId: id },
          include: { author: { select: { id: true, nome: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.message.count({ where: { channelId: id } })
      ]);

      return res.json({
        data: messages.reverse(),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    }
  },

  async createMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const { content, attachments } = req.body;

      const message = await prisma.message.create({
        data: {
          channelId: id,
          userId,
          content,
          attachments
        },
        include: { author: { select: { id: true, nome: true } } }
      });

      broadcastInternalEvent('message:new', message);
      return res.status(201).json(message);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    }
  },

  async listMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const members = await prisma.member.findMany({
        where: { serverId: id },
        include: { user: { select: { id: true, nome: true, cargo: true, patente: true } } }
      });
      return res.json(members);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar membros.' });
    }
  },

  async joinVoice(req: Request, res: Response) {
    try {
      const { channel_id } = req.body;
      const userId = (req as any).user?.id;

      const session = await prisma.voiceSession.create({
        data: { channelId: channel_id, userId }
      });

      broadcastInternalEvent('voice:joined', { channelId: channel_id, userId, sessionId: session.id });
      return res.status(201).json(session);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao entrar no canal de voz.' });
    }
  },

  async leaveVoice(req: Request, res: Response) {
    try {
      const { channel_id } = req.body;
      const userId = (req as any).user?.id;

      await prisma.voiceSession.updateMany({
        where: { channelId: channel_id, userId, leftAt: null },
        data: { leftAt: new Date() }
      });

      broadcastInternalEvent('voice:left', { channelId: channel_id, userId });
      return res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao sair do canal de voz.' });
    }
  },

  async getBotStatus(req: Request, res: Response) {
    return res.json({ status: 'internal', uptime: process.uptime() });
  }
};
