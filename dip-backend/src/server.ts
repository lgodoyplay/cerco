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

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || undefined }));
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
    console.error('Error seeding admin:', error);
  }
}

let server: ReturnType<typeof app.listen>;

async function startServer() {
  await seedAdmin();
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

