import { io, Socket } from 'socket.io-client';

const configuredSocketUrl = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_DISCORD_SOCKET_URL || '').trim();
const SOCKET_URL = configuredSocketUrl && !configuredSocketUrl.includes('supabase.co')
  ? configuredSocketUrl.replace(/\/$/, '')
  : window.location.origin;

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
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
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

    this.socket.on('discord:event', (event) => {
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
