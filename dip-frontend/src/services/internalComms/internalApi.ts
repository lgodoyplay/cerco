/// <reference types="vite/client" />

const importMetaEnv = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;
const configuredApiUrl = (importMetaEnv.VITE_API_URL || '').trim();

const normalizeApiBase = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '/api';
  if (trimmed.startsWith('/')) {
    return trimmed.endsWith('/api') ? trimmed.replace(/\/$/, '') : `${trimmed.replace(/\/$/, '')}/api`;
  }
  try {
    const { origin, pathname } = new URL(trimmed);
    const normalizedPath = pathname.replace(/\/$/, '');
    return normalizedPath.endsWith('/api') ? `${origin}${normalizedPath}` : `${origin}${normalizedPath}/api`;
  } catch {
    return trimmed.endsWith('/api') ? trimmed.replace(/\/$/, '') : `${trimmed.replace(/\/$/, '')}/api`;
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
    const errorMessage = payload?.error || payload?.message || 'Erro ao comunicar com o backend.';
    throw new Error(errorMessage);
  }

  return payload as T;
};

export const getGuilds = () => request<any[]>('/servers');
export const getChannels = (guildId: string) => request<any[]>(`/servers/${guildId}/channels`);
export const getMembers = (guildId: string) => request<any[]>(`/servers/${guildId}/members`);
export const getMessages = (channelId: string, limit = 50) => request<any[]>(`/channels/${channelId}/messages?limit=${limit}`);
export const sendMessage = (channelId: string, content: string) => request<any>(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
export const getMember = (memberId: string) => request<any>(`/members/${memberId}`);
export const getBotStatus = () => request<any>('/bot/status');
