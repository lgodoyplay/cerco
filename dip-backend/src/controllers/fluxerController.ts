import type { Request, Response } from 'express';
import { fluxerApi, fluxerGateway, broadcastFluxerGatewayEvent } from '../services/fluxer';
import { discordBridgeService } from '../services/discordBridgeService';

const asString = (value: unknown): string => (typeof value === 'string' ? value : Array.isArray(value) && value.length ? value[0] : '');

const hasFluxerConfig = () => Boolean(process.env.FLUXER_API_URL || process.env.FLUXER_BOT_TOKEN || process.env.FLUXER_BEARER_TOKEN);
const shouldUseDiscordBridge = () => !hasFluxerConfig() && Boolean(process.env.BOT_URL || process.env.BOT_API_SECRET);

export const fluxerController = {
  async listGuilds(req: Request, res: Response) {
    try {
      if (shouldUseDiscordBridge()) {
        const data = await discordBridgeService.getGuilds();
        return res.json(data);
      }

      const data = await fluxerApi.get<any[]>('/guilds');
      return res.json(data);
    } catch (error: any) {
      console.error('[Fluxer] listGuilds erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao buscar comunidades no Fluxer.' });
    }
  },

  async listChannels(req: Request, res: Response) {
    try {
      const guildId = asString(req.params.guildId);
      if (!guildId) {
        return res.status(400).json({ error: 'guildId inválido.' });
      }

      if (shouldUseDiscordBridge()) {
        const data = await discordBridgeService.getChannels(guildId);
        return res.json(data);
      }

      const data = await fluxerApi.get<any[]>(`/guilds/${encodeURIComponent(guildId)}/channels`);
      return res.json(data);
    } catch (error: any) {
      console.error('[Fluxer] listChannels erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao buscar canais no Fluxer.' });
    }
  },

  async listMembers(req: Request, res: Response) {
    try {
      const guildId = asString(req.params.guildId);
      if (!guildId) {
        return res.status(400).json({ error: 'guildId inválido.' });
      }

      if (shouldUseDiscordBridge()) {
        const data = await discordBridgeService.getMembers(guildId);
        return res.json(data);
      }

      const data = await fluxerApi.get<any[]>(`/guilds/${encodeURIComponent(guildId)}/members`);
      return res.json(data);
    } catch (error: any) {
      console.error('[Fluxer] listMembers erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao buscar membros no Fluxer.' });
    }
  },

  async listMessages(req: Request, res: Response) {
    try {
      const channelId = asString(req.params.channelId);
      if (!channelId) {
        return res.status(400).json({ error: 'channelId inválido.' });
      }

      const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
      const before = typeof req.query.before === 'string' ? req.query.before : undefined;

      if (shouldUseDiscordBridge()) {
        const data = await discordBridgeService.getMessages(channelId, { limit, before });
        return res.json(data);
      }

      const data = await fluxerApi.get<any[]>(`/channels/${encodeURIComponent(channelId)}/messages`, {
        params: { limit, ...(before ? { before } : {}) },
      });
      return res.json(data);
    } catch (error: any) {
      console.error('[Fluxer] listMessages erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao buscar mensagens no Fluxer.' });
    }
  },

  async getMessage(req: Request, res: Response) {
    try {
      const channelId = asString(req.params.channelId);
      const messageId = asString(req.params.messageId);
      if (!channelId || !messageId) {
        return res.status(400).json({ error: 'channelId e messageId são obrigatórios.' });
      }

      if (shouldUseDiscordBridge()) {
        const data = await discordBridgeService.getMessages(channelId, { limit: 1 });
        const match = (Array.isArray(data) ? data : []).find((message: any) => message.id === messageId);
        return res.json(match || null);
      }

      const data = await fluxerApi.get<any>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`);
      return res.json(data);
    } catch (error: any) {
      console.error('[Fluxer] getMessage erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao buscar mensagem no Fluxer.' });
    }
  },

  async sendMessage(req: Request, res: Response) {
    try {
      const channelId = asString(req.params.channelId);
      if (!channelId) {
        return res.status(400).json({ error: 'channelId inválido.' });
      }

      const content = typeof req.body?.content === 'string' ? req.body.content : '';
      const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];

      if (shouldUseDiscordBridge()) {
        const data = await discordBridgeService.sendMessage(channelId, content, attachments);
        if (!data) {
          return res.status(502).json({ error: 'Bot indisponível para enviar mensagem.' });
        }
        return res.status(201).json(data);
      }

      const payload: Record<string, unknown> = { content };
      if (attachments.length > 0) {
        payload.attachments = attachments;
      }

      const data = await fluxerApi.post<any>(`/channels/${encodeURIComponent(channelId)}/messages`, payload);
      return res.status(201).json(data);
    } catch (error: any) {
      console.error('[Fluxer] sendMessage erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao enviar mensagem no Fluxer.' });
    }
  },

  async editMessage(req: Request, res: Response) {
    try {
      const channelId = asString(req.params.channelId);
      const messageId = asString(req.params.messageId);
      if (!channelId || !messageId) {
        return res.status(400).json({ error: 'channelId e messageId são obrigatórios.' });
      }

      const content = typeof req.body?.content === 'string' ? req.body.content : '';

      if (shouldUseDiscordBridge()) {
        const data = await discordBridgeService.editMessage(channelId, messageId, content);
        if (!data) {
          return res.status(502).json({ error: 'Bot indisponível para editar mensagem.' });
        }
        return res.json(data);
      }

      const data = await fluxerApi.patch<any>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, { content });
      return res.json(data);
    } catch (error: any) {
      console.error('[Fluxer] editMessage erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao editar mensagem no Fluxer.' });
    }
  },

  async deleteMessage(req: Request, res: Response) {
    try {
      const channelId = asString(req.params.channelId);
      const messageId = asString(req.params.messageId);
      if (!channelId || !messageId) {
        return res.status(400).json({ error: 'channelId e messageId são obrigatórios.' });
      }

      if (shouldUseDiscordBridge()) {
        const deleted = await discordBridgeService.deleteMessage(channelId, messageId);
        if (!deleted) {
          return res.status(502).json({ error: 'Bot indisponível para excluir mensagem.' });
        }
        return res.status(204).send();
      }

      await fluxerApi.delete(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`);
      return res.status(204).send();
    } catch (error: any) {
      console.error('[Fluxer] deleteMessage erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao excluir mensagem no Fluxer.' });
    }
  },

  async addReaction(req: Request, res: Response) {
    try {
      const channelId = asString(req.params.channelId);
      const messageId = asString(req.params.messageId);
      const emoji = asString(req.params.emoji || req.body?.emoji);
      if (!channelId || !messageId || !emoji) {
        return res.status(400).json({ error: 'channelId, messageId e emoji são obrigatórios.' });
      }

      if (shouldUseDiscordBridge()) {
        const data = await discordBridgeService.addReaction(messageId, emoji);
        return res.json(data);
      }

      const data = await fluxerApi.put<any>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(emoji)}`);
      return res.json(data);
    } catch (error: any) {
      console.error('[Fluxer] addReaction erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao adicionar reação no Fluxer.' });
    }
  },

  async removeReaction(req: Request, res: Response) {
    try {
      const channelId = asString(req.params.channelId);
      const messageId = asString(req.params.messageId);
      const emoji = asString(req.params.emoji);
      if (!channelId || !messageId || !emoji) {
        return res.status(400).json({ error: 'channelId, messageId e emoji são obrigatórios.' });
      }

      if (shouldUseDiscordBridge()) {
        const data = await discordBridgeService.removeReaction(messageId, emoji);
        return res.status(data ? 200 : 204).send();
      }

      await fluxerApi.delete(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(emoji)}/@me`);
      return res.status(204).send();
    } catch (error: any) {
      console.error('[Fluxer] removeReaction erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao remover reação no Fluxer.' });
    }
  },

  async startVoiceCall(req: Request, res: Response) {
    try {
      const channelId = asString(req.params.channelId);
      if (!channelId) {
        return res.status(400).json({ error: 'channelId inválido.' });
      }

      if (shouldUseDiscordBridge()) {
        const room = await import('../services/jitsi/jitsiService.js').then(({ createJitsiRoom }) => createJitsiRoom(channelId, 'voice'));
        return res.status(200).json({
          supported: false,
          fallback: 'jitsi',
          channelId,
          type: 'voice',
          roomName: room.roomName,
          domain: room.domain,
          message: 'Chamada de voz local não implementada. Usando fallback Jitsi.',
        });
      }

      const data = await fluxerApi.post<any>(`/channels/${encodeURIComponent(channelId)}/call`);
      return res.status(201).json(data);
    } catch (error: any) {
      console.error('[Fluxer] startVoiceCall erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao iniciar chamada no Fluxer.' });
    }
  },

  async endVoiceCall(req: Request, res: Response) {
    try {
      const channelId = asString(req.params.channelId);
      if (!channelId) {
        return res.status(400).json({ error: 'channelId inválido.' });
      }

      if (shouldUseDiscordBridge()) {
        return res.status(200).json({
          supported: false,
          fallback: 'jitsi',
          channelId,
          ended: true,
          message: 'Chamada de voz local não implementada. Fallback Jitsi encerrado.',
        });
      }

      const data = await fluxerApi.post<any>(`/channels/${encodeURIComponent(channelId)}/call/end`);
      return res.json(data);
    } catch (error: any) {
      console.error('[Fluxer] endVoiceCall erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao encerrar chamada no Fluxer.' });
    }
  },

  async getBotStatus(req: Request, res: Response) {
    try {
      if (shouldUseDiscordBridge()) {
        const status = await discordBridgeService.getBotStatus();
        return res.json(status);
      }

      const status = await fluxerApi.get<any>('/users/@me');
      return res.json({ status: 'connected', bot: status });
    } catch (error: any) {
      const statusCode = error?.response?.status;
      const message = error?.response?.data?.message || error?.message || 'Falha ao conectar no Fluxer.';
      console.error('[Fluxer] getBotStatus erro:', statusCode, message);
      return res.status(502).json({ status: 'offline', error: message });
    }
  },

  async gatewayInfo(req: Request, res: Response) {
    try {
      const data = await fluxerApi.get<any>('/gateway/bot');
      return res.json(data);
    } catch (error: any) {
      console.error('[Fluxer] gatewayInfo erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao obter informações do Gateway.' });
    }
  },

  async createJitsiRoom(req: Request, res: Response) {
    try {
      const conversationId = asString(req.body?.conversationId);
      const type = req.body?.type === 'video' ? 'video' : 'voice';
      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId é obrigatório.' });
      }
      const { createJitsiRoom } = await import('../services/jitsi/jitsiService.js');
      const room = createJitsiRoom(conversationId, type);
      return res.status(201).json(room);
    } catch (error: any) {
      console.error('[Jitsi] createJitsiRoom erro:', error?.message || error);
      return res.status(500).json({ error: 'Erro ao criar sala Jitsi.' });
    }
  },
};
