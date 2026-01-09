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
exports.listBO = exports.createBO = void 0;
const prisma_1 = require("../utils/prisma");
const createBO = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { comunicante, descricao, local, data } = req.body;
        const bo = yield prisma_1.prisma.bO.create({
            data: {
                comunicante,
                descricao,
                local,
                data: new Date(data),
                policialId: req.user.id
            }
        });
        res.status(201).json(bo);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao registrar BO' });
    }
});
exports.createBO = createBO;
const listBO = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bos = yield prisma_1.prisma.bO.findMany({
            include: { policial: { select: { nome: true } } },
            orderBy: { data: 'desc' }
        });
        res.json(bos);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar BOs' });
    }
});
exports.listBO = listBO;
