"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeInvestigation = exports.getInvestigation = exports.listInvestigations = exports.addEvidence = exports.createInvestigation = void 0;
const prisma_1 = require("../utils/prisma");
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const createInvestigation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { titulo, descricao, envolvidos, prioridade } = req.body;
        const input = {
            titulo,
            descricao,
            envolvidos, // Field verified in schema.prisma and Prisma Client
            prioridade,
            investigadorId: req.user.id
        };
        const investigation = yield prisma_1.prisma.investigation.create({
            data: input
        });
        res.status(201).json(investigation);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar investigação' });
    }
});
exports.createInvestigation = createInvestigation;
const addEvidence = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { tipo, descricao } = req.body;
        const file = req.file;
        if (!file)
            return res.status(400).json({ error: 'Arquivo obrigatório' });
        const evidence = yield prisma_1.prisma.evidence.create({
            data: {
                investigacaoId: id,
                tipo,
                descricao,
                conteudo: `/uploads/${file.filename}`
            }
        });
        res.status(201).json(evidence);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar prova' });
    }
});
exports.addEvidence = addEvidence;
const listInvestigations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const investigations = yield prisma_1.prisma.investigation.findMany({
            include: { investigador: { select: { nome: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(investigations);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar investigações' });
    }
});
exports.listInvestigations = listInvestigations;
const getInvestigation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const investigation = yield prisma_1.prisma.investigation.findUnique({
            where: { id },
            include: {
                investigador: { select: { nome: true } },
                evidences: true
            }
        });
        if (!investigation)
            return res.status(404).json({ error: 'Investigação não encontrada' });
        res.json(investigation);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar investigação' });
    }
});
exports.getInvestigation = getInvestigation;
const finalizeInvestigation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const investigation = yield prisma_1.prisma.investigation.findUnique({
            where: { id },
            include: { evidences: true, investigador: true }
        });
        if (!investigation)
            return res.status(404).json({ error: 'Investigação não encontrada' });
        // Update status
        yield prisma_1.prisma.investigation.update({
            where: { id },
            data: { status: 'Finalizada', dataFim: new Date() }
        });
        // Generate PDF
        const doc = new pdfkit_1.default();
        const filename = `relatorio-${id}.pdf`;
        const pdfPath = path_1.default.join(__dirname, '../../uploads', filename);
        const writeStream = fs_1.default.createWriteStream(pdfPath);
        doc.pipe(writeStream);
        doc.fontSize(25).text('RELATÓRIO DE INVESTIGAÇÃO - DIP - POLÍCIA CIVIL', { align: 'center' });
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao finalizar investigação' });
    }
});
exports.finalizeInvestigation = finalizeInvestigation;
