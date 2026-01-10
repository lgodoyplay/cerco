import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/arrests', arrestRoutes);
app.use('/wanted', wantedRoutes);
app.use('/bo', boRoutes);
app.use('/investigations', investigationRoutes);
app.use('/public', publicRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('API DIP Polícia Federal Backend is running');
});

// Seed Admin User
async function seedAdmin() {
  try {
    const adminExists = await prisma.user.findFirst({ where: { login: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
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
      console.log('Admin user created: admin / admin123');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}

app.listen(PORT, async () => {
  await seedAdmin();
  console.log(`Server running on port ${PORT}`);
});

