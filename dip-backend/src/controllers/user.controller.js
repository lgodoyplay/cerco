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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = exports.deleteUser = exports.updateUser = exports.createUser = void 0;
const prisma_1 = require("../utils/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nome, login, senha, cargo, patente, permissoes } = req.body;
        const hashedPassword = yield bcryptjs_1.default.hash(senha, 10);
        const user = yield prisma_1.prisma.user.create({
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
        const { senhaHash } = user, userWithoutPassword = __rest(user, ["senhaHash"]);
        res.status(201).json(userWithoutPassword);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});
exports.createUser = createUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { nome, login, cargo, patente, permissoes, ativo, senha } = req.body;
        const data = { nome, login, cargo, patente, ativo };
        if (permissoes) {
            data.permissoes = JSON.stringify(permissoes);
        }
        if (senha) {
            data.senhaHash = yield bcryptjs_1.default.hash(senha, 10);
        }
        const user = yield prisma_1.prisma.user.update({
            where: { id },
            data
        });
        const { senhaHash } = user, userWithoutPassword = __rest(user, ["senhaHash"]);
        res.json(userWithoutPassword);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.prisma.user.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
});
exports.deleteUser = deleteUser;
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.prisma.user.findMany({
            select: { id: true, nome: true, login: true, cargo: true, patente: true, permissoes: true, ativo: true }
        });
        // Parse permissions
        const formattedUsers = users.map(u => (Object.assign(Object.assign({}, u), { permissoes: u.permissoes ? JSON.parse(u.permissoes) : [] })));
        res.json(formattedUsers);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});
exports.listUsers = listUsers;
