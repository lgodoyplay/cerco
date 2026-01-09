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
exports.getPublicArrests = exports.getPublicWanted = void 0;
const prisma_1 = require("../utils/prisma");
const getPublicWanted = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wanted = yield prisma_1.prisma.wanted.findMany({
            where: { status: { not: 'Capturado' } }, // Show active wanted
            select: {
                id: true,
                nome: true,
                motivo: true,
                periculosidade: true,
                recompensa: true,
                fotoPrincipal: true,
                status: true
            },
            orderBy: { periculosidade: 'desc' }
        });
        res.json(wanted);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar procurados públicos' });
    }
});
exports.getPublicWanted = getPublicWanted;
const getPublicArrests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const arrests = yield prisma_1.prisma.arrest.findMany({
            orderBy: { data: 'desc' },
            take: 20, // Limit to recent 20
            select: {
                id: true,
                nomePreso: true,
                data: true,
                motivo: true,
                status: true,
                fotoRosto: true
            }
        });
        res.json(arrests);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar prisões públicas' });
    }
});
exports.getPublicArrests = getPublicArrests;
