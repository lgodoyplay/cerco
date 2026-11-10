# Sistema de Solicitação de Cursos

## Visão Geral

O sistema de solicitação de cursos permite que membros da corporação solicitem cursos especializados através de um painel no Discord. O fluxo envolve o membro preenchendo um formulário, a solicitação sendo enviada para um canal de análise, e um instrutor aprovando e aplicando o cargo do curso ao membro.

---

## Fluxo Completo

### 1. Acesso ao Painel de Cursos

O membro clica no botão **SOLICITAR CURSO** no painel **🎓 Central de Cursos**.

- O painel é exibido no canal configurado em `channels.coursesPanelChannelId`.
- A embed lista todos os cursos disponíveis com seus respectivos cargos e descrições.

### 2. Seleção do Curso

Ao clicar em **SOLICITAR CURSO**, o bot abre um menu suspenso (StringSelectMenu) com os cursos disponíveis:

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

O membro seleciona **um único curso** e o bot abre um modal de solicitação.

### 3. Preenchimento do Modal

O modal contém os seguintes campos:

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Nome RP** | Sim | Nome do personagem no jogo (máx. 32 caracteres) |
| **Passaporte** | Sim | Número de passaporte do personagem (máx. 10 caracteres) |
| **Curso selecionado** | Sim | Preenchido automaticamente com base na seleção do menu |
| **Disponibilidade de horário** | Sim | Horário disponível para o curso (ex: `19:00–22:00`) |
| **Dias disponíveis / Observações** | Não | Linha 1: dias da semana (ex: `Seg, Qua, Sex`). Linhas seguintes: observações adicionais |

### 4. Envio da Solicitação

Após preencher o modal e enviar:

1. O bot valida se o curso selecionado no modal corresponde ao curso escolhido no menu. Se houver divergência, um aviso é adicionado à embed.
2. Uma **embed de solicitação** é enviada para o canal configurado em `channels.coursesRequestChannelId`.
3. A embed contém:
   - Nome RP e Passaporte do solicitante
   - Curso solicitado com menção ao cargo
   - Disponibilidade de horário
   - Dias disponíveis
   - Observações
   - Data da solicitação
   - Menção ao solicitante
4. Um botão **✅ CURSO INSTRUÍDO** é adicionado à mensagem.
5. A solicitação é salva no banco de dados (`course_requests`) com status `PENDING`.
6. O membro recebe uma confirmação ephemeral: *"Solicitação enviada com sucesso. Aguarde aprovação/instrução."*

### 5. Instrução do Curso (Aprovação)

Um membro com permissão de instrutor (Administrador ou cargo de Recruiter) clica no botão **✅ CURSO INSTRUÍDO** na mensagem da solicitação.

Ao clicar:

1. O bot verifica se o instrutor tem permissão (Administrador ou cargo de Recruiter).
2. O bot verifica se o membro solicitante ainda está no servidor.
3. O bot verifica se o cargo do curso existe no servidor.
4. Se o membro **não** possui o cargo do curso, o cargo é aplicado automaticamente.
5. A embed da solicitação é atualizada:
   - Cor alterada para azul (`BRAND.colors.BLUE`)
   - Campo **Status** adicionado com: `INSTRUÍDO`, instrutor mencionado e data
6. O botão é desabilitado com o texto `✅ CURSO INSTRUÍDO`.
7. O status da solicitação no banco de dados é atualizado para `INSTRUCTED`, com o ID do instrutor e timestamp.
8. O instrutor recebe uma confirmação ephemeral.

---

## Componentes do Sistema

### Arquivos

| Arquivo | Função |
|---------|--------|
| `src/modules/courses/coursesFlow.js` | Lógica completa do fluxo de cursos |
| `src/modules/courses/index.js` | Exporta as funções do fluxo |
| `src/database/repositories/courseRepository.js` | Operações de banco de dados para solicitações de curso |
| `src/modules/interactions/componentRouter.js` | Roteia interações (botões, menus, modais) para os handlers corretos |

### Rotas de Interação

| Custom ID | Tipo | Função |
|-----------|------|--------|
| `pc:courses:open` | Botão | Abre o painel de seleção de cursos |
| `pc:courses:select` | Menu suspenso | Abre o modal de solicitação |
| `pc:courses:modal:{roleId}` | Modal | Processa o envio da solicitação |
| `pc:courses:instruct:{roleId}:{userId}` | Botão | Marca o curso como instruído |

### Banco de Dados

A tabela `course_requests` armazena:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único da solicitação |
| `guild_id` | String | ID do servidor |
| `requester_id` | String | ID do usuário que solicitou |
| `role_id` | String | ID do cargo do curso solicitado |
| `in_game_name` | String | Nome RP do solicitante |
| `passport` | String | Passaporte do solicitante |
| `availability` | String | Disponibilidade de horário |
| `days` | String \| null | Dias disponíveis |
| `notes` | String \| null | Observações |
| `channel_id` | String | ID do canal onde a solicitação foi enviada |
| `message_id` | String | ID da mensagem da solicitação |
| `status` | String | `PENDING` ou `INSTRUCTED` |
| `instructed_by` | String \| null | ID do instrutor que aprovou |
| `instructed_at` | String \| null | Timestamp da instrução |
| `created_at` | String | Timestamp da criação |

### Configuração Necessária

O canal de solicitações de cursos deve ser configurado em `channels.coursesRequestChannelId` no banco de dados de configuração do servidor.

---

## Ordem Resumida

```text
Membro clica em SOLICITAR CURSO
  ↓
Seleciona o curso no menu suspenso
  ↓
Preenche o modal (nome, passaporte, disponibilidade, dias, observações)
  ↓
Solicitação é enviada para o canal de cursos
  ↓
Embed aparece com botão CURSO INSTRUÍDO
  ↓
Instrutor clica em CURSO INSTRUÍDO
  ↓
Cargo do curso é aplicado ao membro
  ↓
Embed é atualizada com status INSTRUÍDO
  ↓
Fim
```