import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server | null = null;

export const initializeSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.emit('discord:status', { state: 'connected' });

    socket.on('discord:join:channel', (channelId: string) => {
      if (channelId) {
        socket.join(channelId);
      }
    });

    socket.on('disconnect', () => {
      // conexão encerrada
    });
  });

  return io;
};

export const broadcastDiscordEvent = (event: { type: string; payload?: Record<string, unknown> }) => {
  if (!io) {
    return;
  }

  io.emit('discord:event', event);

  if (event.payload?.channelId) {
    io.to(String(event.payload.channelId)).emit('discord:event', event);
  }
};
