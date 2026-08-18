import type { Request, Response } from 'express';
import { fluxerApi, fluxerGateway, broadcastFluxerGatewayEvent } from '../services/fluxer';

const asString = (value: unknown): string => (typeof value === 'string' ? value : Array.isArray(value) && value.length ? value[0] : '');

export const fluxerController = {
  async listGuilds(req: Request, res: Response) {
    try {
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
      const data = await fluxerApi.post<any>(`/channels/${encodeURIComponent(channelId)}/call/end`);
      return res.json(data);
    } catch (error: any) {
      console.error('[Fluxer] endVoiceCall erro:', error?.message || error);
      return res.status(502).json({ error: 'Falha ao encerrar chamada no Fluxer.' });
    }
  },

  async getBotStatus(req: Request, res: Response) {
    try {
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
};
