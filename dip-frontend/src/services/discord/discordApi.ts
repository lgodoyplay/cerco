/// <reference types="vite/client" />

const importMetaEnv = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;
const configuredApiUrl = (importMetaEnv.VITE_API_URL || importMetaEnv.VITE_DISCORD_API_URL || '').trim();

const normalizeApiBase = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return '/api/discord';
  }

  if (trimmed.startsWith('/')) {
    return trimmed.endsWith('/api/discord') ? trimmed.replace(/\/$/, '') : `${trimmed.replace(/\/$/, '')}/api/discord`;
  }

  try {
    const { origin, pathname } = new URL(trimmed);
    const normalizedPath = pathname.replace(/\/$/, '');

    if (normalizedPath.endsWith('/api/discord')) {
      return `${origin}${normalizedPath}`;
    }

    return `${origin}${normalizedPath}/api/discord`;
  } catch {
    return trimmed.endsWith('/api/discord') ? trimmed.replace(/\/$/, '') : `${trimmed.replace(/\/$/, '')}/api/discord`;
  }
};

const API_BASE = normalizeApiBase(configuredApiUrl);

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  'x-dashboard-user-id': 'dashboard',
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
