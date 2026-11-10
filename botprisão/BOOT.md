# 📘 Documentação do Boot e Sistema de Abas — Polícia Civil RP Bot

---

## 1. Arquivo Boot (`src/index.js`)

O arquivo `src/index.js` é o **ponto de entrada** (bootstrap) do bot. Ele executa as seguintes etapas em ordem:

### 1.1 Carregamento de Variáveis de Ambiente
```js
require('dotenv').config();
```
Carrega as variáveis do arquivo `.env` para o processo. As variáveis obrigatórias são:
- `DISCORD_TOKEN` — Token do bot no Discord Developer Portal
- `CLIENT_ID` — ID da aplicação Discord
- `SUPABASE_URL` — URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Chave de serviço do Supabase
- `DEPLOY_GUILD_ID` — ID do servidor de testes (opcional, recomendado)

### 1.2 Conexão com o Banco de Dados
```js
await connectDatabase();
```
Inicializa a conexão com o banco de dados local (`data/pc_local_db.json`). O bot usa um banco local JSON (não Supabase diretamente para operações correntes) como camada de persistência.

### 1.3 Construção do Cliente Discord
```js
const client = await buildClient();
```
Chama `src/lib/buildClient.js` que:
- Cria uma instância do `Client` do discord.js v14
- Configura intents (`Guilds`, `GuildMessages`, opcionalmente `GuildMembers` e `MessageContent`)
- Carrega comandos slash de `src/commands/` automaticamente (varredura recursiva)
- Registura eventos de `src/events/` automaticamente
- Registra o roteador de interações (`componentRouter`)

### 1.4 Proteção Anti-Crash
```js
process.on('unhandledRejection', ...);
process.on('uncaughtException', ...);
process.on('warning', ...);
```
Captura erros não tratados em promessas, exceções não capturadas e avisos do Node.js, registrando-os via Winston logger.

### 1.5 Login
```js
await client.login(process.env.DISCORD_TOKEN);
```
Autentica o bot no Discord e o deixa online. Após o evento `ready`, o bot:
- Carrega os IDs dos comandos slash
- Garante que todos os painéis (embeds com botões) estão publicados nos canais configurados
- Inicia o scheduler do timeclock

---

## 2. Arquitetura Geral

```
src/
├── index.js                  ← BOOT (ponto de entrada)
├── commands/                 ← Comandos Slash (prisao, procurado, fotos)
├── events/                   ← Eventos Discord (ready, messageCreate, guildMemberAdd, interactionCreate)
├── lib/
│   ├── buildClient.js        ← Constrói o cliente Discord
│   ├── database.js           ← Conexão Supabase (não utilizada diretamente nas operações)
│   ├── embeds.js             ← Função baseEmbed() para embeds padronizados
│   ├── localDb.js            ← Persistência local em JSON (data/pc_local_db.json)
│   ├── logger.js             ← Logger Winston
│   └── handlers/
│       ├── commands.js       ← Carrega comandos dinamicamente
│       ├── events.js         ← Registra eventos dinamicamente
│       └── interactions.js   ← Roteador central de interações (botões, modais, selects)
├── repositories/
│   └── db.js                 ← Todas as operações CRUD do banco local
├── services/
│   ├── guildConfig.js        ← Configuração por servidor (cargos, canais, painéis)
│   ├── mediaStorage.js       ← Upload de anexos (Discord CDN)
│   └── supabaseClient.js     ← Cliente Supabase (configuração)
├── systems/
│   ├── bo/boFlow.js          ← Sistema de Boletim de Ocorrência
│   ├── verification/         ← Sistema de Login/Verificação
│   ├── prisao/               ← (comando /prisao, integrado via commandExecutor)
│   ├── wanted/               ← Sistema de Procurados
│   ├── investigations/       ← Sistema de Investigações
│   ├── tickets/              ← Sistema de Corregedoria (tickets)
│   ├── courses/              ← Sistema de Cursos
│   ├── notices/              ← Sistema de Avisos
│   ├── exoneration/          ← Sistema de Exoneração
│   ├── timeclock/            ← Sistema de Bate Ponto
│   ├── setup/panels.js       ← Criação automática de painéis
│   └── interactions/
│       └── componentRouter.js ← Roteador de botões/selects/modais
├── config/
│   └── defaults.js           ← Configurações padrão (cargos, canais, cores)
└── systems/commands/
    └── commandExecutor.js    ← Executa comandos slash com cooldown
```

---

## 2.1 Estrutura Completa de Diretórios e Arquivos

