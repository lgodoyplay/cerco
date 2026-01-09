import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { nome, login, senha, cargo, patente, permissoes } = req.body;
    const hashedPassword = await bcrypt.hash(senha, 10);

    const user = await prisma.user.create({
      data: {
        nome,
        login,
        senhaHash: hashedPassword,
        cargo,
        patente,
        permissoes: JSON.stringify(permissoes || []),
        ativo: true
      }
    });

    const { senhaHash, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, login, cargo, patente, permissoes, ativo, senha } = req.body;
    
    const data: any = { nome, login, cargo, patente, ativo };
    
    if (permissoes) {
      data.permissoes = JSON.stringify(permissoes);
    }

    if (senha) {
      data.senhaHash = await bcrypt.hash(senha, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data
    });

    const { senhaHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nome: true, login: true, cargo: true, patente: true, permissoes: true, ativo: true }
    });
    // Parse permissions
    const formattedUsers = users.map(u => ({
      ...u,
      permissoes: u.permissoes ? JSON.parse(u.permissoes) : []
    }));
    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};
