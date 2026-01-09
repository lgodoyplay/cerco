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
exports.getWanted = exports.listWanted = exports.createWanted = void 0;
const prisma_1 = require("../utils/prisma");
const createWanted = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { nome, documento, motivo, periculosidade, recompensa, status, observacoes } = req.body;
        const files = req.files;
        const fotoPrincipal = (_b = (_a = files === null || files === void 0 ? void 0 : files['fotoPrincipal']) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.filename;
        const wanted = yield prisma_1.prisma.wanted.create({
            data: {
                nome,
                documento,
                motivo,
                periculosidade,
                recompensa,
                status: status || 'Procurado',
                observacoes,
                fotoPrincipal: fotoPrincipal ? `/uploads/${fotoPrincipal}` : null
            }
        });
        res.status(201).json(wanted);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar procurado' });
    }
});
exports.createWanted = createWanted;
const listWanted = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wanted = yield prisma_1.prisma.wanted.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(wanted);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar procurados' });
    }
});
exports.listWanted = listWanted;
const getWanted = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ error: 'ID is required' });
        const wanted = yield prisma_1.prisma.wanted.findUnique({ where: { id } });
        if (!wanted)
            return res.status(404).json({ error: 'Procurado não encontrado' });
        res.json(wanted);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
});
exports.getWanted = getWanted;