```
POLICIACIVILEUFORIA/
│
├── .env                          ← Variáveis de ambiente (token, IDs, chaves)
├── .env.example                  ← Template de variáveis de ambiente
├── .npm/                         ← Dados internos do npm
│   ├── _update-notifier-last-checked
│   └── _logs/
│       ├── 2026-06-03T01_50_49_454Z-debug-0.log
│       └── 2026-06-22T02_36_24_747Z-debug-0.log
├── .cache/                       ← Cache do npm
├── data/                         ← Banco de dados local JSON
│   └── pc_local_db.json          ← Persistência de todos os registros do bot
├── scripts/                      ← Scripts auxiliares
│   └── deploy-commands.js        ← Script para deploy dos Slash Commands no Discord
├── src/                          ← Código-fonte principal
│   ├── index.js                  ← 🔥 BOOT — ponto de entrada do bot
│   │
│   ├── commands/                 ← Comandos Slash do Discord
│   │   ├── prisao.js             ← /prisao — registro de prisão
│   │   ├── procurado.js          ← /procurado — registro de procurado
│   │   └── fotos.js              ← /fotos — envio de mídias para investigação
│   │
│   ├── events/                   ← Eventos do Discord
│   │   ├── ready.js              ← Evento ready: setup de painéis + scheduler
│   │   ├── interactionCreate.js  ← Router de interações (botões, modais, selects)
│   │   ├── messageCreate.js      ← Evento de mensagem (placeholder para uploads)
│   │   └── guildMemberAdd.js     ← Auto-cargo ao membro entrar no servidor
│   │
│   ├── lib/                      ← Bibliotecas internas e infraestrutura
│   │   ├── buildClient.js        ← Construção do cliente Discord (intents, handlers)
│   │   ├── database.js           ← Conexão Supabase (configuração)
│   │   ├── embeds.js             ← Função baseEmbed() para embeds padronizados
│   │   ├── localDb.js            ← Persistência local em JSON (data/pc_local_db.json)
│   │   ├── logger.js             ← Logger Winston (info, warn, error, debug)
│   │   └── handlers/             ← Handlers de carregamento
│   │       ├── commands.js       ← Carrega comandos slash dinamicamente de src/commands/
│   │       ├── events.js         ← Registra eventos dinamicamente de src/events/
│   │       └── interactions.js   ← Roteador central de interações (componentRouter)
│   │
│   ├── repositories/             ← Camada de acesso a dados (CRUD)
│   │   └── db.js                 ← Todas as operações de banco (local JSON)
│   │
│   ├── services/                 ← Serviços de negócio
│   │   ├── guildConfig.js        ← Configuração por servidor (getOrCreate, set, updatePanels)
│   │   ├── mediaStorage.js       ← Upload de anexos (Discord CDN)
│   │   └── supabaseClient.js     ← Cliente Supabase (configuração)
│   │
│   ├── config/                   ← Configurações estáticas
│   │   └── defaults.js           ← Cores, cargos padrão, canais padrão, painéis padrão
│   │
│   └── systems/                  ← Sistemas funcionais do bot
│       ├── bo/
│       │   └── boFlow.js         ← Sistema de Boletim de Ocorrência (BO)
│       │
│       ├── verification/
│       │   └── verificationFlow.js ← Sistema de Login/Verificação institucional
│       │
│       ├── investigations/
│       │   └── investigationFlow.js ← Sistema de Investigações (wizard + evidências + PDF)
│       │
│       ├── wanted/
│       │   └── wantedFlow.js     ← Sistema de Procurados (captura + integração prisão)
│       │
│       ├── tickets/
│       │   └── ticketFlow.js     ← Sistema de Corregedoria (denúncias sigilosas + tickets)
│       │
│       ├── courses/
│       │   └── coursesFlow.js    ← Sistema de Cursos (solicitação + instrução + cargo)
│       │
│       ├── notices/
│       │   └── noticesFlow.js    ← Sistema de Avisos Oficiais
│       │
│       ├── exoneration/
│       │   └── exonerationFlow.js ← Sistema de Exoneração (solicitação + execução)
│       │
│       ├── timeclock/
│       │   └── timeclockFlow.js  ← Sistema de Bate Ponto (40min = 20k, auto-close 3h)
│       │
│       ├── setup/
│       │   └── panels.js         ← Criação/recuperação automática de painéis nos canais
│       │
│       └── interactions/
│           └── componentRouter.js ← Roteador central de botões, selects e modais
│
├── src/systems/commands/
│   └── commandExecutor.js        ← Executa comandos slash com sistema de cooldown
│
├── discloud.config               ← Configuração do Discloud (hospedagem)
├── package.json                  ← Dependências e scripts do projeto
└── README.md                     ← Documentação básica do projeto
```

### 2.2 Resumo dos Arquivos Principais

