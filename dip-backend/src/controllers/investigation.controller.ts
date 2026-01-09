import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { createLog } from '../utils/logger';

export const createInvestigation = async (req: Request, res: Response) => {
  try {
    const { titulo, descricao, envolvidos, prioridade } = req.body;
    
    const input = {
      titulo,
      descricao,
      envolvidos,
      prioridade,
      investigadorId: (req as any).user.id
    } as unknown as Prisma.InvestigationUncheckedCreateInput;

    const investigation = await prisma.investigation.create({
      data: input
    });

    await createLog((req as any).user.id, 'Nova Investigação', `Investigação iniciada: ${titulo}`, req.ip);

    res.status(201).json(investigation);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar investigação' });
  }
};

export const addEvidence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipo, descricao } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Arquivo obrigatório' });

    const evidence = await prisma.evidence.create({
      data: {
        investigacaoId: id,
        tipo,
        descricao,
        conteudo: `/uploads/${file.filename}`
      }
    });
    res.status(201).json(evidence);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar prova' });
  }
};

export const listInvestigations = async (req: Request, res: Response) => {
  try {
    const investigations = await prisma.investigation.findMany({
      include: { investigador: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(investigations);
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

    doc.fontSize(25).text('RELATÓRIO DE INVESTIGAÇÃO - CERCO PC', { align: 'center' });
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
