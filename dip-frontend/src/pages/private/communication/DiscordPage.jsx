import React, { useEffect, useMemo, useState } from 'react';
import { Compass, MessageCircleMore, Mic, PhoneOff, Users, Radio, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getGuilds, getChannels, getMembers, getMessages, sendMessage, getMember, getBotStatus } from '../../../services/internalComms/internalApi';
import { discordSocket } from '../../../services/internalComms/internalSocket';
import DiscordServerList from '../../../components/discord/DiscordServerList';
import DiscordChannelSidebar from '../../../components/discord/DiscordChannelSidebar';
import DiscordMessageList from '../../../components/discord/DiscordMessageList';
import DiscordMessageInput from '../../../components/discord/DiscordMessageInput';
import DiscordMemberList from '../../../components/discord/DiscordMemberList';
import DiscordUserProfile from '../../../components/discord/DiscordUserProfile';
import DiscordVoicePanel from '../../../components/discord/DiscordVoicePanel';
import DiscordVoiceMiniPlayer from '../../../components/discord/DiscordVoiceMiniPlayer';

const DiscordPage = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [activeView, setActiveView] = useState('chat');
  const [draft, setDraft] = useState('');
  const [voiceUiState, setVoiceUiState] = useState({ isMuted: false, isDeafened: false, isSpeaking: true });
  const [connectionState, setConnectionState] = useState('connecting');
  const [botStatus, setBotStatus] = useState({ status: 'offline', uptime: 0, latency: 0, guilds: 0 });
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const safeServers = Array.isArray(servers) ? servers : [];
  const safeChannels = Array.isArray(channels) ? channels : [];
  const safeMembers = Array.isArray(members) ? members : [];

  const selectedServer = useMemo(() => safeServers.find((server) => server.id === selectedServerId) || safeServers[0] || null, [safeServers, selectedServerId]);
  const selectedChannel = useMemo(() => safeChannels.find((channel) => channel.id === selectedChannelId) || safeChannels[0] || null, [safeChannels, selectedChannelId]);
  const selectedMember = useMemo(() => safeMembers.find((member) => member.id === selectedMemberId) || null, [safeMembers, selectedMemberId]);
  const currentVoiceChannel = useMemo(() => safeChannels.find((channel) => channel.id === activeVoiceChannelId) || null, [safeChannels, activeVoiceChannelId]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const guilds = await getGuilds();
        const normalizedGuilds = Array.isArray(guilds) ? guilds : [];
        setServers(normalizedGuilds);
        if (normalizedGuilds.length) {
          const firstGuild = normalizedGuilds[0];
          setSelectedServerId(firstGuild.id);
          const channelData = await getChannels(firstGuild.id);
          const normalizedChannels = Array.isArray(channelData) ? channelData : [];
          setChannels(normalizedChannels);
          const textChannel = normalizedChannels.find((channel) => channel.type === 'text');
          if (textChannel) {
            setSelectedChannelId(textChannel.id);
          }
          const membersData = await getMembers(firstGuild.id);
          setMembers(Array.isArray(membersData) ? membersData : []);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do Discord:', error);
      } finally {
        setServersLoading(false);
        setChannelsLoading(false);
        setMessagesLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedChannelId) return;

    const loadMessages = async () => {
      setMessagesLoading(true);
      try {
        const messageData = await getMessages(selectedChannelId);
        setMessages(Array.isArray(messageData) ? messageData : []);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, [selectedChannelId]);

  useEffect(() => {
    const listener = (event) => {
      if (event?.type === 'connected') {
        setConnectionState('connected');
      } else if (event?.type === 'disconnected') {
        setConnectionState('disconnected');
      } else if (event?.type === 'discord:message:create') {
        setMessages((prev) => {
          const exists = prev.some((item) => item.id === event.payload?.messageId);
          if (exists) return prev;
          return [
            ...prev,
            {
              id: event.payload?.messageId,
              channelId: event.payload?.channelId,
              author: {
                id: event.payload?.authorId,
                name: event.payload?.authorName,
                role: 'Discord',
                avatar: event.payload?.authorName?.slice(0, 2).toUpperCase() || 'DC',
                status: 'online',
              },
              content: event.payload?.content,
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            },
          ];
        });
      } else if (event?.type === 'discord:message:update') {
        setMessages((prev) => prev.map((item) => item.id === event.payload?.messageId ? { ...item, content: event.payload?.content } : item));
      } else if (event?.type === 'discord:message:delete') {
        setMessages((prev) => prev.filter((item) => item.id !== event.payload?.messageId));
      } else if (event?.type === 'discord:member:join' || event?.type === 'discord:member:leave') {
        const refreshMembers = async () => {
          if (selectedServerId) {
            const memberData = await getMembers(selectedServerId);
            setMembers(Array.isArray(memberData) ? memberData : []);
          }
        };
        refreshMembers();
      }
    };

    discordSocket.on(listener);
    discordSocket.connect();

    const loadStatus = async () => {
      const status = await getBotStatus();
      setBotStatus(status || { status: 'offline', uptime: 0, latency: 0, guilds: 0 });
    };
    loadStatus();

    return () => {
      discordSocket.off(listener);
    };
  }, [selectedServerId]);

  const handleSendMessage = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!draft.trim() || !selectedChannelId) return;
    const created = await sendMessage(selectedChannelId, draft.trim());
    if (created) {
      setMessages((prev) => [...prev, created]);
    }
    setDraft('');
  };

  const handleChannelSelect = async (channel) => {
    setSelectedChannelId(channel.id);
    setActiveView('chat');
    if (channel.type === 'voice') {
      setActiveVoiceChannelId(channel.id);
      setIsConnected(true);
    }
  };

  const toggleMute = () => {
    setVoiceUiState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleAudio = () => {
    setVoiceUiState((prev) => ({ ...prev, isDeafened: !prev.isDeafened }));
  };

  const leaveVoice = () => {
    setActiveVoiceChannelId('');
    setIsConnected(false);
    setVoiceUiState((prev) => ({ ...prev, isMuted: false, isDeafened: false, isSpeaking: false }));
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[680px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl shadow-black/30">
      <div className="flex flex-1 overflow-hidden">
        <DiscordServerList
          servers={serversLoading ? [] : servers}
          selectedServerId={selectedServerId}
          onSelectServer={async (serverId) => {
            setSelectedServerId(serverId);
            setChannelsLoading(true);
            try {
              const channelData = await getChannels(serverId);
              const normalizedChannels = Array.isArray(channelData) ? channelData : [];
              setChannels(normalizedChannels);
              const textChannel = normalizedChannels.find((channel) => channel.type === 'text');
              setSelectedChannelId(textChannel?.id || '');
              const memberData = await getMembers(serverId);
              setMembers(Array.isArray(memberData) ? memberData : []);
            } catch (error) {
              console.error('Erro ao trocar de servidor:', error);
            } finally {
              setChannelsLoading(false);
            }
            setActiveView('chat');
          }}
        />

        <DiscordChannelSidebar
          server={selectedServer}
          channels={channelsLoading ? [] : channels}
          selectedChannelId={selectedChannelId}
          selectedChannelType={selectedChannel?.type || 'text'}
          onSelectChannel={handleChannelSelect}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Compass size={16} />
                <span className="truncate">{selectedChannel?.name ? `# ${selectedChannel.name}` : 'Selecionar canal'}</span>
              </div>
              <p className="truncate text-sm text-slate-500">{selectedChannel?.topic || 'Canal preparado para integração com backend.'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white lg:hidden" onClick={() => setActiveView('members')}>
                <Users size={16} />
              </button>
              <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            <section className="flex flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-800/70" />)}
                  </div>
                ) : (
                  <DiscordMessageList messages={messages} />
                )}
              </div>

              <div className="border-t border-slate-800 bg-slate-900/70 p-4 md:px-6">
                <DiscordMessageInput
                  draft={draft}
                  onDraftChange={setDraft}
                  onSend={(event) => {
                    if (event) {
                      handleSendMessage(event);
                    }
                  }}
                  onAttachFile={() => {}}
                />
              </div>
            </section>

            <div className={`flex w-full max-w-sm flex-col border-l border-slate-800 bg-slate-900/70 p-4 transition-all lg:flex ${activeView === 'members' ? 'flex' : 'hidden'}`}>
              <DiscordMemberList members={members} selectedMemberId={selectedMemberId} onSelectMember={setSelectedMemberId} />
              <DiscordUserProfile member={selectedMember} />
              {selectedChannel?.type === 'voice' ? (
                <DiscordVoicePanel
                  channel={selectedChannel}
                  isInVoiceChannel={isConnected}
                  isMuted={voiceUiState.isMuted}
                  isDeafened={voiceUiState.isDeafened}
                  isSpeaking={voiceUiState.isSpeaking}
                  onToggleMute={toggleMute}
                  onToggleAudio={toggleAudio}
                  onLeaveVoice={leaveVoice}
                />
              ) : null}
            </div>
          </div>
        </main>
      </div>

      <DiscordVoiceMiniPlayer
        channel={currentVoiceChannel}
        isInVoiceChannel={isConnected}
        isMuted={voiceUiState.isMuted}
        isDeafened={voiceUiState.isDeafened}
        onToggleMute={toggleMute}
        onToggleAudio={toggleAudio}
        onLeaveVoice={leaveVoice}
      />

      <footer className="flex items-center justify-between border-t border-slate-800 bg-slate-900/70 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300">
            <Radio size={14} />
            {connectionState === 'connected' ? 'Conectado' : connectionState === 'reconnecting' ? 'Reconectando...' : connectionState === 'disconnected' ? 'Desconectado' : 'Conectando...'}
          </div>
          <span className="hidden sm:inline">Bot: {botStatus?.status || 'offline'} • {botStatus?.guilds || 0} servidor(es)</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white" onClick={leaveVoice}>
            <PhoneOff size={16} />
          </button>
          <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white" onClick={() => {
            setActiveVoiceChannelId(selectedChannel?.id || activeVoiceChannelId || '');
            setIsConnected(Boolean(selectedChannel?.id));
            setVoiceUiState((prev) => ({ ...prev, isSpeaking: true }));
          }}>
            <Mic size={16} />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300">
            <MessageCircleMore size={16} />
            {user?.full_name || user?.username || 'Usuário'}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DiscordPage;