| Arquivo | Função |
|---------|--------|
| `src/index.js` | **BOOT** — Inicializa o bot: carrega .env, conecta DB, buildClient, anti-crash, login |
| `src/lib/buildClient.js` | Cria o cliente Discord, carrega comandos/eventos/handlers, configura intents |
| `src/lib/localDb.js` | Persistência local em JSON (`data/pc_local_db.json`) com write queue thread-safe |
| `src/lib/handlers/interactions.js` | Roteador que recebe todas as interações e direciona para o componentRouter |
| `src/systems/interactions/componentRouter.js` | Centro de roteamento: botões → handlers, selects → handlers, modais → handlers |
| `src/repositories/db.js` | CRUD completo para todas as coleções do banco local |
| `src/services/guildConfig.js` | Gerencia configuração por servidor (cargos, canais, painéis) com merge profundo |
| `src/config/defaults.js` | Valores padrão: cores, cargos, canais, IDs de painéis |
| `src/systems/setup/panels.js` | Cria e recupera todos os painéis de abas nos canais do servidor |
| `src/events/ready.js` | Evento ready: carrega commandIds, garante painéis, inicia scheduler timeclock |
| `src/events/guildMemberAdd.js` | Auto-atribui cargo ao membro entrar no servidor |
| `src/systems/commands/commandExecutor.js` | Executa `/prisao`, `/procurado`, `/fotos` com cooldown e tratamento de erros |

---

## 3. Aba 1 — LOGIN / VERIFICAÇÃO (`verificationFlow.js`)

### 3.1 Fluxo Completo
O sistema de verificação é composto por **5 etapas** sequenciais:

#### Etapa 1: Botão "INICIAR VERIFICAÇÃO"
- O usuário clica no botão no painel de verificação
- `handleVerificationButton` responde com um embed ephemeral e um menu de categorias

#### Etapa 2: Seleção de Categoria
- O usuário seleciona uma categoria no menu suspenso:
  - 📁 **Integração** — Jovem Aprendiz • Aluno
  - 🏢 **Administrativo** — Investigativo • Escrivão • Perito • Agentes
  - 👑 **Alto Escalão** — Comando • Procuradoria • Comissariado
  - 🦅 **DEGEN** — Delegados
  - 🏛️ **Integração Governamental** — SSP • Hospital • Policial • Jurídico
- `handleVerificationModal` processa a seleção e exibe o menu de cargos

#### Etapa 3: Seleção de Cargo
- Exibe apenas os cargos da categoria selecionada (até 25)
- O usuário seleciona um cargo e clica em continuar
- Abre um modal com campos de identificação

#### Etapa 4: Modal de Identificação
Campos do modal:
| Campo | Obrigatório | Max Length |
|-------|-------------|------------|
| Nome RP | Sim | 32 |
| Passaporte | Sim | 10 |
| Departamento | Sim | 40 (pré-preenchido com a categoria) |
| Observações | Não | 900 |

#### Etapa 5: Processamento e Aprovação
- O bot salva o perfil do membro (`upsertMemberProfile`) no banco local
- Altera o nickname do usuário para `NomeRP ┃ Passaporte`
- Aplica o cargo "Verificado"
- Cria uma solicitação de seleção de cargos (`createRoleSelectionRequest`)
- Envia um embed para o canal de aprovação com botões **Aprovar** e **Recusar**

### 3.2 Aprovação de Cargos
- Apenas **Administradores** ou quem tem o cargo **Recrutador** podem aprovar/recusar
- Ao aprovar:
  - Os cargos selecionados são aplicados ao membro
  - Se for um cargo policial (não-integração), o cargo "Corp" é adicionado automaticamente
  - A solicitação é marcada como `APPROVED`
- Ao recusar:
  - A solicitação é marcada como `DENIED`
  - Os botões são desabilitados

### 3.3 Funções Exportadas
- `handleVerificationButton` — Abre o painel de categorias
- `handleVerificationModal` — Processa categoria → cargo → modal → identificação
- `handleRoleSelect` — Processa a seleção de cargos pelo usuário
- `handleRoleApproval` — Processa aprovação/recusa por administradores

---

## 4. Aba 2 — PRISÕES (`/prisao` command + `prisao.js`)

### 4.1 Comando Slash `/prisao`
O comando registra uma prisão oficial com uploads nativos do Discord.

### 4.2 Campos do Comando
| Campo | Obrigatório | Max Length | Tipo |
|-------|-------------|------------|------|
| `nome` | Sim | 50 | String |
| `passaporte` | Sim | 20 | String |
| `motivo` | Sim | 900 | String |
| `tempo` | Sim | 30 | String |
| `multa` | Sim | 30 | String |
| `observacoes` | Sim | 900 | String |
| `foto_suspeito` | Sim | — | Attachment (imagem) |
| `foto_mochila` | Sim | — | Attachment (imagem) |
| `foto_tablet` | Sim | — | Attachment (imagem) |
| `prova_1` a `prova_4` | Não | — | Attachment (imagem) |

### 4.3 Permissão
Apenas membros com:
- Permissão de Administrador, OU
- Cargo Corp, Policial, ou cargos da lista `policeRoleIds`

