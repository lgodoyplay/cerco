# Fluxo de Registro — Polícía Civil RP Bot

## Visão Geral

O sistema de registro (verificação institucional) é composto por **5 etapas sequenciais** que o usuário percorre ao se registrar no servidor. O fluxo é iniciado por um botão no painel de verificação e termina com o envio de uma solicitação de aprovação de cargos para o canal de aprovação.

---

## Etapa 1 — Botão "INICIAR VERIFICAÇÃO"

**Gatilho:** Usuário clica no botão `pc:verify` no painel de verificação.

**Ação do bot:**
- Responde com um embed ephemeral (visível apenas para o usuário)
- Exibe o menu de seleção de categoria

**Embed exibido:**
- Título: `🎉 Verificação Institucional`
- Descrição com lista de benefícios do sistema de verificação
- Botão de seleção de categoria

---

## Etapa 2 — Seleção de Categoria

**Gatilho:** Usuário seleciona uma categoria no menu suspenso (`pc:verifyCategory`).

**Categorias disponíveis:**

| Emoji | Categoria | Valor | Cargos Disponíveis |
|-------|-----------|-------|-------------------|
| 🎓 | Integração | `INTEGRACAO` | Jovem Aprendiz, Aluno |
| 🏢 | Administrativo | `ADMIN` | Investigativo, Escrivão, Perito, Agentes |
| ⭐ | Alto Escalão | `ALTO` | Comando, Procuradoria, Comissariado |
| 🤓 | DEGEN | `DEGEN` | Delegados |
| 🏛️ | Integração Governamental | `GOV` | SSP, Hospital, Policial, Jurídico |

**Ação do bot:**
- Exibe o menu de seleção de cargos da categoria escolhida
- Inclui botão "Voltar" para retornar à etapa anterior

---

## Etapa 3 — Seleção de Cargo

**Gatilho:** Usuário seleciona um cargo no menu suspenso (`pc:verifyRole:{categoria}`).

**Ação do bot:**
- Abre um modal de identificação com os seguintes campos:

| Campo | Obrigatório | Tamanho Máximo | Estilo |
|-------|-------------|----------------|--------|
| Nome RP | Sim | 32 caracteres | Texto curto |
| Passaporte | Sim | 10 caracteres | Texto curto |
| Departamento | Sim | 40 caracteres | Texto curto (pré-preenchido com a categoria) |
| Observações | Não | 900 caracteres | Parágrafo |

**Campo Departamento:** Pré-preenchido com o nome da categoria selecionada (ex: "Administrativo", "Integração", etc.)

---

## Etapa 4 — Processamento e Aprovação

**Gatilho:** Usuário envia o modal de identificação.

**Ação do bot (sequência):**

1. **Validação:** Verifica se o usuário está em um servidor
2. **Persistência:** Salva o perfil do membro no banco de dados local (`member_profiles`) com:
   - `guild_id`, `user_id`, `in_game_name`, `passport`, `verified_at`, `nickname`
3. **Nickname:** Altera o nickname do usuário para `{NomeRP} ‡ {Passaporte}`
4. **Cargo Verificado:** Aplica o cargo "Verificado" ao membro
5. **Solicitação de Cargos:** Cria uma solicitação de seleção de cargos (`role_requests`) com status `PENDING`
6. **Embed de Aprovação:** Envia um embed para o canal de aprovação (`approvalChannelId`) com:
   - Menção ao solicitante
   - Categoria selecionada
   - Departamento
   - Cargo selecionado
   - Observações (se houver)
   - Botões **Aprovar** (✅) e **Recusar** (❌)
7. **Resposta ao Usuário:** Confirmação ephemeral de que a solicitação foi enviada

---

## Etapa 5 — Aprovação/Recusa de Cargos

**Gatilho:** Administrador ou Recrutador clica em Aprovar ou Recusar no canal de aprovação.

### Fluxo de Aprovação

1. **Verificação de Permissão:** Apenas Administradores ou membros com o cargo Recrutador podem aprovar/recusar
2. **Identificação da Solicitação:** Extrai o ID da solicitação do `customId` do botão
3. **Validação:** Verifica se a solicitação existe e está com status `PENDING`
4. **Aplicação de Cargos:**
   - Aplica todos os cargos selecionados ao membro
   - Se for um cargo policial (não-integração), adiciona automaticamente o cargo "Corp"
5. **Atualização do Status:** Marca a solicitação como `APPROVED` com `reviewed_by` e `reviewed_at`
6. **Desabilitação de Botões:** Desabilita os botões Aprovar/Recusar na mensagem original
7. **Resposta:** Confirmação ephemeral de que a solicitação foi aprovada

### Fluxo de Recusa

