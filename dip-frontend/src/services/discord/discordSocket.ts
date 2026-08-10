import { io, Socket } from 'socket.io-client';

const configuredSocketUrl = (import.meta.env.VITE_DISCORD_SOCKET_URL || '').trim();
const SOCKET_URL = configuredSocketUrl && !configuredSocketUrl.includes('supabase.co')
  ? configuredSocketUrl.replace(/\/$/, '')
  : (typeof window !== 'undefined' ? window.location.origin : '').replace(/\/$/, '');

export class DiscordSocket {
  private socket: Socket | null = null;
  private listeners: Array<(event: any) => void> = [];

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.emit({ type: 'connected' });
    });

    this.socket.on('disconnect', () => {
      this.emit({ type: 'disconnected' });
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
