import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { fluxerApi } from './apiClient';

export interface GatewayInfo {
  url: string;
  shards: number;
  session_start_limit: {
    total: number;
    remaining: number;
    reset_after: number;
    max_concurrency: number;
  };
}

export interface GatewayDispatch {
  t: string;
  d: Record<string, unknown> | null;
  s: number | null;
}

export const FLUXER_GATEWAY_OPCODES = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  PRESENCE_UPDATE: 3,
  VOICE_STATE_UPDATE: 4,
  VOICE_SERVER_PING: 5,
  RESUME: 6,
  RECONNECT: 7,
  REQUEST_GUILD_MEMBERS: 8,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
  GATEWAY_ERROR: 12,
  LAZY_REQUEST: 14,
  REQUEST_GUILD_COUNTS: 15,
  REQUEST_CHANNEL_MEMBER_COUNTS: 16,
} as const;

export interface FluxerGatewayClientOptions {
  token: string;
  intents?: number;
  presence?: Record<string, unknown>;
  reconnect?: boolean;
}

export class FluxerGatewayClient {
  private ws: WebSocket | null = null;
  private heartbeatInterval: number | null = null;
  private sequence: number | null = null;
  private sessionId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectBackoff = 1000;
  private closed = false;
  private gatewayInfo: GatewayInfo | null = null;
  private readonly listeners = new Map<string, Set<(data: unknown) => void>>();
  private readonly options: FluxerGatewayClientOptions;

  constructor(options: FluxerGatewayClientOptions) {
    this.options = {
      reconnect: true,
      intents: 1 << 9,
      ...options,
    };
  }

  async connect() {
    try {
      this.gatewayInfo = await fluxerApi.get<GatewayInfo>('/gateway/bot');
    } catch (error) {
      console.error('[Fluxer Gateway] Falha ao obter gateway:', error);
      throw error;
    }

    const url = new URL(this.gatewayInfo.url);
    url.searchParams.set('v', '1');
    url.searchParams.set('encoding', 'json');

    this.ws = new WebSocket(url.toString());

    this.ws.onopen = () => {
      console.log('[Fluxer Gateway] Conectado');
      this.reconnectAttempts = 0;
      this.reconnectBackoff = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as GatewayDispatch;
        this.handleMessage(message);
      } catch (error) {
        console.error('[Fluxer Gateway] Falha ao parsear mensagem:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[Fluxer Gateway] Erro:', error);
    };

    this.ws.onclose = (event) => {
      console.log('[Fluxer Gateway] Fechado:', event.code, event.reason);
      this.clearHeartbeat();
      if (!this.closed && this.options.reconnect) {
        this.scheduleReconnect();
      }
    };
  }

  private handleMessage(message: GatewayDispatch) {
    if (message.s !== null && message.s !== undefined) {
      this.sequence = message.s;
    }

    if (message.t === 'READY') {
      console.log('[Fluxer Gateway] READY');
      const data = message.d as Record<string, unknown>;
      this.sessionId = data.session_id as string;
    }

    if (message.t === 'HELLO') {
      this.startHeartbeat((message.d as Record<string, unknown>)?.heartbeat_interval as number);
      this.identify();
    }

    this.emit(message.t, message.d);
  }

  private identify() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const payload = {
      op: FLUXER_GATEWAY_OPCODES.IDENTIFY,
      d: {
        token: this.options.token,
        intents: this.options.intents,
        presence: this.options.presence || {},
        shard: [0, this.gatewayInfo?.shards || 1],
      },
    };

    this.ws.send(JSON.stringify(payload));
    console.log('[Fluxer Gateway] IDENTIFY enviado');
  }

  private startHeartbeat(intervalMs: number) {
    this.clearHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const payload = {
        op: FLUXER_GATEWAY_OPCODES.HEARTBEAT,
        d: this.sequence,
      };
      this.ws.send(JSON.stringify(payload));
    }, intervalMs);
  }

  private clearHeartbeat() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Fluxer Gateway] Máximo de tentativas de reconexão atingido');
      return;
    }

    const delay = this.reconnectBackoff * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts += 1;
    console.log(`[Fluxer Gateway] Reconectando em ${delay}ms (tentativa ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('[Fluxer Gateway] Falha na reconexão:', error);
      }
    }, delay);
  }

  on(event: string, listener: (data: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: (data: unknown) => void) {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((listener) => listener(data));
  }

  send(opcode: number, payload: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ op: opcode, d: payload }));
  }

  disconnect() {
    this.closed = true;
    this.clearHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.listeners.clear();
  }
}

export const fluxerGateway = new FluxerGatewayClient({
  token: process.env.FLUXER_BOT_TOKEN || '',
  intents: 1 << 9 | 1 << 10 | 1 << 13 | 1 << 14 | 1 << 20,
});

export function broadcastFluxerGatewayEvent(io: SocketIOServer | undefined, event: string, payload: unknown) {
  if (!io) return;
  io.emit('fluxer:event', { event, payload });
  if (payload && typeof payload === 'object' && 'guild_id' in payload) {
    io.to(String((payload as Record<string, unknown>).guild_id)).emit('fluxer:event', { event, payload });
  }
  if (payload && typeof payload === 'object' && 'channel_id' in payload) {
    io.to(String((payload as Record<string, unknown>).channel_id)).emit('fluxer:event', { event, payload });
  }
}
