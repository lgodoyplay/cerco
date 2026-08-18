import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './utils/prisma';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import arrestRoutes from './routes/arrest.routes';
import wantedRoutes from './routes/wanted.routes';
import boRoutes from './routes/bo.routes';
import investigationRoutes from './routes/investigation.routes';
import publicRoutes from './routes/public.routes';
import dashboardRoutes from './routes/dashboard.routes';
import bcrypt from 'bcryptjs';
import http from 'http';
import discordRoutes from './routes/discord.routes';
import internalCommsRoutes from './routes/internalComms.routes';
import { initializeSocketServer } from './websocket/socketServer';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);
initializeSocketServer(httpServer);

const allowedOrigins = [
  'https://cerco-ccv.pages.dev',
  'https://www.cerco-ccv.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGIN?.split(',') || []).filter(Boolean),
];

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-bot-secret'],
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

app.use('/auth', authLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/arrests', arrestRoutes);
app.use('/wanted', wantedRoutes);
app.use('/bo', boRoutes);
app.use('/investigations', investigationRoutes);
app.use('/public', publicRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api', internalCommsRoutes);

app.get('/', (req, res) => {
  res.send('API Polícia Federal Backend is running');
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'degraded', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

async function seedAdmin() {
  try {
    const adminExists = await prisma.user.findFirst({ where: { login: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD || 'admin123', 10);
      await prisma.user.create({
        data: {
          nome: 'Administrador Mestre',
          login: 'admin',
          senhaHash: hashedPassword,
          cargo: 'Delegado Chefe',
          patente: 'Comissário',
          permissoes: '["admin", "create", "read", "update", "delete"]',
          ativo: true
        }
      });
      console.log('Admin user created: admin');
    }
  } catch (error) {
    console.warn('Skipping admin seed due to database availability:', error);
  }
}

async function seedInternalComms() {
  try {
    const admin = await prisma.user.findFirst({ where: { login: 'admin' } });
    if (!admin) return;

    const serverExists = await prisma.server.findFirst({ where: { ownerId: admin.id } });
    if (!serverExists) {
      const server = await prisma.server.create({
        data: {
          name: 'FEDERAL EUFORIA - Geral',
          iconUrl: null,
          ownerId: admin.id
        }
      });

      await prisma.channel.create({ data: { serverId: server.id, name: 'chat-geral', type: 'text', position: 0 } });
      await prisma.channel.create({ data: { serverId: server.id, name: 'comunicacoes', type: 'text', position: 1 } });
      await prisma.channel.create({ data: { serverId: server.id, name: 'sala-de-reuniao', type: 'voice', position: 2 } });

      await prisma.member.create({
        data: {
          serverId: server.id,
          userId: admin.id
        }
      });

      console.log('Internal comms seed created for admin');
    }
  } catch (error) {
    console.warn('Skipping internal comms seed:', error);
  }
}

let server: ReturnType<typeof app.listen>;

async function startServer() {
  await seedAdmin();
  await seedInternalComms();
  server = httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Database connection closed.');
      process.exit(0);
    });
  }
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

