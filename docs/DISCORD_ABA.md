# Como funciona a aba Discord do Dashboard

## Visão Geral

A aba **Discord** (`/dashboard/discord`) é uma interface web que simula o cliente do Discord dentro do painel CERCO. Ela permite que agentes visualizem servidores, canais, mensagens e membros sem sair do sistema operacional da instituição.

A integração é feita em duas camadas:

- **HTTP REST** — consulta dados do Discord via backend Node.js/Express
- **WebSocket (Socket.IO)** — atualizações em tempo real entre backend e frontend

> **Importante:** a página Discord **não se comunica diretamente com a API do Discord** nem com o Supabase. Todo o tráfego passa pelo `dip-backend`.

---

## Arquitetura dos arquivos

```
dip-frontend/
  src/
    components/
      discord/
        DiscordServerList.jsx
        DiscordChannelSidebar.jsx
        DiscordMessageList.jsx
        DiscordMessageInput.jsx
        DiscordMemberList.jsx
        DiscordUserProfile.jsx
        DiscordVoicePanel.jsx
        DiscordVoiceMiniPlayer.jsx
    hooks/
      useDiscordSocket.ts
      useDiscordServers.ts
      useDiscordChannels.ts
      useDiscordMessages.ts
      useDiscordMembers.ts
      useDiscordVoice.ts
    pages/
      private/
        communication/
          DiscordPage.jsx
    services/
      discord/
        discordApi.ts
        discordSocket.ts
        discordService.ts
        discordTypes.ts
    data/
      discordMock.ts
```

| Arquivo | Função |
|---------|--------|
| `DiscordPage.jsx` | Página principal — monta layout com listas de servidores, canais, mensagens, membros e voz |
| `discordApi.ts` | Cliente HTTP para o backend (`/api/discord`) |
| `discordSocket.ts` | Wrapper do `socket.io-client` para eventos em tempo real |
| `discordService.ts` | Serviço com **dados mockados** (fallback quando o backend não está disponível) |
| `discordTypes.ts` | Tipos TypeScript compartilhados |
| `discordMock.ts` | Dados mockados alternativos (não utilizados pelo fluxo principal) |
| `useDiscordSocket.ts` | Hook que gerencia estado da conexão WebSocket |

---

## Fluxo de carregamento

1. Usuário clica em **Discord** no menu lateral (`PrivateLayout.jsx`)
2. O roteador carrega `DiscordPage.jsx`
3. A página executa `loadInitialData()`:
   - Chama `getGuilds()` → `GET /api/discord/guilds`
   - Para o primeiro servidor retornado, busca canais e membros
4. Paralelamente, o hook `useDiscordSocket` conecta o Socket.IO
5. Eventos recebidos atualizam o estado local (mensagens, conexão, presença)

Se o backend não responder, o serviço retorna **dados mockados**, então a interface continua funcionando visualmente.

---

## Comunicação HTTP (REST)

Arquivo: `src/services/discord/discordApi.ts`

### URL Base

```ts
const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_DISCORD_API_URL || '';
const API_BASE = normalizeApiBase(configuredApiUrl);
```

- Se `VITE_API_URL` estiver definida, usa-a como base
- Caso contrário, usa `/api/discord` (caminho relativo)

Exemplos válidos:

```env
VITE_API_URL=http://localhost:3000/api/discord
VITE_API_URL=https://meu-backend.render.com/api/discord
```

### Endpoints consumidos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/guilds` | Lista servidores |
| GET | `/guilds/:guildId/channels` | Canais de um servidor |
| GET | `/guilds/:guildId/members` | Membros de um servidor |
| GET | `/channels/:channelId/messages` | Mensagens de um canal |
| POST | `/channels/:channelId/messages` | Envia mensagem |
| GET | `/members/:memberId` | Detalhes de um membro |
| GET | `/bot/status` | Status do bot |

### Header customizado

Todas as requisições enviam:

```
Content-Type: application/json
x-dashboard-user-id: dashboard
```

> O header `x-dashboard-user-id` está **hardcoded** como `'dashboard'` e não representa o usuário logado no momento.

---

## Comunicação em tempo real (WebSocket)

Arquivo: `src/services/discord/discordSocket.ts`

### URL do Socket

```ts
const SOCKET_URL = resolveSocketUrl();
```

Resolução da URL:

1. `VITE_WS_URL`
2. `VITE_DISCORD_SOCKET_URL`
3. `window.location.origin` (origem da página)
4. `''` (vazio — conexão falha silenciosamente)

Exemplos válidos:

```env
VITE_WS_URL=http://localhost:3000
VITE_WS_URL=https://meu-backend.render.com
```

### Eventos

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `connect` | recebido | Conexão estabelecida |
| `disconnect` | recebido | Conexão encerrada |
| `reconnecting` | recebido | Reconectando |
| `connect_error` | recebido | Erro de conexão |
| `discord:event` | recebido | Eventos do Discord repassados pelo backend |

