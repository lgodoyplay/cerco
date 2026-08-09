import type { DiscordChannel, DiscordMember, DiscordMessage, DiscordServer } from './discordTypes';

const mockServers: DiscordServer[] = [
  {
    id: 'server-euforia',
    name: 'EUFORIA ROLEPLAY',
    shortName: 'ER',
    icon: 'ER',
    accent: 'from-fuchsia-500 to-violet-600',
    description: 'Comunidade principal',
    members: 24,
    unreadCount: 3,
  },
  {
    id: 'server-ocp',
    name: 'OCP',
    shortName: 'O',
    icon: 'O',
    accent: 'from-cyan-500 to-blue-600',
    description: 'Operações',
    members: 12,
  },
  {
    id: 'server-rp',
    name: 'RP',
    shortName: 'RP',
    icon: 'RP',
    accent: 'from-amber-500 to-orange-600',
    description: 'Roleplay',
    members: 8,
  },
];

const mockChannels: Record<string, DiscordChannel[]> = {
  'server-euforia': [
    { id: 'channel-geral', serverId: 'server-euforia', name: 'geral', type: 'text', topic: 'Conversas gerais da comunidade', unread: true },
    { id: 'channel-avisos', serverId: 'server-euforia', name: 'avisos', type: 'text', topic: 'Atualizações importantes' },
    { id: 'channel-noticias', serverId: 'server-euforia', name: 'notícias', type: 'text', topic: 'Notícias e comunicados' },
    { id: 'channel-recrutamento', serverId: 'server-euforia', name: 'recrutamento', type: 'text', topic: 'Novos membros' },
    { id: 'channel-suporte', serverId: 'server-euforia', name: 'suporte', type: 'text', topic: 'Ajuda e suporte' },
    { id: 'channel-off-topic', serverId: 'server-euforia', name: 'off-topic', type: 'text' },
    { id: 'voice-geral', serverId: 'server-euforia', name: 'Geral', type: 'voice', connected: true },
    { id: 'voice-reuniao', serverId: 'server-euforia', name: 'Reunião', type: 'voice' },
    { id: 'voice-operacoes', serverId: 'server-euforia', name: 'Operações', type: 'voice' },
  ],
  'server-ocp': [
    { id: 'channel-ocp-geral', serverId: 'server-ocp', name: 'geral', type: 'text' },
    { id: 'voice-ocp', serverId: 'server-ocp', name: 'Sala 01', type: 'voice' },
  ],
  'server-rp': [
    { id: 'channel-rp-geral', serverId: 'server-rp', name: 'geral', type: 'text' },
  ],
};

const mockMessages: Record<string, DiscordMessage[]> = {
  'channel-geral': [
    {
      id: 'm1',
      channelId: 'channel-geral',
      author: { id: 'u1', name: 'Alan Godoy', role: 'Administrador', avatar: 'AG', status: 'online' },
      content: 'Seja bem-vindo ao servidor! Aqui vocês encontram as principais atualizações da equipe.',
      timestamp: '15:32',
      reactions: [{ emoji: '🚀', count: 3 }, { emoji: '👏', count: 1 }],
    },
    {
      id: 'm2',
      channelId: 'channel-geral',
      author: { id: 'u2', name: 'João', role: 'Moderador', avatar: 'J', status: 'online' },
      content: 'Tudo certo pessoal! Vamos manter o canal organizado para facilitar o trabalho.',
      timestamp: '15:34',
      attachments: ['Resumo da operação'],
    },
  ],
  'channel-avisos': [
    {
      id: 'm3',
      channelId: 'channel-avisos',
      author: { id: 'u3', name: 'Maria', role: 'Comandante', avatar: 'M', status: 'online' },
      content: 'Novas diretrizes serão publicadas hoje às 18h.',
      timestamp: '13:10',
    },
  ],
};

const mockMembers: Record<string, DiscordMember[]> = {
  'server-euforia': [
    { id: 'u1', name: 'Alan Godoy', role: 'Administrador', status: 'online', avatar: 'AG', bio: 'Responsável pela comunicação da equipe.', joinedAt: '12/01/2024' },
    { id: 'u2', name: 'João', role: 'Moderador', status: 'online', avatar: 'J', bio: 'Organiza as reuniões e alertas.', joinedAt: '20/02/2024' },
    { id: 'u3', name: 'Maria', role: 'Membro', status: 'idle', avatar: 'M', bio: 'Acompanhe as operações.', joinedAt: '05/03/2024' },
    { id: 'u4', name: 'Pedro', role: 'Membro', status: 'offline', avatar: 'P', bio: 'Disponível em horários alternados.', joinedAt: '10/04/2024' },
    { id: 'u5', name: 'Lucas', role: 'Membro', status: 'online', avatar: 'L', bio: 'Atende demandas de suporte.', joinedAt: '15/04/2024' },
  ],
  'server-ocp': [
    { id: 'u6', name: 'Rafael', role: 'Comandante', status: 'online', avatar: 'R', bio: 'Coordena operações.', joinedAt: '02/05/2024' },
  ],
};

export const getServers = async (): Promise<DiscordServer[]> => {
  return Promise.resolve(mockServers);
};

export const getChannels = async (serverId: string): Promise<DiscordChannel[]> => {
  return Promise.resolve(mockChannels[serverId] || []);
};

export const getMessages = async (channelId: string): Promise<DiscordMessage[]> => {
  return Promise.resolve(mockMessages[channelId] || []);
};

export const sendMessage = async (channelId: string, content: string): Promise<DiscordMessage> => {
  const message: DiscordMessage = {
    id: `local-${Date.now()}`,
    channelId,
    author: {
      id: 'me',
      name: 'Você',
      role: 'Membro',
      avatar: 'VO',
      status: 'online',
    },
    content,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };

  const existing = mockMessages[channelId] || [];
  mockMessages[channelId] = [...existing, message];

  return Promise.resolve(message);
};

export const getMembers = async (serverId: string): Promise<DiscordMember[]> => {
  return Promise.resolve(mockMembers[serverId] || []);
};

export const getMember = async (memberId: string): Promise<DiscordMember | undefined> => {
  const members = Object.values(mockMembers).flat();
  return Promise.resolve(members.find((member) => member.id === memberId));
};
