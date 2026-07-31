import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { createLog } from '../utils/logger';
import {
  validateInvestigationCreate,
  validateInvestigationUpdate,
  validateProofCreate,
  sanitizeString,
  sanitizeDescription,
  INVESTIGATION_STATUS,
  PRIORITY_LEVELS
} from '../utils/investigationValidator';
import { createAuditLog } from '../utils/auditTrail';

export const createInvestigation = async (req: Request, res: Response) => {
  try {
    const { titulo, descricao, envolvidos, prioridade } = req.body;
    const userId = (req as any).user.id;
    
    // ✅ VALIDAÇÃO
    const validation = validateInvestigationCreate({
      titulo,
      descricao,
      envolvidos,
      prioridade
    });

    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: validation.errors 
      });
    }
    
    // ✅ SANITIZAÇÃO
    const input = {
      titulo: sanitizeString(titulo),
      descricao: sanitizeDescription(descricao),
      envolvidos: sanitizeString(envolvidos || ''),
      prioridade,
      investigadorId: userId,
      status: INVESTIGATION_STATUS.RASCUNHO,
      dataInicio: new Date()
    } as unknown as Prisma.InvestigationUncheckedCreateInput;

    const investigation = await prisma.investigation.create({
      data: input
    });

    await createLog(userId, 'Nova Investigação', `Investigação criada: ${investigation.id}`, req.ip);

    res.status(201).json({
      message: '✅ Investigação criada com sucesso',
      investigation
    });
  } catch (error) {
    console.error('❌ Erro ao criar investigação:', error);
    res.status(500).json({ 
      error: 'Erro ao criar investigação',
      message: (error as Error).message 
    });
  }
};

export const addEvidence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipo, descricao } = req.body;
    const file = req.file;
    const userId = (req as any).user.id;

    // ✅ VALIDAÇÃO
    const validation = validateProofCreate({
      investigacao_id: parseInt(id),
      tipo,
      conteudo: file?.originalname || '',
      descricao
    });

    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Dados de prova inválidos',
        details: validation.errors 
      });
    }

    if (!file) return res.status(400).json({ error: '❌ Arquivo obrigatório' });

    // Importar função de processamento
    const { processImage } = await import('../middlewares/uploadV2.middleware');
    const { getImageUrl } = await import('../utils/urlHelper');

    // Processar arquivo
    const filename = await processImage(file, userId);

    // ✅ SANITIZAÇÃO
    const evidence = await prisma.evidence.create({
      data: {
        investigacaoId: id,
        tipo: sanitizeString(tipo),
        descricao: sanitizeDescription(descricao || ''),
        conteudo: getImageUrl(filename)
      }
    });

    await createLog(userId, 'Prova Adicionada', `Prova ${tipo} em investigação ${id}`, req.ip);

    res.status(201).json({
      message: '✅ Prova adicionada com sucesso',
      evidence
    });
  } catch (error) {
    console.error('❌ Erro ao adicionar prova:', error);
    res.status(500).json({ 
      error: 'Erro ao adicionar prova',
      message: (error as Error).message 
    });
  }
};

export const listInvestigations = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    const orderBy: any = { createdAt: 'desc' };

    if (req.query.status) {
      where.status = req.query.status as string;
    }
    if (req.query.prioridade) {
      where.prioridade = req.query.prioridade as string;
    }
    if (req.query.orderBy) {
      orderBy[req.query.orderBy as string] = (req.query.orderDir as string) || 'desc';
    }

    const [investigations, total] = await Promise.all([
      prisma.investigation.findMany({
        where,
        include: { investigador: { select: { nome: true } } },
        orderBy,
        skip,
        take: limit
      }),
      prisma.investigation.count({ where })
    ]);

    res.json({
      data: investigations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar investigações' });
  }
};

export const getInvestigation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const investigation = await prisma.investigation.findUnique({
      where: { id },
      include: { 
        investigador: { select: { nome: true } },
        evidences: true 
      }
    });

    if (!investigation) return res.status(404).json({ error: 'Investigação não encontrada' });

    res.json(investigation);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar investigação' });
  }
};

// ✨ NOVO: Atualizar investigação com validação
export const updateInvestigation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // ✅ VALIDAÇÃO
    const validation = validateInvestigationUpdate(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: validation.errors 
      });
    }

    // Buscar investigação existente para auditoria
    const investigationBefore = await prisma.investigation.findUnique({
      where: { id }
    });

    if (!investigationBefore) {
      return res.status(404).json({ error: 'Investigação não encontrada' });
    }

    // ✅ SANITIZAÇÃO
    const updateData: any = {};
    if (req.body.titulo) updateData.titulo = sanitizeString(req.body.titulo);
    if (req.body.descricao) updateData.descricao = sanitizeDescription(req.body.descricao);
    if (req.body.prioridade) updateData.prioridade = req.body.prioridade;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.envolvidos) updateData.envolvidos = sanitizeString(req.body.envolvidos);

    const investigation = await prisma.investigation.update({
      where: { id },
      data: updateData
    });

    // 📋 Log de auditoria
    await createAuditLog(null, parseInt(id), userId, 'editado', 
      investigationBefore, investigation);
    await createLog(userId, 'Investigação Atualizada', `Investigação ${id} atualizada`, req.ip);

    res.json({
      message: '✅ Investigação atualizada com sucesso',
      investigation
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar investigação:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar investigação',
      message: (error as Error).message 
    });
  }
};

export const finalizeInvestigation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const investigation = await prisma.investigation.findUnique({
      where: { id },
      include: { evidences: true, investigador: true }
    });

    if (!investigation) return res.status(404).json({ error: 'Investigação não encontrada' });

    // Update status
    await prisma.investigation.update({
      where: { id },
      data: { status: 'Finalizada', dataFim: new Date() }
    });

    await createLog((req as any).user.id, 'Investigação Finalizada', `Investigação finalizada: ${investigation.titulo}`, req.ip);

    // Generate PDF
    const doc = new PDFDocument();
    const filename = `relatorio-${id}.pdf`;
    const pdfPath = path.join(__dirname, '../../uploads', filename);
    const writeStream = fs.createWriteStream(pdfPath);

    doc.pipe(writeStream);

    doc.fontSize(25).text('RELATÓRIO DE INVESTIGAÇÃO - DPF - POLÍCIA FEDERAL', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Título: ${investigation.titulo}`);
    doc.text(`Status: Finalizada`);
    doc.text(`Investigador: ${investigation.investigador.nome}`);
    doc.text(`Data Início: ${investigation.dataInicio.toLocaleDateString()}`);
    doc.text(`Data Fim: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text('Descrição:', { underline: true });
    doc.text(investigation.descricao);
    doc.moveDown();
    
    doc.text('PROVAS ANEXADAS:', { underline: true });
    investigation.evidences.forEach((ev, index) => {
      doc.moveDown();
      doc.text(`${index + 1}. Tipo: ${ev.tipo} - ${ev.descricao || ''}`);
      doc.text(`Arquivo: ${ev.conteudo}`);
    });

    doc.end();

    writeStream.on('finish', () => {
      res.json({ message: 'Investigação finalizada', pdfUrl: `/uploads/${filename}` });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao finalizar investigação' });
  }
};
