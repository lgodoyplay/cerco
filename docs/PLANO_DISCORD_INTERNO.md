# Plano prático: Aba Discord → Sistema de comunicação interna autônomo

## Objetivo

Substituir a integração atual com o Discord por uma pilha própria, mantendo a mesma UX (servidores, canais, mensagens, voz, perfis). Os dados passam a ser persistidos no Supabase e o tempo real continua via Socket.IO.

---

## Escopo

- **Frontend**: reutilizar a interface existente da aba Discord, trocando apenas a camada de dados.
- **Backend**: novo controlador `internalCommsController.ts`, sem proxy Discord nem webhooks.
- **Banco**: novas tabelas no Supabase (`servers`, `channels`, `messages`, `members`, `voice_sessions`).
- **Tempo real**: Socket.IO no `dip-backend`.
- **Voz**: WebRTC (simple-peer ou mediasoup) com sinalização via Socket.IO.

---

## 1. Banco de dados (Supabase)

Criar as tabelas abaixo via SQL Editor do Supabase.

```sql
-- Servidores
create table servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon_url text,
  owner_id uuid references auth.users(id) not null,
  created_at timestamptz default now()
);

-- Canais
create table channels (
  id uuid primary key default gen_random_uuid(),
  server_id uuid references servers(id) on delete cascade not null,
  name text not null,
  type text not null default 'text' check (type in ('text','voice')),
  position int default 0,
  created_at timestamptz default now()
);

-- Mensagens
create table messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  content text not null,
  attachments jsonb,
  created_at timestamptz default now()
);

-- Membros de servidor
create table members (
  id uuid primary key default gen_random_uuid(),
  server_id uuid references servers(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  joined_at timestamptz default now(),
  unique(server_id, user_id)
);

-- Sessões de voz
create table voice_sessions (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  joined_at timestamptz default now(),
  left_at timestamptz
);
```

### Índices sugeridos

```sql
create index idx_channels_server on channels(server_id);
create index idx_messages_channel on messages(channel_id);
create index idx_members_server on members(server_id);
create index idx_voice_channel on voice_sessions(channel_id);
```

### RLS (Row Level Security)

Habilitar RLS nessas tabelas e criar políticas para:
- Leitura: apenas membros do servidor.
- Escrita: apenas dono (server/channel) ou admin do sistema.
- Mensagens: apenas membros do servidor podem enviar/ler.

---

## 2. Backend (dip-backend)

### 2.1. Novo controlador

Criar `src/controllers/internalCommsController.ts` substituindo `discordController.ts`.

```ts
import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

// GET /api/servers
export const listServers = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const servers = await prisma.servers.findMany({
    where: { members: { some: { user_id: userId } } },
    orderBy: { created_at: 'desc' }
  });
  res.json(servers);
};

// POST /api/servers
export const createServer = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { name, icon_url } = req.body;
  const server = await prisma.servers.create({
    data: { name, icon_url, owner_id: userId }
  });
  await prisma.members.create({ data: { server_id: server.id, user_id: userId } });
  res.status(201).json(server);
};

// GET /api/servers/:id/channels
export const listChannels = async (req: Request, res: Response) => {
  const { id } = req.params;
  const channels = await prisma.channels.findMany({
    where: { server_id: id },
    orderBy: { position: 'asc' }
  });
  res.json(channels);
};

// POST /api/servers/:id/channels
export const createChannel = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, type } = req.body;
  const channel = await prisma.channels.create({
    data: { server_id: id, name, type }
  });
  res.status(201).json(channel);
};

// GET /api/channels/:id/messages
export const listMessages = async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    prisma.messages.findMany({
      where: { channel_id: id },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    }),
    prisma.messages.count({ where: { channel_id: id } })
  ]);
  res.json({ data: messages.reverse(), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
};

// POST /api/channels/:id/messages
export const createMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const { content, attachments } = req.body;
  const message = await prisma.messages.create({
    data: { channel_id: id, user_id: userId, content, attachments }
  });
  res.status(201).json(message);
};

// GET /api/servers/:id/members
export const listMembers = async (req: Request, res: Response) => {
  const { id } = req.params;
  const members = await prisma.members.findMany({
    where: { server_id: id },
    include: { profiles: true }
  });
  res.json(members);
};

// POST /api/voice/join
export const joinVoice = async (req: Request, res: Response) => {
  const { channel_id } = req.body;
  const userId = (req as any).user.id;
  const session = await prisma.voice_sessions.create({
    data: { channel_id, user_id: userId }
  });
  res.status(201).json(session);
};

// POST /api/voice/leave
export const leaveVoice = async (req: Request, res: Response) => {
  const { channel_id } = req.body;
  const userId = (req as any).user.id;
  await prisma.voice_sessions.updateMany({
    where: { channel_id, user_id: userId, left_at: null },
    data: { left_at: new Date() }
  });
  res.json({ ok: true });
};
```

