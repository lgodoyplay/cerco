import axios from 'axios';

const isLocalDev = process.env.NODE_ENV !== 'production';
const BOT_URL = (process.env.BOT_URL || (isLocalDev ? 'http://localhost:4001' : '')).replace(/\/$/, '');
const BOT_SECRET = (process.env.BOT_API_SECRET || '').trim();

if (!BOT_URL || !BOT_SECRET) {
  console.warn('[discordBridgeService] BOT_URL/BOT_API_SECRET não configurados. Configure as URLs públicas do bot do Discloud antes de usar o bridge do Discord.');
}

const buildHeaders = () => ({
  'x-bot-secret': BOT_SECRET,
  'Content-Type': 'application/json',
});

export interface DiscordBotEvent {
  type: string;
  payload?: Record<string, unknown>;
}

class DiscordBridgeService {
  async getGuilds() {
    try {
      const { data } = await axios.get(`${BOT_URL}/api/discord/guilds`, { headers: buildHeaders() });
      return data;
    } catch (error) {
      console.warn('Discord bot indisponível para listar servidores:', error);
      return [];
    }
  }

  async getChannels(guildId: string) {
    try {
      const { data } = await axios.get(`${BOT_URL}/api/discord/guilds/${guildId}/channels`, { headers: buildHeaders() });
      return data;
    } catch (error) {
      console.warn('Discord bot indisponível para listar canais:', error);
      return [];
    }
  }

  async getMembers(guildId: string) {
    try {
      const { data } = await axios.get(`${BOT_URL}/api/discord/guilds/${guildId}/members`, { headers: buildHeaders() });
      return data;
    } catch (error) {
      console.warn('Discord bot indisponível para listar membros:', error);
      return [];
    }
  }

  async getMessages(channelId: string, query: { limit?: number; before?: string } = {}) {
    try {
      const { data } = await axios.get(`${BOT_URL}/api/discord/channels/${channelId}/messages`, {
        headers: buildHeaders(),
        params: query,
      });
      return data;
    } catch (error) {
      console.warn('Discord bot indisponível para listar mensagens:', error);
      return [];
    }
  }

  async sendMessage(channelId: string, content: string, attachments?: Array<{ name: string; url: string }>) {
    try {
      const { data } = await axios.post(
        `${BOT_URL}/api/discord/channels/${channelId}/messages`,
        { content, attachments },
        { headers: buildHeaders() }
      );
      return data;
    } catch (error) {
      console.warn('Discord bot indisponível para enviar mensagem:', error);
      return null;
    }
  }

  async getMember(memberId: string) {
    try {
      const { data } = await axios.get(`${BOT_URL}/api/discord/members/${memberId}`, { headers: buildHeaders() });
      return data;
    } catch (error) {
      console.warn('Discord bot indisponível para buscar membro:', error);
      return null;
    }
  }

  async getBotStatus() {
    try {
      const { data } = await axios.get(`${BOT_URL}/api/discord/bot/status`, { headers: buildHeaders() });
      return data;
    } catch (error) {
      console.warn('Discord bot indisponível para status:', error);
      return { status: 'offline', uptime: 0, latency: 0, guilds: 0 };
    }
  }

  async editMessage(channelId: string, messageId: string, content: string) {
    try {
      const { data } = await axios.patch(
        `${BOT_URL}/api/discord/channels/${channelId}/messages/${messageId}`,
        { content },
        { headers: buildHeaders() }
      );
      return data;
    } catch (error) {
      console.warn('Discord bot indisponível para editar mensagem:', error);
      return null;
    }
  }

  async deleteMessage(channelId: string, messageId: string) {
    try {
      await axios.delete(`${BOT_URL}/api/discord/channels/${channelId}/messages/${messageId}`, { headers: buildHeaders() });
      return true;
    } catch (error) {
      console.warn('Discord bot indisponível para excluir mensagem:', error);
      return false;
    }
  }

  async addReaction(messageId: string, emoji: string) {
    try {
      const { data } = await axios.put(`${BOT_URL}/api/discord/messages/${messageId}/reactions`, { emoji }, { headers: buildHeaders() });
      return data;
    } catch (error) {
      console.warn('Discord bot indisponível para reagir:', error);
      return null;
    }
  }

  async removeReaction(messageId: string, emoji: string) {
    try {
      const { data } = await axios.delete(`${BOT_URL}/api/discord/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, { headers: buildHeaders() });
      return data;
    } catch (error) {
      console.warn('Discord bot indisponível para remover reação:', error);
      return null;
    }
  }
}

export const discordBridgeService = new DiscordBridgeService();
