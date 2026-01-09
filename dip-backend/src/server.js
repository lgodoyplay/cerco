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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("./utils/prisma");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const arrest_routes_1 = __importDefault(require("./routes/arrest.routes"));
const wanted_routes_1 = __importDefault(require("./routes/wanted.routes"));
const bo_routes_1 = __importDefault(require("./routes/bo.routes"));
const investigation_routes_1 = __importDefault(require("./routes/investigation.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/users', user_routes_1.default);
app.use('/arrests', arrest_routes_1.default);
app.use('/wanted', wanted_routes_1.default);
app.use('/bo', bo_routes_1.default);
app.use('/investigations', investigation_routes_1.default);
app.use('/public', public_routes_1.default);
// Seed Admin User
function seedAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const adminExists = yield prisma_1.prisma.user.findFirst({ where: { login: 'admin' } });
            if (!adminExists) {
                const hashedPassword = yield bcryptjs_1.default.hash('admin123', 10);
                yield prisma_1.prisma.user.create({
                    data: {
                        nome: 'Administrador Mestre',
                        login: 'admin',
                        senhaHash: hashedPassword,
                        cargo: 'Delegado Chefe',
                        patente: 'Comissário',
                        permissoes: '["admin", "create", "read", "update", "delete"]',
                        ativo: true
                    }
                });
                console.log('Admin user created: admin / admin123');
            }
        }
        catch (error) {
            console.error('Error seeding admin:', error);
        }
    });
}
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    yield seedAdmin();
    console.log(`Server running on port ${PORT}`);
}));
