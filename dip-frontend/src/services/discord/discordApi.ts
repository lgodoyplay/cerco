const configuredApiUrl = (import.meta.env.VITE_DISCORD_API_URL || '').trim();
const API_BASE = configuredApiUrl && !configuredApiUrl.includes('supabase.co')
  ? configuredApiUrl.replace(/\/$/, '')
  : '/api/discord';

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${import.meta.env.VITE_DISCORD_TOKEN || ''}`,
});

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...buildHeaders(),
    },
  });

  const text = await response.text();
  let payload: any = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text.slice(0, 200) };
    }
  }

  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || 'Erro ao comunicar com o backend Discord.';
    throw new Error(errorMessage);
  }

  return payload as T;
};

export const getGuilds = () => request<any[]>('/guilds');
export const getChannels = (guildId: string) => request<any[]>(`/guilds/${guildId}/channels`);
export const getMembers = (guildId: string) => request<any[]>(`/guilds/${guildId}/members`);
export const getMessages = (channelId: string, limit = 50) => request<any[]>(`/channels/${channelId}/messages?limit=${limit}`);
export const sendMessage = (channelId: string, content: string) => request<any>(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
export const getMember = (memberId: string) => request<any>(`/members/${memberId}`);
export const getBotStatus = () => request<any>('/bot/status');
