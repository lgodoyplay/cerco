import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Compass,
  MessageCircleMore,
  Mic,
  PhoneOff,
  Users,
  Radio,
  MoreHorizontal,
  RefreshCw,
  WifiOff,
  Wifi,
  ServerOff,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  getGuilds,
  getChannels,
  getMembers,
  getMessages,
  sendMessage,
  getMember,
  getBotStatus,
  createGuild,
  createChannel,
  joinVoice,
  leaveVoice,
} from '../../../services/internalComms/internalApi';

const cn = (...inputs) => twMerge(clsx(inputs));
import ServerSidebar from '../../../components/discord/ServerSidebar';
import ChannelSidebar from '../../../components/discord/ChannelSidebar';
import ChannelHeader from '../../../components/discord/ChannelHeader';
import MessageList from '../../../components/discord/MessageList';
import MessageComposer from '../../../components/discord/MessageComposer';
import MemberSidebar from '../../../components/discord/MemberSidebar';
import UserProfilePopover from '../../../components/discord/UserProfilePopover';
import { ServerModal, ChannelModal } from '../../../components/discord/ServerModal';
import ConnectionStatus from '../../../components/discord/ConnectionStatus';
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
  const [newServerName, setNewServerName] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');
  const [isCreatingServer, setIsCreatingServer] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [voiceUiState, setVoiceUiState] = useState({
    isMuted: false,
    isDeafened: false,
    isSpeaking: true,
  });
  const [connectionState, setConnectionState] = useState('connecting');
  const [botStatus, setBotStatus] = useState({
    status: 'offline',
    uptime: 0,
    latency: 0,
    guilds: 0,
  });
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);

  const safeServers = Array.isArray(servers) ? servers : [];
  const safeChannels = Array.isArray(channels) ? channels : [];
  const safeMembers = Array.isArray(members) ? members : [];

  const selectedServer = useMemo(
    () =>
      safeServers.find((server) => server.id === selectedServerId) ||
      safeServers[0] ||
      null,
    [safeServers, selectedServerId]
  );

  const selectedChannel = useMemo(
    () =>
      safeChannels.find((channel) => channel.id === selectedChannelId) ||
      safeChannels[0] ||
      null,
    [safeChannels, selectedChannelId]
  );

  const selectedMember = useMemo(
    () => safeMembers.find((member) => member.id === selectedMemberId) || null,
    [safeMembers, selectedMemberId]
  );

  const currentVoiceChannel = useMemo(
    () => safeChannels.find((channel) => channel.id === activeVoiceChannelId) || null,
    [safeChannels, activeVoiceChannelId]
  );

  const loadInitialData = async (showError = true) => {
    try {
      setServersLoading(true);
      setChannelsLoading(true);
      setMessagesLoading(true);
      setGlobalError(null);

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
      } else {
        setChannels([]);
        setSelectedChannelId('');
        setMembers([]);
      }
    } catch (error) {
      if (showError) {
        setGlobalError('Não foi possível carregar os dados do Discord. Tente novamente.');
      }
      console.error('Erro ao carregar dados do Discord:', error);
    } finally {
      setServersLoading(false);
      setChannelsLoading(false);
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedChannelId) {
      setMessages([]);
      return;
    }

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
    let mounted = true;

    const loadStatus = async () => {
      try {
        const status = await getBotStatus();
        if (mounted) {
          setBotStatus(status || { status: 'offline', uptime: 0, latency: 0, guilds: 0 });
          setConnectionState('connected');
        }
      } catch (error) {
        if (mounted) {
          setConnectionState('disconnected');
        }
      }
    };

    loadStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const handleSendMessage = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!draft.trim() || !selectedChannelId) return;
    try {
      const created = await sendMessage(selectedChannelId, draft.trim());
      if (created) {
        setMessages((prev) => [...prev, created]);
      }
      setDraft('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleChannelSelect = async (channel) => {
    setSelectedChannelId(channel.id);
    setActiveView('chat');
    if (channel.type === 'voice') {
      await handleJoinVoice(channel.id);
    }
    setIsMobileSidebarOpen(false);
  };

  const toggleMute = () => {
    setVoiceUiState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleAudio = () => {
    setVoiceUiState((prev) => ({ ...prev, isDeafened: !prev.isDeafened }));
  };

  const leaveVoice = async () => {
    if (activeVoiceChannelId) {
      try {
        await leaveVoice(activeVoiceChannelId);
      } catch (error) {
        console.error('Erro ao sair do canal de voz:', error);
      }
    }
    setActiveVoiceChannelId('');
    setIsConnected(false);
    setVoiceUiState((prev) => ({
      ...prev,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
    }));
    setVoiceError(null);
  };

  const handleCreateServer = async (name) => {
    setIsCreatingServer(true);
    try {
      const server = await createGuild(name);
      setServers((prev) => [server, ...prev]);
      setNewServerName('');
      setSelectedServerId(server.id);
      const channelData = await getChannels(server.id);
      setChannels(Array.isArray(channelData) ? channelData : []);
      setSelectedChannelId('');
      setMembers([]);
    } catch (error) {
      console.error('Erro ao criar servidor:', error);
    } finally {
      setIsCreatingServer(false);
    }
  };

  const handleCreateChannel = async (serverId, name, type) => {
    setIsCreatingChannel(true);
    try {
      const channel = await createChannel(serverId, name, type);
      setChannels((prev) => [...prev, channel]);
      setNewChannelName('');
      setSelectedChannelId(channel.id);
      setActiveView('chat');
    } catch (error) {
      console.error('Erro ao criar canal:', error);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleJoinVoice = async (channelId) => {
    setVoiceError(null);
    try {
      await joinVoice(channelId);
      setActiveVoiceChannelId(channelId);
      setIsConnected(true);
      setVoiceUiState((prev) => ({
        ...prev,
        isMuted: false,
        isDeafened: false,
        isSpeaking: true,
      }));
    } catch (error) {
      console.error('Erro ao entrar no canal de voz:', error);
      setVoiceError('Não foi possível entrar no canal de voz.');
    }
  };

  const handleSelectMember = useCallback((memberId) => {
    setSelectedMemberId(memberId);
    setIsMobileMembersOpen(false);
  }, []);

  const isEmpty = !serversLoading && safeServers.length === 0;
  const isBackendOffline =
    connectionState === 'disconnected' && !serversLoading && safeServers.length === 0;

  const handleSearchMessages = useCallback(
    (query) => {
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[680px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl shadow-black/30 transition-all">
      {globalError && (
        <div className="flex items-center justify-between border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {globalError}
          </span>
          <button
            onClick={handleRefresh}
            className="rounded-full border border-red-500/30 px-3 py-1 text-xs text-red-200 hover:bg-red-500/20 transition"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {voiceError && (
        <div className="flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {voiceError}
          </span>
          <button
            onClick={() => setVoiceError(null)}
            className="rounded-full border border-amber-500/30 px-3 py-1 text-xs text-amber-100 hover:bg-amber-500/20 transition"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {isBackendOffline && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="rounded-full border border-slate-700 p-4 text-slate-400">
              <ServerOff size={32} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Serviço indisponível</h3>
              <p className="mt-1 text-sm text-slate-400">
                Não foi possível conectar ao Discord no momento. Tente novamente em instantes.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-60 transition"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Atualizando...' : 'Tentar novamente'}
            </button>
          </div>
        )}

        {!isBackendOffline && (
          <>
            <div
              className={cn(
                'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300',
                isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            <div
              className={cn(
                'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:relative lg:z-auto lg:translate-x-0',
                isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              <div className="flex h-full items-center justify-between lg:hidden">
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-4 text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <ChannelSidebar
                server={selectedServer}
                channels={channelsLoading ? [] : safeChannels}
                selectedChannelId={selectedChannelId}
                selectedChannel={selectedChannel}
                onSelectChannel={handleChannelSelect}
                onCreateChannel={handleCreateChannel}
                isCreatingChannel={isCreatingChannel}
                newChannelName={newChannelName}
                onNewChannelNameChange={setNewChannelName}
                newChannelType={newChannelType}
                onNewChannelTypeChange={setNewChannelType}
                onJoinVoice={handleJoinVoice}
                onToggleMembers={() => setIsMobileMembersOpen(true)}
                isMobileMenuOpen={isMobileMembersOpen}
              />
            </div>

            <main className="flex min-w-0 flex-1 flex-col">
              <ChannelHeader
                channel={selectedChannel}
                onToggleMembers={() => setActiveView('members')}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
                onSearch={handleSearchMessages}
              />

              <div className="flex flex-1 overflow-hidden">
                <section className="flex flex-1 flex-col">
                  <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-800" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-48 animate-pulse rounded bg-slate-800" />
                              <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
                              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : isEmpty ? (
                      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                        <div className="rounded-full border border-dashed border-slate-700 bg-slate-950/70 p-5 text-slate-500">
                          <Radio size={40} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Nenhum servidor ainda</h3>
                          <p className="mt-1 max-w-xs text-sm text-slate-400">
                            Crie um servidor para começar a conversar com sua equipe.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowServerModal(true)}
                          className="inline-flex items-center gap-2 rounded-full border border-federal-700 bg-federal-900/40 px-4 py-2 text-sm font-semibold text-federal-200 transition hover:bg-federal-800/60"
                        >
                          <Plus size={16} />
                          Criar primeiro servidor
                        </button>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                        <div className="rounded-full border border-dashed border-slate-700 bg-slate-950/70 p-5 text-slate-500">
                          <MessageCircleMore size={40} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Sem mensagens</h3>
                          <p className="mt-1 max-w-xs text-sm text-slate-400">
                            Envie a primeira mensagem para iniciar a conversa neste canal.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <MessageList
                        messages={messages}
                        onSelectMember={(author) => {
                          setSelectedMemberId(author.id);
                        }}
                      />
                    )}
                  </div>

                  <div className="border-t border-slate-800 bg-slate-900/70 p-4 md:px-6">
                    <MessageComposer
                      draft={draft}
                      onDraftChange={setDraft}
                      onSend={handleSendMessage}
                      onAttachFile={() => {}}
                      channelType={selectedChannel?.type || 'text'}
                      channelName={selectedChannel?.name || ''}
                    />
                  </div>
                </section>

                <div
                  className={cn(
                    'flex w-full max-w-sm flex-col border-l border-slate-800 bg-slate-900/70 transition-all duration-300',
                    'hidden lg:flex',
                    activeView === 'members' ? 'flex' : 'hidden lg:flex'
                  )}
                >
                  <MemberSidebar
                    members={safeMembers}
                    selectedMemberId={selectedMemberId}
                    onSelectMember={handleSelectMember}
                  />
                  {selectedMember && (
                    <UserProfilePopover
                      member={selectedMember}
                      onClose={() => setSelectedMemberId(null)}
                    />
                  )}
                  {selectedChannel?.type === 'voice' && (
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
                  )}
                </div>
              </div>
            </main>
          </>
        )}
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
          <ConnectionStatus status={connectionState} />
          <span className="hidden text-slate-600 sm:inline">|</span>
          <span className="hidden sm:inline">
            Bot: {botStatus?.status || 'offline'} • {botStatus?.guilds || 0} servidor(es)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white transition"
            onClick={leaveVoice}
            title="Sair do voz"
          >
            <PhoneOff size={16} />
          </button>
          <button
            className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white transition disabled:opacity-60"
            onClick={() => {
              const targetId = selectedChannel?.id || activeVoiceChannelId || '';
              if (!targetId) return;
              setActiveVoiceChannelId(targetId);
              setIsConnected(Boolean(targetId));
              setVoiceUiState((prev) => ({ ...prev, isSpeaking: true }));
            }}
            title="Entrar no canal de voz"
          >
            <Mic size={16} />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300">
            <MessageCircleMore size={16} />
            <span className="hidden sm:inline">{user?.full_name || user?.username || 'Usuário'}</span>
          </div>
        </div>
      </footer>

      <ServerModal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
        onCreate={handleCreateServer}
      />
      <ChannelModal
        isOpen={showChannelModal}
        onClose={() => setShowChannelModal(false)}
        onCreate={handleCreateChannel}
        serverId={selectedServerId}
      />
    </div>
  );
};

export default DiscordPage;
