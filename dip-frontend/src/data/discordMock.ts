import type { DiscordChannel, DiscordMember, DiscordMessage, DiscordServer } from '../types/discord';

export const discordServers: DiscordServer[] = [
  {
    id: 'server-euforia',
    name: 'EUFORIA RP',
    shortName: 'ER',
    icon: 'ER',
    accent: 'from-fuchsia-500 to-violet-600',
    description: 'Comunidade principal da dashboard',
    members: 24,
    unreadCount: 2,
  },
  {
    id: 'server-ocp',
    name: 'OCP',
    shortName: 'O',
    icon: 'O',
    accent: 'from-cyan-500 to-blue-600',
    description: 'Operações e coordenação',
    members: 12,
  },
  {
    id: 'server-comunidade',
    name: 'COMUNIDADE',
    shortName: 'C',
    icon: 'C',
    accent: 'from-amber-500 to-orange-600',
    description: 'Interação geral da comunidade',
    members: 8,
  },
];

export const discordChannelsByServer: Record<string, DiscordChannel[]> = {
  'server-euforia': [
    { id: 'channel-geral', serverId: 'server-euforia', name: 'geral', type: 'text', topic: 'Conversas gerais da comunidade', unread: true },
    { id: 'channel-avisos', serverId: 'server-euforia', name: 'avisos', type: 'text', topic: 'Atualizações importantes', unread: true },
    { id: 'channel-noticias', serverId: 'server-euforia', name: 'notícias', type: 'text', topic: 'News e comunicados' },
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
  'server-comunidade': [
    { id: 'channel-comunidade-geral', serverId: 'server-comunidade', name: 'geral', type: 'text' },
    { id: 'voice-comunidade', serverId: 'server-comunidade', name: 'Conversa', type: 'voice' },
  ],
};

export const discordMessagesByChannel: Record<string, DiscordMessage[]> = {
  'channel-geral': [
    {
      id: 'msg-1',
      channelId: 'channel-geral',
      author: { id: 'u1', name: 'Alan Godoy', role: 'Administrador', avatar: 'AG', status: 'online' },
      content: 'Seja bem-vindo ao servidor! Aqui temos as atualizações da equipe.',
      timestamp: '15:32',
      reactions: [{ emoji: '🚀', count: 3 }, { emoji: '👏', count: 1 }],
    },
    {
      id: 'msg-2',
      channelId: 'channel-geral',
      author: { id: 'u2', name: 'João', role: 'Moderador', avatar: 'J', status: 'online' },
      content: 'Tudo certo pessoal! Vamos manter o canal organizado para facilitar a comunicação.',
      timestamp: '15:34',
    },
  ],
  'channel-avisos': [
    {
      id: 'msg-3',
      channelId: 'channel-avisos',
      author: { id: 'u3', name: 'Maria', role: 'Moderadora', avatar: 'M', status: 'idle' },
      content: 'Novas diretrizes serão publicadas hoje às 18h.',
      timestamp: '13:10',
    },
  ],
  'channel-noticias': [
    {
      id: 'msg-4',
      channelId: 'channel-noticias',
      author: { id: 'u4', name: 'Pedro', role: 'Membro', avatar: 'P', status: 'offline' },
      content: 'Confira as novidades da semana na comunidade.',
      timestamp: '12:45',
    },
  ],
};

export const discordMembersByServer: Record<string, DiscordMember[]> = {
  'server-euforia': [
    { id: 'u1', name: 'Alan Godoy', role: 'Administrador', status: 'online', avatar: 'AG', bio: 'Responsável pela comunicação da comunidade.', joinedAt: '2026' },
    { id: 'u2', name: 'João', role: 'Moderador', status: 'online', avatar: 'J', bio: 'Organiza reuniões e alertas.', joinedAt: '2026' },
    { id: 'u3', name: 'Maria', role: 'Moderadora', status: 'idle', avatar: 'M', bio: 'Acompanhará as atualizações do servidor.', joinedAt: '2026' },
    { id: 'u4', name: 'Pedro', role: 'Membro', status: 'offline', avatar: 'P', bio: 'Disponível em horários alternados.', joinedAt: '2026' },
    { id: 'u5', name: 'Lucas', role: 'Membro', status: 'dnd', avatar: 'L', bio: 'Atende demandas de suporte.', joinedAt: '2026' },
  ],
  'server-ocp': [
    { id: 'u6', name: 'Rafael', role: 'Comandante', status: 'online', avatar: 'R', bio: 'Coordena operações.', joinedAt: '2025' },
  ],
  'server-comunidade': [
    { id: 'u7', name: 'Camila', role: 'Membro', status: 'online', avatar: 'C', bio: 'Interage com a comunidade.', joinedAt: '2026' },
  ],
};
