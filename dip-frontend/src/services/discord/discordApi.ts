const API_BASE = (import.meta.env.VITE_DISCORD_API_URL || '/api/discord').replace(/\/$/, '');

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

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro inesperado.' }));
    throw new Error(error.error || 'Erro ao comunicar com o backend Discord.');
  }

  return response.json() as Promise<T>;
};

export const getGuilds = () => request<any[]>('/guilds');
export const getChannels = (guildId: string) => request<any[]>(`/guilds/${guildId}/channels`);
export const getMembers = (guildId: string) => request<any[]>(`/guilds/${guildId}/members`);
export const getMessages = (channelId: string, limit = 50) => request<any[]>(`/channels/${channelId}/messages?limit=${limit}`);
export const sendMessage = (channelId: string, content: string) => request<any>(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
export const getMember = (memberId: string) => request<any>(`/members/${memberId}`);
export const getBotStatus = () => request<any>('/bot/status');
