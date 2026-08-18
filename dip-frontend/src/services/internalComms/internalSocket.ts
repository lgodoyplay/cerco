import { io, Socket } from 'socket.io-client';

/// <reference types="vite/client" />

const importMetaEnv = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;
const configuredSocketUrl = (importMetaEnv.VITE_WS_URL || '').trim();

const resolveSocketUrl = () => {
  if (configuredSocketUrl) {
    return configuredSocketUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
};

const SOCKET_URL = resolveSocketUrl();

export class DiscordSocket {
  private socket: Socket | null = null;
  private listeners: Array<(event: any) => void> = [];

  connect() {
    if (this.socket?.connected) return this.socket;

    if (!SOCKET_URL) {
      this.emit({ type: 'disconnected' });
      return null;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      this.emit({ type: 'connected' });
    });

    this.socket.on('reconnecting', () => {
      this.emit({ type: 'reconnecting' });
    });

    this.socket.on('disconnect', () => {
      this.emit({ type: 'disconnected' });
    });

    this.socket.on('connect_error', () => {
      this.emit({ type: 'reconnecting' });
    });

    this.socket.on('message:new', (event) => {
      this.emit(event);
    });

    this.socket.on('voice:joined', (event) => {
      this.emit(event);
    });

    this.socket.on('voice:left', (event) => {
      this.emit(event);
    });

    this.socket.on('server:created', (event) => {
      this.emit(event);
    });

    this.socket.on('channel:created', (event) => {
      this.emit(event);
    });

    return this.socket;
  }

  on(listener: (event: any) => void) {
    this.listeners.push(listener);
  }

  off(listener: (event: any) => void) {
    this.listeners = this.listeners.filter((item) => item !== listener);
  }

  emit(event: any) {
    this.listeners.forEach((listener) => listener(event));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const discordSocket = new DiscordSocket();