### 4.4 Processamento
1. Valida permissão do membro
2. Cria registro de prisão no banco (`createPrisonRecord`)
3. Faz upload das 3 fotos obrigatórias (suspeito, mochila, tablet) + provas opcionais via `uploadDiscordAttachment`
4. Gera múltiplas embeds:
   - **Embed principal**: Informações do preso (nome, passaporte, motivo, tempo, multa, observações) + foto do suspeito como thumbnail
   - **Embed Mochila**: Foto da mochila
   - **Embed Tablet**: Foto do tablet de prisão
   - **Embeds de Provas** (cada uma como embed separada)
5. Gera botões de download (Link) para cada arquivo
6. Envia tudo para o canal de logs de prisão (`prisonLogChannelId`)
7. Após enviar, verifica se há uma captura pendente no sistema de procurados e atualiza automaticamente (`finalizeWantedCaptureAfterPrison`)

### 4.5 Integração com Procurados
Quando uma prisão é registrada, o bot verifica se existe uma captura pendente (`client.pendingCaptures`) para aquele procurado. Se existir, remove a mensagem do procurado do canal de procurados e envia um embed de "Procurado Capturado" no canal de logs.

---

## 5. Aba 3 — PROCURADOS (`/procurado` command + `procurado.js`)

### 5.1 Comando Slash `/procurado`
Registra um procurado com uploads nativos do Discord.

### 5.2 Campos do Comando
| Campo | Obrigatório | Max Length | Tipo |
|-------|-------------|------------|------|
| `nome` | Sim | 50 | String |
| `passaporte` | Sim | 20 | String |
| `motivo` | Sim | 900 | String |
| `risco` | Sim | 30 | String |
| `foto_suspeito` | Sim | — | Attachment |
| `prova_1` | Sim | — | Attachment |
| `local` | Não | 60 | String |
| `organizacao` | Não | 60 | String |
| `observacoes` | Não | 900 | String |
| `prova_2` a `prova_4` | Não | — | Attachment |

### 5.3 Permissão
Mesma que prisão (Administrador, Corp, Policial, policeRoleIds).

### 5.4 Processamento
1. Valida permissão
2. Cria registro de procurado (`createWantedRecord`) com status `ACTIVE`
3. Faz upload da foto principal e provas
4. Gera embed principal com:
   - Nome, passaporte, motivo, risco, localização, organização, observações
   - Foto do suspeito como thumbnail
   - Prova 1 como imagem
5. Adiciona botão **"JÁ FOI PRESO"** (`pc:wanted:captured:{recordId}`)
6. Gera botões de download para provas 2-4
7. Envia para o canal de logs de procurados (`wantedLogChannelId`)

### 5.5 Fluxo de Captura (via `wantedFlow.js`)
Quando alguém clica em **"JÁ FOI PRESO"**:
1. Abre um modal com campos: "Preso por quem", "Data da prisão", "Horário da prisão", "Observações"
2. Ao confirmar, o bot atualiza a mensagem do procurado no canal, adicionando um campo "🚨 Captura" com os dados
3. Desabilita o botão "JÁ FOI PRESO"
4. Armazena a captura em `client.pendingCaptures`
5. Quando a prisão é registrada via `/prisao`, o bot automaticamente:
   - Remove a mensagem do procurado do canal
   - Envia um embed "Procurado Capturado" no canal de logs

---

## 6. Aba 4 — BO — BOLETIM DE OCORRÊNCIA (`boFlow.js`)

### 6.1 Painel de BO
O painel de BO é criado no canal configurado (`boPanelChannelId`) com o botão **"Preencher BO"**.

### 6.2 Fluxo
1. Usuário clica em **"Preencher BO"**
2. Abre um modal com 4 campos:

| Campo | Obrigatório | Max Length | Estilo |
|-------|-------------|------------|--------|
| Nome do solicitante | Sim | 50 | Short |
| ID do solicitante | Sim | 20 | Short |
| Ocorrido | Sim | 1500 | Paragraph |
| Links (opcional) | Não | 1500 | Paragraph |

3. Ao enviar, o bot:
   - Cria um registro BO no banco (`createBORecord`)
   - Gera um embed com todas as informações
   - Envia para o canal de logs de BO (`boLogChannelId`)
   - Responde ao usuário com confirmação ephemeral

### 6.3 Registro no Banco
O BO é armazenado em `bo_records` com campos: `id`, `guild_id`, `author_id`, `requester_name`, `requester_id`, `occurred`, `links`, `created_at`.

---

## 7. Aba 5 — INVESTIGAÇÕES (`investigationFlow.js`)

### 7.1 Painel de Investigações
O painel no canal de investigação (`investigationChannelId`) contém o botão **"ABRIR INVESTIGAÇÃO"**. Apenas membros do cargo **Investigativo** (ou Administradores) podem abrir investigações.