Eventos internos emitidos para a UI:

```ts
{ type: 'connected' }
{ type: 'disconnected' }
{ type: 'reconnecting' }
{ type: 'discord:event', event: {...} }
```

---

## Backend (dip-backend)

O backend responsável pela aba Discord está em `dip-backend/src/controllers/discordController.ts`.

Ele expõe a rota `/api/discord` e funciona como proxy para o **bot do Discord** hospedado separadamente. O bot usa `discord.js` e se comunica com o backend via HTTP (`POST /api/discord/bot/events`).

Fluxo do backend:

```
Frontend → dip-backend (/api/discord) → Bot Discord (discord.js)
                      ↑
               Socket.IO (tempo real)
```

Arquivo do bot: `bot/src/index.ts`

---

## Variáveis de ambiente necessárias

No **frontend** (`dip-frontend/.env` ou variáveis de ambiente da plataforma de deploy):

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_API_URL` | Não* | URL base da API do backend Discord |
| `VITE_WS_URL` | Não* | URL do WebSocket do backend |
| `VITE_SUPABASE_URL` | Não | Usada por outras partes do sistema, não pela aba Discord |

> \* Se não definidas, caem para `/api/discord` e `window.location.origin`, respectivamente.

No **backend** (`dip-backend/.env`):

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string do banco |
| `JWT_SECRET` | Sim | Segredo para assinar tokens |
| `NODE_ENV` | Não | `production` em produção |

No **bot** (`bot/.env`):

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DISCORD_BOT_TOKEN` | Sim | Token do bot Discord |
| `DISCORD_CLIENT_ID` | Sim | ID da aplicação Discord |
| `DISCORD_GUILD_ID` | Sim | ID do servidor alvo |
| `BACKEND_URL` | Sim | URL do dip-backend |
| `BOT_API_SECRET` | Sim | Segredo para autenticar bot → backend |

---

## Deploy

O projeto inclui arquivos de configuração para diferentes plataformas:

| Plataforma | Arquivo | Observação |
|------------|---------|------------|
| **Vercel** | `vercel.json` | Build do `dip-frontend` como static build |
| **Netlify** | `netlify.toml` | Build do `dip-frontend` com redirect SPA |
| **Render** | `render.yaml` | Deploy do `dip-backend` como web service Node.js |

Para produção, recomenda-se:
- Backend no **Render** ou VPS
- Frontend no **Vercel** ou **Cloudflare Pages**
- Bot em processo separado (Render, PM2, etc.)

---

## Observações técnicas

### Dados mockados

`src/services/discord/discordService.ts` retorna dados fixos via `Promise.resolve(mockServers)` independente de o backend estar disponível. Isso significa que a página **sempre funciona visualmente**, mas pode estar desconectada do Discord real.

### Voz mockada

O hook `useDiscordVoice.ts` tem `isMockMode: true` hardcoded. Os controles de voz atualizam apenas estado local — não conectam a nenhum serviço real de voz.

### Service Worker / Workbox

O PWA configurado em `vite.config.js` usa Workbox com `runtimeCaching`. Requisições para `*.supabase.co` usam `NetworkOnly`, mas o Service Worker pode interceptar outras requisições e gerar erros `no-response` no console quando a rede falhar.

### CORS

O erro de CORS contra `kelrfiwnrmtinflqcbzc.supabase.co` **não é causado pela aba Discord**. A página Discord não usa Supabase diretamente. O bloqueio vem de:
- `PrivateLayout.jsx` carregando notificações via Supabase Realtime
- `AuthContext.jsx` usando `supabase.auth`
- `SettingsContext.jsx` usando Supabase para configurações e logs

Esses componentes globais continuam ativos mesmo quando a aba Discord está aberta.

---

## Solução de problemas

### Aba Discord não carrega dados

1. Verifique se `VITE_API_URL` está apontando para o backend correto
2. Verifique se o backend está rodando e acessível
3. Verifique se o bot Discord está online e conectado ao backend
4. Abra o DevTools → Network para ver se as requisições para `/api/discord/*` estão respondendo

### Erro de CORS no Supabase

1. Acesse o painel do Supabase do projeto
2. Vá em **Settings → API → CORS**
3. Adicione a origem do frontend (ex: `https://cerco-ccv.pages.dev`)
4. Salve

### Socket.IO não conecta

1. Verifique se `VITE_WS_URL` está definida corretamente
2. Verifique se o backend tem o Socket.IO ativo na porta correta
3. Verifique se não há bloqueio de firewall ou proxy reverso

### Interface funciona mas dados são mockados

1. Verifique se o backend está acessível
2. Verifique se o bot está conectado ao servidor Discord
3. Verifique logs do backend para erros na comunicação com o Discord