### 2.2. Rotas

Atualizar `src/routes/internalCommsRoutes.ts`:

```ts
import { Router } from 'express';
const router = Router();

router.get('/servers', listServers);
router.post('/servers', createServer);
router.get('/servers/:id/channels', listChannels);
router.post('/servers/:id/channels', createChannel);
router.get('/channels/:id/messages', listMessages);
router.post('/channels/:id/messages', createMessage);
router.get('/servers/:id/members', listMembers);
router.post('/voice/join', joinVoice);
router.post('/voice/leave', leaveVoice);

export default router;
```

Montar em `server.ts`:

```ts
import internalCommsRoutes from './routes/internalCommsRoutes';
app.use('/api', internalCommsRoutes);
```

### 2.3. Socket.IO

No `server.ts`, após criar o servidor HTTP, adicionar eventos:

```ts
import { Server } from 'socket.io';

const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('join-server', (serverId) => {
    socket.join(serverId);
  });

  socket.on('send-message', (payload) => {
    io.to(payload.channel_id).emit('message:new', payload);
  });

  socket.on('join-voice', (payload) => {
    socket.join(payload.channel_id);
    io.to(payload.channel_id).emit('voice:joined', payload);
  });

  socket.on('leave-voice', (payload) => {
    socket.leave(payload.channel_id);
    io.to(payload.channel_id).emit('voice:left', payload);
  });
});
```

Exportar `io` para uso nos controladores, se necessário.

---

## 3. Frontend (dip-frontend)

### 3.1. Novos arquivos

Substituir:
- `src/services/discord/discordApi.ts` → `src/services/internalComms/internalApi.ts`
- `src/services/discord/discordSocket.ts` → `src/services/internalComms/internalSocket.ts`

Manter **mesma assinatura** das funções para não quebrar a interface.

`internalApi.ts`:

```ts
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const getGuilds = () => request<any[]>('/servers');
export const getChannels = (guildId: string) => request<any[]>(`/servers/${guildId}/channels`);
export const getMembers = (guildId: string) => request<any[]>(`/servers/${guildId}/members`);
export const getMessages = (channelId: string, limit = 50) => request<any[]>(`/channels/${channelId}/messages?limit=${limit}`);
export const sendMessage = (channelId: string, content: string) => request<any>(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
export const getMember = (memberId: string) => request<any>(`/members/${memberId}`);
export const getBotStatus = () => request<any>('/bot/status');
```

`internalSocket.ts`:

```ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_WS_URL || window.location.origin).replace(/\/$/, '');

export class DiscordSocket {
  private socket: Socket | null = null;
  private listeners: Array<(event: any) => void> = [];

  connect() {
    if (this.socket?.connected) return this.socket;
    this.socket = io(SOCKET_URL, { transports: ['polling', 'websocket'], reconnection: true });
    this.socket.on('connect', () => this.emit({ type: 'connected' }));
    this.socket.on('disconnect', () => this.emit({ type: 'disconnected' }));
    this.socket.on('message:new', (event) => this.emit(event));
    this.socket.on('voice:joined', (event) => this.emit(event));
    this.socket.on('voice:left', (event) => this.emit(event));
    return this.socket;
  }

  on(listener: (event: any) => void) { this.listeners.push(listener); }
  off(listener: (event: any) => void) { this.listeners = this.listeners.filter((item) => item !== listener); }
  emit(event: any) { this.listeners.forEach((listener) => listener(event)); }
  disconnect() { this.socket?.disconnect(); this.socket = null; }
}

export const discordSocket = new DiscordSocket();
```

### 3.2. Hooks

Renomear hooks mantendo a mesma interface:

- `src/hooks/useDiscordServers.ts` → `src/hooks/useInternalServers.ts`
- `src/hooks/useDiscordChannels.ts` → `src/hooks/useInternalChannels.ts`
- `src/hooks/useDiscordMessages.ts` → `src/hooks/useInternalMessages.ts`
- `src/hooks/useDiscordMembers.ts` → `src/hooks/useInternalMembers.ts`
- `src/hooks/useDiscordVoice.ts` → `src/hooks/useInternalVoice.ts`

A lógica interna muda para consumir `/api/servers`, `/api/channels`, etc., mas os nomes e retornos dos hooks permanecem iguais.

### 3.3. Página DiscordPage.jsx

Manter o arquivo inalterado, exceto pelos imports:

```tsx
import { getGuilds, getChannels, getMembers, getMessages, sendMessage, getMember, getBotStatus } from '../../../services/internalComms/internalApi';
import { discordSocket } from '../../../services/internalComms/internalSocket';
```

### 3.4. Variáveis de ambiente

Atualizar `dip-frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
VITE_TURN_URL=stun:stun.l.google.com:19302
VITE_TURN_CRED=
```

Remover:
- `VITE_DISCORD_API_URL`
- `VITE_DISCORD_SOCKET_URL`

---

## 4. Voz (WebRTC)

### 4.1. Visão geral

Substituir o mock atual por WebRTC peer-to-peer com sinalização via Socket.IO.

### 4.2. Backend (sinalização)

Em `server.ts`, adicionar eventos no Socket.IO:

```ts
socket.on('webrtc-offer', (payload) => {
  socket.to(payload.target).emit('webrtc-offer', { sender: socket.id, ...payload });
});

socket.on('webrtc-answer', (payload) => {
  socket.to(payload.target).emit('webrtc-answer', { sender: socket.id, ...payload });
});

socket.on('webrtc-ice-candidate', (payload) => {
  socket.to(payload.target).emit('webrtc-ice-candidate', { sender: socket.id, ...payload });
});
```

### 4.3. Frontend (simple-peer)

Instalar dependência:

```bash
cd dip-frontend && npm install simple-peer
```

Atualizar `useInternalVoice.ts`:

- Quando usuário entra em canal de voz:
  - Chamar `POST /api/voice/join`
  - Emitir `join-voice` via Socket.IO
  - Iniciar `getUserMedia({ audio: true })`
  - Criar `Peer` para cada membro conectado
- Quando receber `voice:joined` via Socket.IO:
  - Criar `Peer` e negociar offer/answer/ICE
- Quando usuário sai:
  - Chamar `POST /api/voice/leave`
  - Fechar todos os peers
  - Parar stream de áudio

### 4.4. STUN/TURN

Configurar servidores STUN/TURN para funcionar atrás de NAT:

```ts
const peer = new Peer({ initiator: true, trickle: true, config: { iceServers: [{ urls: import.meta.env.VITE_TURN_URL || 'stun:stun.l.google.com:19302' }] } });
```

---

## 5. Permissões e criação de grupos

### Regras

