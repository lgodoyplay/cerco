export interface DiscordServer {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  accent: string;
  description: string;
  members: number;
  unreadCount?: number;
}

export interface DiscordChannel {
  id: string;
  serverId: string;
  name: string;
  type: 'text' | 'voice';
  topic?: string;
  unread?: boolean;
  connected?: boolean;
}

export interface DiscordReaction {
  emoji: string;
  count: number;
}

export interface DiscordMessage {
  id: string;
  channelId: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    status: 'online' | 'idle' | 'offline';
  };
  content: string;
  timestamp: string;
  attachments?: string[];
  reactions?: DiscordReaction[];
}

export interface DiscordMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'idle' | 'offline' | 'dnd';
  avatar: string;
  bio?: string;
  joinedAt?: string;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: string;
}

export interface DiscordVoiceChannel extends DiscordChannel {
  type: 'voice';
  connected: boolean;
}
