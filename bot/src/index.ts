import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } from 'discord.js';
import axios from 'axios';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel],
});

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const BOT_API_SECRET = process.env.BOT_API_SECRET || '';

const sendToBackend = async (type: string, payload: Record<string, unknown> = {}) => {
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

client.once('ready', async () => {
  console.log(`Bot online como ${client.user?.tag}`);
  console.log('Conectado com intents básicos. Para mensagens com conteúdo completo e eventos de membros/presença, habilite os intents no painel do Discord Developer Portal.');
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

client.on('messageUpdate', async (oldMessage, newMessage) => {
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
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN || '');
  const guildId = process.env.DISCORD_GUILD_ID;
  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID || '', guildId), { body: slashCommands });
    } else {
      await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || ''), { body: slashCommands });
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
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('DISCORD_BOT_TOKEN não configurado.');
    return;
  }

  await registerCommands();
  await client.login(token);
}

start().catch((error) => {
  console.error('Erro ao iniciar o bot:', error);
});