- Qualquer usuário autenticado pode criar servidor e canais.
- Dono do servidor convida membros via `POST /api/servers/:id/members`.
- Canais são listados conforme membership do usuário.
- Apenas membros do servidor podem enviar/ler mensagens e entrar em canais de voz.

### Backend (middleware)

Criar middleware `requireServerMember`:

```ts
export const requireServerMember = async (req: Request, res: Response, next: Function) => {
  const userId = (req as any).user.id;
  const { serverId } = req.params;
  const member = await prisma.members.findFirst({ where: { server_id: serverId, user_id: userId } });
  if (!member) return res.status(403).json({ error: 'Acesso negado' });
  next();
};
```

Aplicar nas rotas de canais, mensagens e voz.

---

## 6. Variáveis de ambiente (resumo)

### Frontend (`dip-frontend`)

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base do backend (`http://localhost:3000/api`) |
| `VITE_WS_URL` | URL do Socket.IO (`http://localhost:3000`) |
| `VITE_TURN_URL` | Servidor STUN/TURN (opcional) |
| `VITE_TURN_CRED` | Credenciais TURN (opcional) |

### Backend (`dip-backend`)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do Supabase |
| `JWT_SECRET` | Segredo JWT |
| `NODE_ENV` | `production` |

### Bot (`bot`) — não será mais usado para comunicação interna

Remover ou desativar após migração.

---

## 7. Migração e deploy

### 7.1. Ordem de execução

1. Criar tabelas no Supabase (passo 1).
2. Atualizar `PrismaClient` com novo schema (`npx prisma generate`).
3. Implementar backend (`internalCommsController.ts`, rotas, Socket.IO).
4. Implementar frontend (`internalApi.ts`, `internalSocket.ts`, hooks).
5. Testar localmente (`npm run dev` no backend e frontend).
6. Atualizar `.env` de produção com `VITE_API_URL` e `VITE_WS_URL` corretos.
7. Deploy backend no Render.
8. Deploy frontend no Vercel/Cloudflare Pages.

### 7.2. Arquivos a remover/renomear

| Ação | Arquivo |
|------|---------|
| Remover | `src/services/discord/discordApi.ts` |
| Remover | `src/services/discord/discordSocket.ts` |
| Remover | `src/services/discord/discordService.ts` |
| Remover | `src/services/discord/discordTypes.ts` |
| Remover | `src/data/discordMock.ts` |
| Renomear | `src/pages/private/communication/DiscordPage.jsx` → manter nome ou `InternalCommsPage.jsx` |
| Renomear | `src/hooks/useDiscord*.ts` → `useInternal*.ts` |
| Renomear | `src/components/discord/*` → `src/components/internalComms/*` |
| Remover | Bot inteiro (`bot/`) ou arquivar |

### 7.3. Deploy

- `vercel.json` e `netlify.toml` não precisam de alteração (apenas build do frontend).
- `render.yaml` não precisa de alteração (serviço do backend).
- Configurar variáveis de ambiente nas respectivas plataformas.

---

## 8. Resultado esperado

- Aba Discord funciona 100% offline do Discord.
- Usuários criam servidores, canais de texto/voz, trocam mensagens e entram em chamadas usando a mesma interface.
- Dados persistidos no Supabase.
- Tempo real via Socket.IO (mensagens, presença, voz).
- WebRTC para chamadas de voz ponto a ponto.
- Permissões baseadas em membership.

---

## 9. Checklist de testes

- [ ] Criar servidor e verificar listagem
- [ ] Criar canais de texto e voz
- [ ] Enviar mensagem e receber em tempo real
- [ ] Entrar em canal de voz (áudio funciona)
- [ ] Sair de canal de voz
- [ ] Convidar membro para servidor
- [ ] Verificar permissões (não-membro não acessa)
- [ ] Deploy backend e frontend em produção
- [ ] Testar em dispositivos diferentes (WebRTC)