### 7.2 Fluxo de Abertura (Wizard de 3 Etapas)

#### Etapa 1: Tipo de Investigação
O usuário seleciona o tipo:
- 🏛️ **Governo** — Organização do Governo
- 💀 **Criminosa** — Organização Criminosa
- 👤 **Pessoa** — Pessoa física
- 📁 **Outros**

#### Etapa 2: Identificação
Dependendo do tipo, campos diferentes:
- **GOV/CRIME**: Nome da organização/facção
- **PERSON**: Nome da pessoa + Passaporte
- **OUTROS**: Título da investigação

#### Etapa 3: Detalhes
Campos:
- Motivo da investigação
- Relato completo
- Nível de prioridade
- Data do ocorrido (DD/MM/AAAA)
- Observações (opcional)

### 7.3 Criação do Canal
Ao finalizar o wizard:
1. Cria um canal de texto privado na categoria de investigações configurada
2. O canal tem permissões: todos bloqueados, apenas o criador pode ver/enviar mensagens
3. O nome do canal é o slug do nome da investigação
4. Envia um embed de "Investigação Aberta" com botões de ação

### 7.4 Painel de Investigação (Canal Privado)
Dentro do canal da investigação, o criador vê:
- **📷 /fotos** — Abre o comando `/fotos` para enviar mídias
- **✅ Checklist** — Abre o checklist de encerramento
- **Concluir Investigação** — Inicia o processo de finalização

### 7.5 Comando `/fotos` (envio de mídias)
Campos do comando:
- `foto_1` a `foto_5` — Fotos (PNG/JPG/WEBP/GIF)
- `video_1`, `video_2` — Vídeos
- `gravacao_1`, `gravacao_2` — Gravações de áudio
- `categoria` — Categoria para checklist (BAÚ, ARMADOS, ROSTO 00/01/02, GERENTE, GERENTE 2, MAPA, OUTRA PROVA)
- `nome` — Título geral (opcional)
- `identificacao` — Nome e passaporte (obrigatório para ARMADOS, ROSTOS, GERENTES)
- `nome_foto_X`, `nome_video_X`, `nome_gravacao_X` — Nomes customizados para cada mídia

O bot:
1. Cria ou reutiliza uma investigação aberta no canal
2. Faz upload de todas as mídias
3. Gera embed principal + embeds individuais para cada imagem
4. Gera botões de download
5. Envia tudo no canal da investigação

### 7.6 Checklist de Encerramento
O checklist verifica 8 requisitos obrigatórios e opcionais:
| Requisito | Obrigatório | Fotos Mín | Fotos Máx |
|-----------|-------------|-----------|-----------|
| BAÚ — localização | Sim | 1 | 3 |
| ARMADOS — pessoas armadas | Sim | 1 | 4 |
| ROSTO 00 | Sim | 1 | 1 |
| ROSTO 01 | Sim | 1 | 1 |
| ROSTO 02 | Não | 0 | 1 |
| GERENTE | Sim | 1 | 1 |
| GERENTE 2 | Não | 0 | 1 |
| MAPA — localização | Sim | 1 | 1 |

O usuário deve enviar as fotos usando `/fotos` com a categoria correspondente. O checklist atualiza automaticamente.

### 7.7 Finalização de Investigação
1. Quando o checklist está completo, o bot permite enviar o **PDF do Inquérito**
2. O usuário envia o PDF como anexo no canal e clica em **"Confirmar PDF"**
3. O bot faz upload do PDF, marca a investigação como `CLOSED`
4. Renomeia o canal com prefixo `✅`
5. Bloqueia permissões de envio para @everyone
6. Envia um embed de "Investigação Concluída" para o canal de finalizações (`investigationFinalChannelId`)
7. Inclui link para download do PDF

### 7.8 Funções Exportadas
- `handleInvestigationPanelButton` — Abre o wizard de tipo
- `handleInvestigationModal` — Processa todas as etapas do wizard + ações dentro do canal
- `handleEvidenceStart` — Abre o modal de adicionar evidência (legado, redireciona para /fotos)
- `handleEvidenceModal` — Processa evidência (legado)
- `handleEvidenceConfirm` — Confirma anexos de evidência (legado)
- `handleInvestigationConclude` — Inicia processo de conclusão
- `handleInvestigationConfirmPdf` — Confirma o PDF e finaliza a investigação

---

## 8. Aba 6 — CORREGEDORIA / TICKETS (`ticketFlow.js`)

### 8.1 Painel de Corregedoria
O painel no canal de corregedoria (`corregedoriaPanelChannelId`) contém o botão **"ABRIR DENÚNCIA"**.

### 8.2 Fluxo Completo

#### Etapa 1: Modal de Abertura de Denúncia
Campos:
| Campo | Obrigatório | Max Length |
|-------|-------------|------------|
| Nome do denunciado | Sim | 60 |
| Passaporte do denunciado | Sim | 20 |
| Motivo da denúncia | Sim | 80 |
| Relato completo | Sim | 1500 |
| Data do ocorrido | Sim | 10 |

