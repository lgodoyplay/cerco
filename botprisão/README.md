# Polícia Civil RP — Bot (Discord.js v14 + Supabase)

Bot completo e organizado para corporação de Polícia Civil RP, com verificação, seleção/aprovação de cargos, investigações/evidências, BO, prisões, procurados e corregedoria (tickets).

## Requisitos

- Node.js 20+
- Projeto Supabase (Postgres)

## Instalação

```bash
npm install
```

## Configuração

1. Copie o arquivo `.env.example` para `.env` e preencha:

- `DISCORD_TOKEN`
- `CLIENT_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEPLOY_GUILD_ID` (recomendado para deploy rápido em um servidor de testes)

2. Faça o deploy dos Slash Commands:

```bash
npm run deploy:commands
```

## Iniciar

```bash
npm start
```

## Setup automático no servidor

Depois do bot online, execute no seu servidor:

- `/setup`

Esse comando registra/salva as configurações padrão do servidor (IDs) e envia as embeds/painéis iniciais nos canais definidos (verificação, investigação, BO, prisões, procurados e corregedoria).  
O sistema também tenta “auto-recuperar” esses painéis ao reiniciar, caso a mensagem tenha sido apagada.

## Observações importantes

- Upload de anexos (imagens/arquivos) é feito via mensagens com anexos no Discord; o bot orienta o usuário a enviar o arquivo e depois clicar em “Confirmar”, garantindo persistência mesmo após reiniciar.
- Todas as ações críticas possuem validação de permissão/cargo e são registradas no Supabase.
