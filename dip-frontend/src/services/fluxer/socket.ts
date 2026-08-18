import { io, type Socket } from 'socket.io-client';

const importMetaEnv = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;
const socketUrl = (importMetaEnv.VITE_FLUXER_GATEWAY_URL || window.location.origin).replace(/\/$/, '');

export type FluxerGatewayListener = (event: string, payload: unknown) => void;

class FluxerSocket {
  private socket: Socket | null = null;
  private listeners: Set<FluxerGatewayListener> = new Set();
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.connectionState = 'connecting';
    this.socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 10_000,
    });

    this.socket.on('connect', () => {
      this.connectionState = 'connected';
      console.log('[Fluxer Socket] Socket.IO conectado:', this.socket?.id);
      this.emit('fluxer:status', { state: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionState = 'disconnected';
      console.log('[Fluxer Socket] Socket.IO desconectado:', reason);
      this.emit('fluxer:status', { state: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      this.connectionState = 'reconnecting';
      console.log('[Fluxer Socket] Socket.IO connect_error:', error?.message || error);
      this.emit('fluxer:status', { state: 'reconnecting' });
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this.connectionState = 'reconnecting';
      console.log('[Fluxer Socket] Socket.IO reconnect_attempt:', attempt);
      this.emit('fluxer:status', { state: 'reconnecting' });
    });

    this.socket.on('fluxer:event', (data: { event: string; payload: unknown }) => {
      this.emit('fluxer:event', data);
    });

    return this.socket;
  }

  subscribe(listener: FluxerGatewayListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: string, payload: unknown) {
    this.listeners.forEach((listener) => listener(event, payload));
  }

  getState() {
    return this.connectionState;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState = 'disconnected';
    this.listeners.clear();
  }
}

export const fluxerSocket = new FluxerSocket();