#### Etapa 2: Canal Sigiloso
- O bot cria um canal de texto privado na categoria de tickets configurada
- Nome: `denuncia-{username}`
- Permissões: apenas o denunciante pode ver/enviar mensagens
- Envia um embed de cabeçalho e o painel de evidências

#### Etapa 3: Envio de Provas
No canal sigiloso, o usuário pode:
- Clicar em **📷 Imagens**, **🎥 Vídeos**, **🎙️ Gravações** para enviar arquivos por anexo
- Clicar em **🔗 Links** para adicionar links de vídeo, áudio, imagem e outros
- Os arquivos são armazenados no draft (memória) e o painel é atualizado

#### Etapa 4: Finalização
Ao clicar em **"FINALIZAR DENÚNCIA"**:
1. Verifica se há pelo menos uma prova enviada
2. Cria um ticket no banco (`createTicket`)
3. Renomeia o canal para `ticket-{username}`
4. Envia um embed de resumo com todas as provas cadastradas
5. Adiciona botão **"Fechar Ticket"**

#### Etapa 5: Fechamento do Ticket
- Apenas o solicitante ou Administradores podem fechar
- O bot faz transcrição das mensagens (excluindo bots)
- Fecha o ticket no banco (`closeTicketByChannel`)
- Apaga o canal

---

## 9. Aba 7 — CURSOS (`coursesFlow.js`)

### 9.1 Painel de Cursos
O painel no canal de cursos (`coursesPanelChannelId`) contém o botão **"SOLICITAR CURSO"**.

### 9.2 Cursos Disponíveis
| Curso | Emoji | Descrição |
|-------|-------|-----------|
| Tático | 🛡️ | Treinamento operacional especializado |
| Modulação | 🎛️ | Padrão de comunicação institucional |
| Graer | 🦅 | Tática aérea e apoio tático |
| Speed | 🏎️ | Direção avançada e perseguição |
| GTM | 🧩 | Grupo tático / missões especiais |
| Abordagem | 🚓 | Procedimento de abordagem padrão |
| Prisão | ⛓️ | Procedimentos de custódia e prisão |
| Investigação | 🕵️ | Metodologia investigativa e relatórios |

### 9.3 Fluxo
1. Usuário clica em **SOLICITAR CURSO**
2. Seleciona o curso no menu suspenso
3. Preenche o modal com: Nome RP, Passaporte, Curso (pré-preenchido), Disponibilidade de horário, Dias disponíveis/Observações
4. O bot envia a solicitação para o canal de solicitações de cursos (`coursesRequestChannelId`)
5. Um administrador/recrutador clica em **✅ CURSO INSTRUÍDO**
6. O cargo do curso é aplicado automaticamente ao solicitante
7. A mensagem é atualizada com o status "INSTRUÍDO"

---

## 10. Aba 8 — AVISOS (`noticesFlow.js`)

### 10.1 Painel de Avisos
O painel no canal de avisos (`noticesPanelChannelId`) contém o botão **"CRIAR AVISO"**.

### 10.2 Permissão
Apenas Administradores ou quem tem o cargo Recrutador.

### 10.3 Fluxo
1. Usuário clica em **CRIAR AVISO**
2. Preenche o modal com:
   - Título do aviso (obrigatório, max 80)
   - Descrição do aviso (obrigatório, max 1500)
   - Tipo do aviso (obrigatório, max 30) — ex: Aviso Geral, Reunião, Treinamento, Operação, Sistema, Atualização, Emergência
   - Prioridade (obrigatório, max 20) — ex: Baixa, Média, Alta, Urgente
   - Observações adicionais (opcional, max 900)
3. O bot envia o aviso para o canal de avisos (`noticesChannelId`) com `@everyone`
4. O embed inclui: título, tipo, prioridade, descrição, criado por, data/hora

---

## 11. Aba 9 — EXONERAÇÃO (`exonerationFlow.js`)

### 11.1 Painel de Exoneração
O painel no canal de exoneração (`exonerationPanelChannelId`) contém dois botões:
- **SOLICITAR EXONERAÇÃO** — Para membros solicitarem sua própria exoneração
- **EXONERAR MEMBRO** — Para administradores/recrutadores exonerarem outros membros

### 11.2 Fluxo do Solicitante
1. Usuário clica em **SOLICITAR EXONERAÇÃO**
2. Preenche o modal com: Nome RP, Passaporte, Motivo da exoneração, Observações
3. O bot envia a solicitação para o canal de logs de exoneração (`exonerationLogChannelId`)
4. Inclui botão **🚫 EXONERAR**

