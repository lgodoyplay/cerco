-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "patente" TEXT NOT NULL,
    "permissoes" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Arrest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomePreso" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "artigos" TEXT NOT NULL,
    "policialId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Preso',
    "descricao" TEXT,
    "fotoRosto" TEXT,
    "fotoBolsa" TEXT,
    "fotoTablet" TEXT,
    "fotoAbordagem" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Arrest_policialId_fkey" FOREIGN KEY ("policialId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wanted" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "motivo" TEXT NOT NULL,
    "periculosidade" TEXT NOT NULL,
    "recompensa" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Procurado',
    "fotoPrincipal" TEXT,
    "outrasFotos" TEXT,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BO" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comunicante" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "policialId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aberto',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BO_policialId_fkey" FOREIGN KEY ("policialId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Em Andamento',
    "investigadorId" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Investigation_investigadorId_fkey" FOREIGN KEY ("investigadorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investigacaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "descricao" TEXT,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_investigacaoId_fkey" FOREIGN KEY ("investigacaoId") REFERENCES "Investigation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");