1. **Verificação de Permissão:** Mesma verificação de aprovação
2. **Atualização do Status:** Marca a solicitação como `DENIED` com `reviewed_by` e `reviewed_at`
3. **Desabilitação de Botões:** Desabilita os botões Aprovar/Recusar na mensagem original
4. **Resposta:** Confirmação ephemeral de que a solicitação foi recusada

---

## Fluxo de Seleção de Cargos (Etapa Complementar)

**Gatilho:** Após a aprovação inicial, o membro pode selecionar cargos adicionais via menu suspenso (`pc:roleSelect:{requestId}`).

**Ação do bot:**
1. Verifica se a solicitação existe e pertence ao usuário
2. Verifica se a solicitação ainda está com status `PENDING`
3. Atualiza os `selected_role_ids` na solicitação
4. Envia nova solicitação de aprovação ao canal de aprovação com os cargos selecionados
5. Desabilita o menu de seleção na mensagem original

---

## Estrutura de Dados Envolvidos

### `member_profiles`
```json
{
  "id": "{guildId}:{userId}",
  "guild_id": "{guildId}",
  "user_id": "{userId}",
  "in_game_name": "Nome RP",
  "passport": "Passaporte",
  "verified_at": "2026-07-26T18:48:16.000Z",
  "nickname": "Nome RP ‡ Passaporte"
}
```

### `role_requests`
```json
{
  "id": "{uuid}",
  "guild_id": "{guildId}",
  "user_id": "{userId}",
  "selected_role_ids": ["{roleId1}", "{roleId2}"],
  "status": "PENDING",
  "reviewed_by": null,
  "reviewed_at": null,
  "created_at": "2026-07-26T18:48:16.000Z"
}
```

---

## Cargos e Permissões

### Cargos de Aprovação
- **Administrador** — Pode aprovar e recusar todas as solicitações
- **Recrutador** — Pode aprovar e recusar todas as solicitações

### Cargos Disponíveis por Categoria

#### 🎓 Integração
- Jovem Aprendiz
- Aluno

#### 🏢 Administrativo
- Investigativo
- Escrivão
- Perito Criminal
- Agente Especial
- Agente

#### ⭐ Alto Escalão
- Delegado Geral
- Delegado Titular
- Delegado Adjunto
- Comando
- Sub Comando
- Procurador Geral
- Procurador
- Comissário

#### 🤓 DEGEN
- Delegado Geral
- Delegado Titular
- Delegado Adjunto

#### 🏛️ Integração Governamental
- SSP
- Hospital
- Policial
- Jurídico

### Cargo Corporativo (Automático)
- Ao aprovar qualquer cargo policial (não-integração), o cargo **Corp** é adicionado automaticamente ao membro.

---

## Fluxo Visual

```
┌─────────────────────────────────────┐
│  1. Usuário clica "INICIAR          │
│     VERIFICAÇÃO" no painel          │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  2. Seleção de Categoria            │
│  (Integração, Administrativo,       │
│   Alto Escalão, DEGEN, Gov)         │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  3. Seleção de Cargo                │
│  (Menu suspenso com cargos da       │
│   categoria selecionada)            │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  4. Modal de Identificação          │
│  (Nome RP, Passaporte, Departamento,│
│   Observações)                      │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  5. Processamento                   │
│  - Salva perfil no banco            │
│  - Altera nickname                  │
│  - Aplica cargo Verificado          │
│  - Envia solicitação ao canal de    │
│    aprovação                        │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  6. Aprovação/Recusa                │
│  (Administrador/Recrutador clica    │
│   em Aprovar ou Recusar)            │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  7. Cargos Aplicados                │
│  - Cargos selecionados aplicados    │
│  - Cargo Corp adicionado (se        │
│    policial)                        │
│  - Solicitação marcada como         │
│    APPROVED/DENIED                  │
└─────────────────────────────────────┘
```

---

## IDs de CustomIds Utilizados

| CustomId | Tipo | Sistema |
|----------|------|---------|
| `pc:verify` | Botão | Iniciar verificação |
| `pc:verifyBack` | Botão | Voltar à etapa anterior |
| `pc:verifyCategory` | Select Menu | Seleção de categoria |
| `pc:verifyRole:{categoria}` | Select Menu | Seleção de cargo |
| `pc:verifyModal:{categoria}:{roleId}` | Modal | Identificação |
| `pc:roleSelect:{requestId}` | Select Menu | Seleção de cargos |
| `pc:roleApprove:{requestId}` | Botão | Aprovar solicitação |
| `pc:roleDeny:{requestId}` | Botão | Recusar solicitação |

---

## Permissões Necessárias no Bot

- `ViewChannel` — Ver canais de verificação e aprovação
- `SendMessages` — Enviar mensagens nos canais
- `ManageNicknames` — Alterar nickname dos membros
- `ManageRoles` — Aplicar e remover cargos
- `ReadMessageHistory` — Ler histórico para recuperação de painéis