### 11.3 Fluxo do Administrador
1. Administrador/Recrutador clica em **EXONERAR MEMBRO**
2. Seleciona o usuário no menu de seleção de usuário
3. Preenche o modal com motivo e observações
4. O bot envia a solicitação administrativa para o canal de logs

### 11.4 Execução da Exoneração
Ao clicar em **🚫 EXONERAR**:
1. Verifica permissão (Administrador ou Recrutador)
2. Identifica o alvo da exoneração
3. Envia DM ao membro informando a exoneração
4. Expulsa o membro do servidor (`target.kick()`)
5. Atualiza a mensagem com o status "EXONERADO"
6. Desabilita o botão

---

## 12. Aba 10 — TIME CLOCK / BATE PONTO (`timeclockFlow.js`)

### 12.1 Painel de Time Clock
O painel no canal fixo (`TIME_CLOCK_PANEL_CHANNEL_ID`) contém os botões:
- **Bater Ponto** — Iniciar serviço
- **Fechar Serviço** — Encerrar serviço

### 12.2 Regras
- A cada **40 minutos** de serviço: **+20.000 reais**
- Fechamento automático após **3 horas** (180 minutos)

### 12.3 Fluxo de Abrir Ponto
1. Usuário clica em **Bater Ponto**
2. Se já tiver um ponto aberto, mostra o status atual
3. Abre modal com campo: "Motivo do ponto (investigação/serviço)"
4. Cria o registro no banco local (`timeclocks` store) com status `OPEN`
5. Envia DM ao usuário confirmando o ponto aberto

### 12.4 Fluxo de Fechar Serviço
1. Usuário clica em **Fechar Serviço**
2. Abre modal com campo: "Resumo do trabalho feito"
3. O bot calcula os blocos de 40min e o valor total
4. Envia o log para o canal de logs do timeclock (`TIME_CLOCK_LOG_CHANNEL_ID`)
5. Inclui botões **"Valor pago"** e **"Não pagamento"**
6. Envia DM ao usuário com o resumo

### 12.5 Pagamento
- **Valor pago**: Administrador marca como PAGO, o valor é calculado e o usuário recebe DM
- **Não pagamento**: Administrador abre modal com motivo, marca como NOT_PAID, o usuário recebe DM com o motivo

### 12.6 Scheduler Automático
O bot roda um intervalo de 1 minuto (`setInterval`) que:
- Verifica todos os pontos abertos
- Fecha automaticamente pontos com mais de 3 horas (status `AUTO_CLOSED`)
- Notifica usuários sobre blocos ganhos e valores acumulados via DM

---

## 13. Sistema de Setup (`/setup` command + `panels.js`)

### 13.1 Funcionamento
O comando `/setup` (ou o evento `ready`) cria/atualiza todos os painéis nos canais configurados. O sistema:
1. Busca ou cria a configuração do servidor no banco local
2. Para cada painel, verifica se a mensagem já existe (pelo ID salvo)
3. Se não existir ou `forceResend` estiver ativo, envia o embed + botões no canal correto
4. Salva os IDs das mensagens dos painéis para recuperação posterior
5. Tenta "auto-recuperar" painéis se a mensagem foi apagada

### 13.2 Painéis Criados
| Painel | Canal | Botão |
|--------|-------|-------|
| Verificação | `verificationChannelId` | INICIAR VERIFICAÇÃO |
| Investigações | `investigationChannelId` | ABRIR INVESTIGAÇÃO |
| BO | `boPanelChannelId` | Preencher BO |
| Prisões | `prisonPanelChannelId` | (instruções via embed) |
| Procurados | `wantedPanelChannelId` | (instruções via embed) |
| Cursos | `coursesPanelChannelId` | SOLICITAR CURSO |
| Avisos | `noticesPanelChannelId` | CRIAR AVISO |
| Exoneração | `exonerationPanelChannelId` | SOLICITAR EXONERAÇÃO / EXONERAR MEMBRO |
| Corregedoria | `corregedoriaPanelChannelId` | ABRIR DENÚNCIA |
| Time Clock | `TIME_CLOCK_PANEL_CHANNEL_ID` | Bater Ponto / Fechar Serviço |

---

## 14. Banco de Dados Local (`data/pc_local_db.json`)

O bot usa um banco de dados JSON local com as seguintes coleções:

| Coleção | Descrição |
|---------|-----------|
| `guild_configs` | Configuração por servidor (cargos, canais, painéis) |
| `member_profiles` | Perfis de membros verificados (nome RP, passaporte, nickname) |
| `role_requests` | Solicitações de seleção de cargos (status: PENDING/APPROVED/DENIED) |
| `investigations` | Investigações abertas (status: OPEN/CLOSED) |
| `evidences` | Evidências registradas em investigações |
| `bo_records` | Boletins de Ocorrência |
| `prison_records` | Registros de prisão |
| `wanted_records` | Registros de procurados |
| `timeclocks` | Registros de bate-ponto |
| `tickets` | Tickets da corregedoria |
| `course_requests` | Solicitações de cursos |

