import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { broadcastInternalEvent } from '../websocket/socketServer';

const asString = (value: unknown): string => (typeof value === 'string' ? value : Array.isArray(value) && value.length ? value[0] : '');

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
      console.log('createServer', { userId, body: req.body });

      if (!userId) return res.status(401).json({ error: 'Não autorizado.' });

      const { name, icon_url } = req.body;
      const server = await prisma.server.create({
        data: {
          name,
          iconUrl: icon_url,
          ownerId: userId
        }
      });

      console.log('server created', server.id);

      try {
        await prisma.member.create({
          data: {
            serverId: server.id,
            userId
          }
        });
        console.log('member created');
      } catch (memberError) {
        console.error('member error', memberError);
      }

      return res.status(201).json(server);
    } catch (error: any) {
      console.error('Erro ao criar servidor:', error);
      return res.status(500).json({ error: 'Erro ao criar servidor.' });
    }
  },

  async listChannels(req: Request, res: Response) {
    try {
      const serverId = asString(req.params.id);
      const channels = await prisma.channel.findMany({
        where: { serverId },
        orderBy: { position: 'asc' }
      });
      return res.json(channels);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar canais.' });
    }
  },

  async createChannel(req: Request, res: Response) {
    try {
      const serverId = asString(req.params.id);
      const { name, type } = req.body;

      const channel = await prisma.channel.create({
        data: {
          serverId,
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
      const channelId = asString(req.params.id);
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { channelId },
          include: { author: { select: { id: true, nome: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.message.count({ where: { channelId } })
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
      const channelId = asString(req.params.id);
      const userId = (req as any).user?.id;
      const { content, attachments } = req.body;

      const message = await prisma.message.create({
        data: {
          channelId,
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
      const serverId = asString(req.params.id);
      const members = await prisma.member.findMany({
        where: { serverId },
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
