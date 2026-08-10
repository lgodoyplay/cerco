import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } from 'discord.js';
import axios from 'axios';

dotenv.config();

const env = process.env;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Channel],
});

const BACKEND_URL = (env.BACKEND_URL || env.DISCORD_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const BOT_API_SECRET = (env.BOT_API_SECRET || env.DISCORD_BOT_SECRET || '').trim();
const DISCORD_BOT_TOKEN = (env.DISCORD_BOT_TOKEN || env.DISCORD_TOKEN || '').trim();
const DISCORD_CLIENT_ID = (env.DISCORD_CLIENT_ID || env.CLIENT_ID || '').trim();
const DISCORD_GUILD_ID = (env.DISCORD_GUILD_ID || env.GUILD_ID || '').trim();
const PORT = Number(env.PORT || 4001);

const normalizeToken = (value: string) => value.replace(/^['"]|['"]$/g, '').trim();
const TOKEN = normalizeToken(DISCORD_BOT_TOKEN);

const sendToBackend = async (type: string, payload: Record<string, unknown> = {}) => {
  if (!BACKEND_URL || !BOT_API_SECRET) {
    return;
  }

  try {
    const endpoint = `${BACKEND_URL}/api/discord/bot/events`;
    await axios.post(endpoint, { type, payload }, {
      headers: {
        'x-bot-secret': BOT_API_SECRET,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.warn('Falha ao notificar backend:', error);
  }
};

const requireBotSecret = (req: Request, res: Response, next: NextFunction) => {
  if (!BOT_API_SECRET) {
    return res.status(500).json({ error: 'BOT_API_SECRET não configurado.' });
  }

  const provided = req.headers['x-bot-secret'];
  if (provided === BOT_API_SECRET) {
    return next();
  }

  return res.status(403).json({ error: 'Segredo inválido para comunicação bot/backend.' });
};

const serializeGuild = (guild: any) => ({
  id: guild.id,
  name: guild.name,
  icon: guild.iconURL?.() || null,
  memberCount: guild.memberCount || 0,
});

const serializeChannel = (channel: any) => ({
  id: channel.id,
  name: channel.name,
  type: channel.type === 2 ? 'voice' : 'text',
  topic: channel.topic || null,
  position: channel.position || 0,
});

const serializeMember = (member: any) => ({
  id: member.id,
  username: member.user?.username || member.displayName || 'Usuário',
  displayName: member.displayName || member.user?.username || 'Usuário',
  bot: Boolean(member.user?.bot),
  joinedAt: member.joinedAt?.toISOString?.() || null,
  avatar: member.user?.displayAvatarURL?.({ size: 64 }) || null,
});

const serializeMessage = (message: any) => ({
  id: message.id,
  channelId: message.channelId,
  guildId: message.guildId,
  content: message.content || '',
  author: {
    id: message.author?.id,
    name: message.author?.username || 'Usuário',
    avatar: message.author?.displayAvatarURL?.({ size: 64 }) || null,
  },
  timestamp: message.createdAt?.toISOString?.() || new Date().toISOString(),
});

const getTargetGuild = (guildId?: string) => {
  if (!guildId) {
    return client.guilds.cache.first() || null;
  }

  return client.guilds.cache.get(guildId) || null;
};

const app = express();
app.use(express.json({ limit: '5mb' }));
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok', bot: client.isReady() ? 'online' : 'offline' }));
app.use('/api/discord', requireBotSecret);
app.get('/api/discord/health', (_req: Request, res: Response) => res.json({ status: 'ok', bot: client.isReady() ? 'online' : 'offline' }));
app.get('/api/discord/guilds', (_req: Request, res: Response) => {
  const guilds = client.guilds.cache.map(serializeGuild);
  return res.json(guilds);
});
app.get('/api/discord/guilds/:guildId/channels', (req: Request, res: Response) => {
  const guildId = Array.isArray(req.params.guildId) ? req.params.guildId[0] : req.params.guildId;
  const guild = getTargetGuild(guildId);
  if (!guild) {
    return res.json([]);
  }

  const channels = guild.channels.cache
    .filter((channel: any) => channel && typeof channel.name === 'string')
    .map(serializeChannel);
  return res.json(channels);
});
app.get('/api/discord/guilds/:guildId/members', (req: Request, res: Response) => {
  const guildId = Array.isArray(req.params.guildId) ? req.params.guildId[0] : req.params.guildId;
  const guild = getTargetGuild(guildId);
  if (!guild) {
    return res.json([]);
  }

  const members = guild.members.cache.map(serializeMember);
  return res.json(members);
});
app.get('/api/discord/channels/:channelId/messages', async (req: Request, res: Response) => {
  const channelId = Array.isArray(req.params.channelId) ? req.params.channelId[0] : req.params.channelId;
  const channel = client.channels.cache.get(channelId || '') as any;
  if (!channel || typeof channel.messages?.fetch !== 'function') {
    return res.json([]);
  }

  try {
    const messages = await channel.messages.fetch({ limit: Number(req.query.limit || 50) });
    return res.json(messages.map(serializeMessage));
  } catch (error) {
    console.warn('Falha ao buscar mensagens do canal:', error);
    return res.json([]);
  }
});
app.post('/api/discord/channels/:channelId/messages', async (req: Request, res: Response) => {
  const channelId = Array.isArray(req.params.channelId) ? req.params.channelId[0] : req.params.channelId;
  const channel = client.channels.cache.get(channelId || '') as any;
  if (!channel || typeof channel.send !== 'function') {
    return res.status(404).json({ error: 'Canal não encontrado.' });
  }

  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
  if (!content) {
    return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório.' });
  }

  try {
    const sentMessage = await channel.send(content);
    return res.json(serializeMessage(sentMessage));
  } catch (error) {
    console.warn('Falha ao enviar mensagem para o Discord:', error);
    return res.status(502).json({ error: 'Não foi possível enviar a mensagem.' });
  }
});
app.get('/api/discord/members/:memberId', (req: Request, res: Response) => {
  const member = client.guilds.cache.reduce((acc: any, guild: any) => acc || guild.members.cache.get(req.params.memberId), null);
  if (!member) {
    return res.status(404).json({ error: 'Membro não encontrado.' });
  }

  return res.json(serializeMember(member));
});
app.get('/api/discord/bot/status', (_req: Request, res: Response) => {
  const guilds = client.guilds.cache.size;
  return res.json({
    online: client.isReady(),
    status: client.isReady() ? 'online' : 'offline',
    uptime: process.uptime(),
    latency: client.ws.ping,
    guilds,
  });
});

client.once('ready', async () => {
  console.log(`Bot online como ${client.user?.tag}`);
  console.log('Conectado com intents de guilds, membros, mensagens, conteúdo e presença.');
  await sendToBackend('bot:ready', { guilds: client.guilds.cache.size });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  await sendToBackend('discord:message:create', {
    channelId: message.channelId,
    guildId: message.guildId,
    messageId: message.id,
    content: message.content,
    authorId: message.author.id,
    authorName: message.author.username,
    createdAt: message.createdAt.toISOString(),
  });
});

client.on('messageUpdate', async (_oldMessage, newMessage) => {
  await sendToBackend('discord:message:update', {
    channelId: newMessage.channelId,
    guildId: newMessage.guildId,
    messageId: newMessage.id,
    content: newMessage.content,
  });
});

client.on('messageDelete', async (message) => {
  await sendToBackend('discord:message:delete', {
    channelId: message.channelId,
    guildId: message.guildId,
    messageId: message.id,
  });
});

client.on('guildMemberAdd', async (member) => {
  await sendToBackend('discord:member:join', { guildId: member.guild.id, userId: member.id });
});

client.on('guildMemberRemove', async (member) => {
  await sendToBackend('discord:member:leave', { guildId: member.guild.id, userId: member.id });
});

client.on('presenceUpdate', async (_oldPresence, newPresence) => {
  await sendToBackend('discord:presence:update', {
    guildId: newPresence?.guild?.id,
    userId: newPresence?.userId,
    status: newPresence?.status,
  });
});

client.on('channelCreate', async (channel) => {
  await sendToBackend('discord:channel:create', { channelId: channel.id, guildId: channel.guild?.id });
});

client.on('channelUpdate', async (_oldChannel, newChannel) => {
  const guildId = 'guild' in newChannel ? newChannel.guild?.id : undefined;
  await sendToBackend('discord:channel:update', { channelId: newChannel.id, guildId });
});

client.on('channelDelete', async (channel) => {
  const guildId = 'guild' in channel ? channel.guild?.id : undefined;
  await sendToBackend('discord:channel:delete', { channelId: channel.id, guildId });
});

client.on('guildCreate', async (guild) => {
  await sendToBackend('discord:guild:create', { guildId: guild.id, name: guild.name });
});

client.on('guildDelete', async (guild) => {
  await sendToBackend('discord:guild:delete', { guildId: guild.id, name: guild.name });
});

const slashCommands = [
  new SlashCommandBuilder().setName('ping').setDescription('Responde com pong').toJSON(),
  new SlashCommandBuilder().setName('status').setDescription('Retorna status do bot').toJSON(),
];

async function registerCommands() {
  if (!DISCORD_CLIENT_ID || !TOKEN) {
    return;
  }

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const guildId = DISCORD_GUILD_ID;
  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guildId), { body: slashCommands });
    } else {
      await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: slashCommands });
    }
    console.log('Comandos slash registrados');
  } catch (error) {
    console.warn('Falha ao registrar comandos slash:', error);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }

  if (interaction.commandName === 'status') {
    await interaction.reply('Bot online e pronto para sincronizar com a dashboard.');
  }
});

async function start() {
  const token = TOKEN;
  if (!token) {
    console.error('DISCORD_BOT_TOKEN não configurado. Adicione a variável no painel do Discloud ou no arquivo .env.');
    return;
  }

  if (!token.startsWith('Bot ') && !token.startsWith('bot ')) {
    console.warn('Token do Discord sem prefixo Bot. O Discord.js geralmente espera o token puro.');
  }

  console.log(`Backend configurado para: ${BACKEND_URL}`);
  console.log(`Token carregado: ${token.slice(0, 10)}...`);
  await registerCommands();
  await client.login(token);
  app.listen(PORT, () => {
    console.log(`API do bot disponível em http://0.0.0.0:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Erro ao iniciar o bot:', error);
});