---

## 15. Roteador de Interações (`componentRouter.js`)

O arquivo `src/systems/interactions/componentRouter.js` é o **centro de roteamento** de todas as interações do bot. Ele direciona:

- **Botões** (`interaction.isButton()`) → handlers específicos por prefixo de `customId`
- **Menus suspensos** (`interaction.isStringSelectMenu()`) → handlers por prefixo
- **Menus de usuário** (`interaction.isUserSelectMenu()`) → handler de exoneração
- **Modais** (`interaction.isModalSubmit()`) → handlers por prefixo de `customId`

### Prefixos de Roteamento
| Prefixo | Sistema |
|---------|---------|
| `pc:verify*` | Verificação/Login |
| `pc:roleApprove:` / `pc:roleDeny:` | Aprovação de cargos |
| `pc:courses:*` | Cursos |
| `pc:notices:*` | Avisos |
| `pc:exo:*` | Exoneração |
| `pc:investigation*` | Investigações |
| `pc:evidence*` | Evidências (legado) |
| `pc:bo*` | BO |
| `pc:wanted:*` | Procurados |
| `pc:ticket:*` / `pc:corregedoria:*` | Corregedoria/Tickets |
| `pc:timeclock:*` | Time Clock |
| `pc:prison*` / `pc:wantedModal` | Legado (removido, redireciona para /prisao e /procurado) |

### Anti-Spam
O roteador possui um sistema anti-spam de 800ms por usuário para interações de componentes.

---

## 16. Comandos Slash Disponíveis

| Comando | Descrição | Sistema |
|---------|-----------|---------|
| `/prisao` | Registra uma prisão com uploads nativos | Prisões |
| `/procurado` | Registra um procurado com uploads nativos | Procurados |
| `/fotos` | Envia mídias para a investigação aberta no canal | Investigações |
| `/setup` | Configura os painéis iniciais no servidor | Setup |

---

## 17. Configuração Padrão (`src/config/defaults.js`)

### 17.1 Cores do Bot
- `BLUE`: `0x0a4ea3`
- `DARK`: `0x0b0b0b`
- `GRAY_DARK`: `0x1f1f1f`

### 17.2 Cargos Configurados
- `autoRoleOnJoinId` — Cargo aplicado automaticamente ao entrar
- `verifiedRoleId` — Cargo de verificado
- `recruiterRoleId` — Cargo de recrutador (pode aprovar e criar avisos)
- `corpRoleId` — Cargo corporativo geral
- `investigativeRoleId` — Cargo do Investigativo
- `integration.policeRoleId`, `hospitalRoleId`, `sspRoleId`, `juridicoRoleId` — Cargos de integração governamental
- `policeRoleIds` — Lista completa de todos os cargos policiais

### 17.3 Canais Configurados
- `verificationChannelId` — Canal de verificação
- `approvalChannelId` — Canal de aprovação de cargos
- `investigationChannelId` / `investigationCategoryId` / `investigationFinalChannelId` — Canais de investigação
- `boPanelChannelId` / `boLogChannelId` — Canais de BO
- `prisonPanelChannelId` / `prisonLogChannelId` — Canais de prisão
- `wantedPanelChannelId` / `wantedLogChannelId` — Canais de procurados
- `coursesPanelChannelId` / `coursesRequestChannelId` — Canais de cursos
- `noticesPanelChannelId` / `noticesChannelId` — Canais de avisos
- `exonerationPanelChannelId` / `exonerationLogChannelId` — Canais de exoneração
- `corregedoriaPanelChannelId` / `ticketCategoryId` — Canais de corregedoria
- `TIME_CLOCK_PANEL_CHANNEL_ID` / `TIME_CLOCK_LOG_CHANNEL_ID` — Canais de time clock

---

## 18. Resumo do Fluxo de Dados

1. **Usuário interage** com botão/menu/modal no Discord
2. **Discord envia interação** para o bot
3. `interactionCreate.js` → `componentRouter.js` roteia para o handler correto
4. **Handler** valida permissões, coleta dados do formulário
5. **Handler** chama funções do `repositories/db.js` para persistir dados no JSON local
6. **Handler** gera embeds e envia para os canais apropriados
7. **Handler** responde ao usuário com confirmação ephemeral

Para comandos slash (`/prisao`, `/procurado`, `/fotos`):
1. Discord envia `interaction` do tipo `ChatInputCommand`
2. `commandExecutor.js` busca o comando em `client.commands`
3. Verifica cooldown (5s para prisão/procurado, 3.5s para fotos)
4. Executa `command.execute(client, interaction)`
5. O comando processa anexos, faz upload, gera embeds e envia para os canais de log

---

*Documentação gerada a partir da análise completa do código-fonte do bot Polícia Civil RP.*