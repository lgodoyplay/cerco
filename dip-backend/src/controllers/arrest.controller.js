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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArrest = exports.listArrests = exports.createArrest = void 0;
const prisma_1 = require("../utils/prisma");
const createArrest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { nomePreso, documento, motivo, artigos, data, descricao, status } = req.body;
        // Assuming files are handled by multer and mapped
        // In a real scenario, we'd map req.files fields to database columns
        // For simplicity, let's assume if files are sent, we just pick the first one for each category if provided
        const files = req.files;
        const fotoRosto = (_b = (_a = files === null || files === void 0 ? void 0 : files['fotoRosto']) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.filename;
        // Other photos...
        const arrest = yield prisma_1.prisma.arrest.create({
            data: {
                nomePreso,
                documento,
                motivo,
                artigos,
                policialId: req.user.id, // From auth middleware
                data: new Date(data),
                descricao,
                status: status || 'Preso',
                fotoRosto: fotoRosto ? `/uploads/${fotoRosto}` : null,
                // Add other photos logic here
            }
        });
        res.status(201).json(arrest);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar prisão' });
    }
});
exports.createArrest = createArrest;
const listArrests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const arrests = yield prisma_1.prisma.arrest.findMany({
            include: { policial: { select: { nome: true } } },
            orderBy: { data: 'desc' }
        });
        res.json(arrests);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar prisões' });
    }
});
exports.listArrests = listArrests;
const getArrest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const arrest = yield prisma_1.prisma.arrest.findUnique({
            where: { id },
            include: { policial: { select: { nome: true } } }
        });
        if (!arrest)
            return res.status(404).json({ error: 'Prisão não encontrada' });
        res.json(arrest);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
});
exports.getArrest = getArrest;
