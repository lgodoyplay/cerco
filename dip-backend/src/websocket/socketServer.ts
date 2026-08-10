import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server | null = null;

export const initializeSocketServer = (httpServer: HttpServer) => {
  const configuredOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const allowedOrigins = [
    'https://cerco-ccv.pages.dev',
    'https://www.cerco-ccv.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000',
    ...configuredOrigins,
  ];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
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
