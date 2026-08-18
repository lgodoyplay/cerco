import { fluxerApi } from './apiClient';

export interface FluxerCall {
  channel_id: string;
  guild_id?: string;
  participants: FluxerCallParticipant[];
  ringing?: string[];
}

export interface FluxerCallParticipant {
  user_id: string;
  muted: boolean;
  deafened: boolean;
  video: boolean;
  screen: boolean;
}

export interface LiveKitServerInfo {
  endpoint: string;
  token: string;
  roomName: string;
  connectionId?: string;
}

export class FluxerVoiceClient {
  async startCall(channelId: string) {
    return fluxerApi.post<FluxerCall>('/channels/${channelId}/call', {});
  }

  async endCall(channelId: string) {
    return fluxerApi.post<{ ok: boolean }>('/channels/${channelId}/call/end', {});
  }

  async ring(channelId: string, targetUserId: string) {
    return fluxerApi.post<{ ok: boolean }>('/channels/${channelId}/call/ring', { user_id: targetUserId });
  }

  async stopRinging(channelId: string, targetUserId: string) {
    return fluxerApi.post<{ ok: boolean }>('/channels/${channelId}/call/stop-ringing', { user_id: targetUserId });
  }

  async getRtcRegions(channelId: string) {
    return fluxerApi.get<{ regions: Array<{ id: string; region: string; vpn: boolean }> }>('/channels/${channelId}/rtc-regions');
  }

  async sendVoicePresenceHeartbeat(channelId: string) {
    return fluxerApi.post<{ ok: boolean }>('/channels/${channelId}/voice-presence/heartbeat', {});
  }

  buildLiveKitRoomName(guildId: string | undefined, channelId: string): string {
    if (guildId) {
      return `guild_${guildId}_channel_${channelId}`;
    }
    return `channel_${channelId}`;
  }

  extractLiveKitInfo(voiceServerUpdate: Record<string, unknown>): LiveKitServerInfo | null {
    const endpoint = voiceServerUpdate.endpoint as string | undefined;
    const token = voiceServerUpdate.token as string | undefined;
    const roomName = (voiceServerUpdate.room_name as string) || (voiceServerUpdate.channel_id as string) || '';

    if (!endpoint || !token) return null;

    return {
      endpoint,
      token,
      roomName,
      connectionId: voiceServerUpdate.connection_id as string | undefined,
    };
  }
}

export const fluxerVoice = new FluxerVoiceClient();
