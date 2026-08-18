/// <reference types="vite/client" />

const importMetaEnv = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;
const configuredApiUrl = (importMetaEnv.VITE_FLUXER_API_URL || importMetaEnv.VITE_API_URL || '/api/fluxer').trim();

const normalizeApiBase = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '/api/fluxer';
  if (trimmed.startsWith('/')) {
    return trimmed.endsWith('/api/fluxer') ? trimmed.replace(/\/$/, '') : `${trimmed.replace(/\/$/, '')}/api/fluxer`;
  }
  try {
    const { origin, pathname } = new URL(trimmed);
    const normalizedPath = pathname.replace(/\/$/, '');
    return normalizedPath.endsWith('/api/fluxer') ? `${origin}${normalizedPath}` : `${origin}${normalizedPath}/api/fluxer`;
  } catch {
    return trimmed.endsWith('/api/fluxer') ? trimmed.replace(/\/$/, '') : `${trimmed.replace(/\/$/, '')}/api/fluxer`;
  }
};

const API_BASE = normalizeApiBase(configuredApiUrl);
console.log('[Fluxer Frontend] API_BASE:', API_BASE);

const buildHeaders = () => ({
  'Content-Type': 'application/json',
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
    const errorMessage = payload?.error || payload?.message || 'Erro ao comunicar com o backend Fluxer.';
    throw new Error(errorMessage);
  }

  return payload as T;
};

export const fluxerGetGuilds = () => request<any[]>('/guilds');
export const fluxerGetChannels = (guildId: string) => request<any[]>(`/guilds/${encodeURIComponent(guildId)}/channels`);
export const fluxerGetMembers = (guildId: string) => request<any[]>(`/guilds/${encodeURIComponent(guildId)}/members`);
export const fluxerGetMessages = (channelId: string, limit = 50, before?: string) => {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (before) qs.set('before', before);
  return request<any[]>(`/channels/${encodeURIComponent(channelId)}/messages?${qs.toString()}`);
};
export const fluxerGetMessage = (channelId: string, messageId: string) =>
  request<any>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`);
export const fluxerSendMessage = (channelId: string, content: string, attachments?: unknown[]) =>
  request<any>(`/channels/${encodeURIComponent(channelId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, attachments }),
  });
export const fluxerEditMessage = (channelId: string, messageId: string, content: string) =>
  request<any>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
export const fluxerDeleteMessage = (channelId: string, messageId: string) =>
  request<void>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, {
    method: 'DELETE',
  });
export const fluxerAddReaction = (channelId: string, messageId: string, emoji: string) =>
  request<any>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(emoji)}`, {
    method: 'PUT',
  });
export const fluxerRemoveReaction = (channelId: string, messageId: string, emoji: string) =>
  request<void>(`/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(emoji)}`, {
    method: 'DELETE',
  });
export const fluxerStartVoiceCall = (channelId: string) =>
  request<any>(`/channels/${encodeURIComponent(channelId)}/call`, { method: 'POST' });
export const fluxerEndVoiceCall = (channelId: string) =>
  request<any>(`/channels/${encodeURIComponent(channelId)}/call/end`, { method: 'POST' });
export const fluxerGetBotStatus = () => request<any>('/bot/status');
export const fluxerGetGatewayInfo = () => request<any>('/gateway/bot');
