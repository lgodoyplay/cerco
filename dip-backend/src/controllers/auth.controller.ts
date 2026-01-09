import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export const login = async (req: Request, res: Response) => {
  const { login, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { login } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!user.ativo) {
      return res.status(403).json({ error: 'Usuário inativo' });
    }

    const isMatch = await bcrypt.compare(password, user.senhaHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, cargo: user.cargo },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    // Log login
    await prisma.log.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        details: 'Usuário realizou login',
        ip: req.ip || req.socket.remoteAddress
      }
    });

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        cargo: user.cargo,
        patente: user.patente,
        permissoes: JSON.parse(user.permissoes)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
