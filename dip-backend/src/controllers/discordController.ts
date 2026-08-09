import type { Request, Response } from 'express';
import { discordBridgeService } from '../services/discordBridgeService';
import { broadcastDiscordEvent } from '../websocket/socketServer';

export const discordController = {
  async getGuilds(req: Request, res: Response) {
    try {
      const guilds = await discordBridgeService.getGuilds();
      return res.json(guilds);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar servidores do Discord.' });
    }
  },

  async getChannels(req: Request, res: Response) {
    try {
      const channels = await discordBridgeService.getChannels(req.params.guildId);
      return res.json(channels);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar canais do Discord.' });
    }
  },

  async getMembers(req: Request, res: Response) {
    try {
      const members = await discordBridgeService.getMembers(req.params.guildId);
      return res.json(members);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar membros do Discord.' });
    }
  },

  async getMessages(req: Request, res: Response) {
    try {
      const messages = await discordBridgeService.getMessages(req.params.channelId, {
        limit: Number(req.query.limit || 50),
        before: typeof req.query.before === 'string' ? req.query.before : undefined,
      });
      return res.json(messages);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar mensagens do Discord.' });
    }
  },

  async sendMessage(req: Request, res: Response) {
    try {
      const result = await discordBridgeService.sendMessage(req.params.channelId, req.body?.content || '', req.body?.attachments);
      if (!result) {
        return res.status(502).json({ error: 'Bot indisponível para enviar mensagem.' });
      }
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao enviar mensagem para o Discord.' });
    }
  },

  async getMember(req: Request, res: Response) {
    try {
      const member = await discordBridgeService.getMember(req.params.memberId);
      return res.json(member);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar perfil do membro.' });
    }
  },

  async getBotStatus(req: Request, res: Response) {
    try {
      const status = await discordBridgeService.getBotStatus();
      return res.json(status);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar status do bot.' });
    }
  },

  async handleBotEvent(req: Request, res: Response) {
    try {
      const event = req.body;
      if (!event?.type) {
        return res.status(400).json({ error: 'Evento inválido.' });
      }

      broadcastDiscordEvent(event);
      return res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao processar evento do bot.' });
    }
  },

  async addReaction(req: Request, res: Response) {
    try {
      const result = await discordBridgeService.addReaction(req.params.messageId, req.body?.emoji);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao adicionar reação.' });
    }
  },

  async removeReaction(req: Request, res: Response) {
    try {
      const result = await discordBridgeService.removeReaction(req.params.messageId, req.params.emoji);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao remover reação.' });
    }
  },
};
