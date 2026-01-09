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
exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../utils/prisma");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { login, password } = req.body;
    try {
        const user = yield prisma_1.prisma.user.findUnique({ where: { login } });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        if (!user.ativo) {
            return res.status(403).json({ error: 'Usuário inativo' });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.senhaHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, cargo: user.cargo }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
        // Log login
        yield prisma_1.prisma.log.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
exports.login = login;
