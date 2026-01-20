# Guia de Implantação (Deployment) - Sistema Polícia Federal - DPF

Este guia descreve como colocar o sistema Sistema Polícia Federal - DPF em funcionamento em um servidor Linux (Ubuntu 22.04 recomendada).
- **Frontend:** React (Vite) -> Deploy no **Netlify**
- **Backend:** Node.js (Express) -> Deploy no **Render**
- **Banco de Dados:** PostgreSQL -> Hospedado no **Supabase**

---

## 1. Configurar Banco de Dados (Supabase)

1. Crie uma conta em [supabase.com](https://supabase.com).
2. Crie um novo projeto.
3. Vá em **Project Settings > Database** e copie a **Connection String** (selecione a aba "Nodejs").
   - Ela se parece com: `postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres`
   - Substitua `[PASSWORD]` pela senha que você criou.
4. Guarde essa URL, ela será sua `DATABASE_URL`.

---

## 2. Deploy do Backend (Render)

O backend precisa rodar 24/7 para atender as requisições do painel.

1. Crie uma conta em [render.com](https://render.com).
2. Clique em **New +** e selecione **Web Service**.
3. Conecte seu repositório do GitHub (`lgodoyplay/dpf-system`).
4. O Render deve detectar o arquivo `render.yaml` na raiz, mas se pedir configurações manuais:
   - **Root Directory:** `dip-backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Em **Environment Variables**, adicione:
   - `DATABASE_URL`: (Cole a URL do Supabase aqui)
   - `JWT_SECRET`: (Crie uma senha forte e aleatória)
   - `NODE_ENV`: `production`
6. Clique em **Create Web Service**.
7. Aguarde o deploy finalizar. Copie a URL do serviço (ex: `https://cerco-backend.onrender.com`).

---

## 3. Deploy do Frontend (Netlify)

1. Crie uma conta em [netlify.com](https://netlify.com).
2. Clique em **Add new site** > **Import from Git**.
3. Conecte seu GitHub e selecione o repositório `cerco`.
4. Configurações de Build:
   - **Base directory:** `dip-frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Clique em **Deploy site**.
6. Vá em **Site configuration > Environment variables** e adicione:
   - Key: `VITE_API_URL`
   - Value: (Cole a URL do seu backend no Render, sem a barra no final, ex: `https://dpf-backend.onrender.com`)
7. O Netlify vai reconstruir o site.

---

## 4. Finalização

- Abra o link do Netlify.
- Tente fazer login. O sistema vai conectar no Render -> Supabase.
- **Atenção:** Como o banco é novo (Postgres), ele estará vazio. Você precisará criar o primeiro usuário via Banco de Dados (SQL Editor no Supabase) ou criar uma rota de "seed" temporária.

### SQL para criar admin inicial (Rode no Supabase SQL Editor):
```sql
INSERT INTO "User" (id, nome, login, "senhaHash", cargo, patente, permissoes, ativo, "updatedAt")
VALUES (
  'admin-id-123', 
  'Administrador', 
  'admin', 
  '$2a$10$X7...', -- Gere um hash de senha válido (ex: 'admin' em bcrypt)
  'Administrador', 
  'Delegado', 
  '["admin"]', 
  true, 
  NOW()
);
```
(Para gerar hash bcrypt online: https://bcrypt-generator.com/)

---
**Status do Projeto:**
- ✅ Prisma configurado para PostgreSQL
- ✅ Frontend preparado para SPA (Netlify)
- ✅ API URL parametrizada
- ✅ Scripts de build configurados
