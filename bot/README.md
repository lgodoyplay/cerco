# Bot Discord para a Dashboard

## Estrutura
- src/index.ts: inicialização do cliente Discord.js, eventos e comandos slash.
- src/commands/: pronto para comandos adicionais.
- src/events/: pronto para separar eventos.
- src/handlers/: pronto para handlers.
- src/services/: pronto para serviços extras.

## Configuração
1. Copie .env.example para .env.
2. Configure o token do bot, o client ID e o guild ID.
3. Instale as dependências com npm install.
4. Inicie com npm run dev.

## Deploy no Discloud
1. Faça o upload da pasta do bot para o Discloud.
2. Defina as variáveis de ambiente no painel.
3. O arquivo discloud.config.json já aponta para o ponto de entrada `dist/index.js`.
4. O processo será iniciado com `npm start`.
