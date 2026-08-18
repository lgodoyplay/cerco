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
  Plus,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  fluxerGetGuilds,
  fluxerGetChannels,
  fluxerGetMembers,
  fluxerGetMessages,
  fluxerSendMessage,
  fluxerGetBotStatus,
  fluxerStartVoiceCall,
  fluxerEndVoiceCall,
} from '../../../services/fluxer/api';
import { fluxerSocket } from '../../../services/fluxer/socket';
import { fluxerVoiceService } from '../../../services/fluxer/voice';

const cn = (...inputs) => twMerge(clsx(inputs));

import ServerSidebar from '../../../components/discord/ServerSidebar';
import ChannelSidebar from '../../../components/discord/ChannelSidebar';
import ChannelHeader from '../../../components/discord/ChannelHeader';
import DiscordChat from '../../../components/discord/DiscordChat';
import MessageComposer from '../../../components/discord/MessageComposer';
import MemberSidebar from '../../../components/discord/MemberSidebar';
import UserProfilePopover from '../../../components/discord/UserProfilePopover';
import { ServerModal, ChannelModal } from '../../../components/discord/ServerModal';
import ConnectionStatus from '../../../components/discord/ConnectionStatus';
import VoicePanel from '../../../components/discord/VoicePanel';
import DiscordVoiceMiniPlayer from '../../../components/discord/DiscordVoiceMiniPlayer';

const DiscordPage = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isCreatingServer, setIsCreatingServer] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const [botStatus, setBotStatus] = useState({
    status: 'offline',
    uptime: 0,
    guilds: 0,
  });
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState('');
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
      safeChannels.find((channel) => channel.type === 'text') ||
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
      setGlobalError(null);

      const guilds = await fluxerGetGuilds();
      const normalizedGuilds = Array.isArray(guilds) ? guilds : [];
      setServers(normalizedGuilds);

      if (normalizedGuilds.length) {
        const firstGuild = normalizedGuilds[0];
        const guildId = typeof firstGuild.id === 'string' ? firstGuild.id : String(firstGuild.id || '');
        setSelectedServerId(guildId);

        const [channelData, membersData] = await Promise.all([
          fluxerGetChannels(guildId),
          fluxerGetMembers(guildId),
        ]);

        const normalizedChannels = Array.isArray(channelData) ? channelData : [];
        setChannels(normalizedChannels);

        const textChannel = normalizedChannels.find((channel) => channel.type === 'text');
        setSelectedChannelId(textChannel?.id || normalizedChannels[0]?.id || '');
        setMembers(Array.isArray(membersData) ? membersData : []);
      } else {
        setChannels([]);
        setSelectedChannelId('');
        setMembers([]);
      }
    } catch (error) {
      if (showError) {
        setGlobalError('Não foi possível carregar os dados do Fluxer. Tente novamente.');
      }
      console.error('Erro ao carregar dados do Fluxer:', error);
    } finally {
      setServersLoading(false);
      setChannelsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const unsubscribeSocket = fluxerSocket.subscribe((event, payload) => {
      if (event === 'fluxer:status') {
        const state = payload?.state;
        if (state === 'connected') {
          setConnectionState('connected');
        } else if (state === 'disconnected') {
          setConnectionState('disconnected');
        } else if (state === 'reconnecting') {
          setConnectionState('reconnecting');
        }
        return;
      }

      if (event === 'fluxer:event') {
        const data = payload;
        if (data?.event === 'MESSAGE_CREATE') {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === data.payload.id);
            if (exists) return prev;
            return [...prev, data.payload];
          });
        } else if (data?.event === 'MESSAGE_UPDATE') {
          setMessages((prev) => prev.map((m) => (m.id === data.payload.id ? data.payload : m)));
        } else if (data?.event === 'MESSAGE_DELETE') {
          setMessages((prev) => prev.filter((m) => m.id !== data.payload.id));
        } else if (data?.event === 'VOICE_STATE_UPDATE') {
          const voiceState = data.payload;
          if (voiceState?.channel_id) {
            setActiveVoiceChannelId(voiceState.channel_id);
          }
          fluxerVoiceService.setParticipants(
            Array.isArray(data.payload?.participants) ? data.payload.participants : []
          );
        }
      }
    });

    return () => {
      unsubscribeSocket();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadStatus = async () => {
      try {
        console.log('[Fluxer Frontend] Carregando status do bot...');
        const status = await fluxerGetBotStatus();
        console.log('[Fluxer Frontend] Status recebido:', status);
        if (mounted) {
          setBotStatus(status || { status: 'connected', uptime: 0, guilds: 0 });
          setConnectionState('connected');
        }
      } catch (error) {
        console.error('[Fluxer Frontend] Falha ao carregar status:', error);
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

  const handleChannelSelect = async (channel) => {
    const channelId = typeof channel?.id === 'string' ? channel.id : String(channel?.id || '');
    setSelectedChannelId(channelId);
    setIsMobileSidebarOpen(false);
  };

  const handleSelectServer = async (server) => {
    const serverId = typeof server?.id === 'string' ? server.id : String(server?.id || '');
    setSelectedServerId(serverId);
    setChannelsLoading(true);
    setSelectedChannelId('');

    try {
      const [channelData, membersData] = await Promise.all([
        fluxerGetChannels(serverId),
        fluxerGetMembers(serverId),
      ]);

      const normalizedChannels = Array.isArray(channelData) ? channelData : [];
      setChannels(normalizedChannels);

      const textChannel = normalizedChannels.find((channel) => channel.type === 'text');
      setSelectedChannelId(textChannel?.id || normalizedChannels[0]?.id || '');
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Erro ao carregar canais do servidor:', error);
    } finally {
      setChannelsLoading(false);
    }
  };

  const handleSelectMember = useCallback((memberId) => {
    setSelectedMemberId(memberId);
    setIsMobileMembersOpen(false);
  }, []);

  const handleCreateServer = async (name) => {
    setIsCreatingServer(true);
    try {
      setGlobalError('Criação de servidores ainda não está disponível via API pública do Fluxer.');
    } finally {
      setIsCreatingServer(false);
    }
  };

  const handleCreateChannel = async (serverId, name, type) => {
    const targetServerId =
      typeof serverId === 'object' && serverId !== null
        ? serverId.id
        : serverId;

    if (!targetServerId) {
      console.error('Erro ao criar canal: serverId inválido', { serverId });
      return;
    }

    setIsCreatingChannel(true);
    try {
      setGlobalError('Criação de canais ainda não está disponível via API pública do Fluxer.');
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleJoinVoice = async (channelId) => {
    if (!channelId) return;
    setVoiceError(null);

    try {
      const call = await fluxerStartVoiceCall(channelId);
      const voiceServer = call?.voice_server || call;
      const liveKitInfo = {
        endpoint: voiceServer?.endpoint,
        token: voiceServer?.token,
        roomName: call?.room_name || call?.channel_id,
      };

      if (!liveKitInfo.endpoint || !liveKitInfo.token) {
        setVoiceError('Servidor de voz não retornou informações LiveKit suficientes.');
        return;
      }

      await fluxerVoiceService.join(selectedServerId, channelId, liveKitInfo);
      setActiveVoiceChannelId(channelId);
    } catch (error) {
      console.error('Erro ao entrar no canal de voz:', error);
      setVoiceError(error?.message || 'Não foi possível entrar no canal de voz.');
    }
  };

  const handleLeaveVoice = async () => {
    const cid = activeVoiceChannelId;
    if (cid) {
      try {
        await fluxerEndVoiceCall(cid);
      } catch (error) {
        console.error('Erro ao sair do canal de voz:', error);
      }
    }
    await fluxerVoiceService.leave();
    setActiveVoiceChannelId('');
    setVoiceError(null);
  };

  const handleSendMessage = useCallback(
    async (content) => {
      if (!selectedChannelId || !content.trim()) return;

      try {
        const created = await fluxerSendMessage(selectedChannelId, content.trim());
        return created;
    } catch (error) {
      setGlobalError(error?.message || 'Falha ao enviar mensagem.');
      console.error('Erro ao enviar mensagem:', error);
      throw error;
      }
    },
    [selectedChannelId]
  );

  const isEmpty = !serversLoading && safeServers.length === 0;
  const isBackendOffline = connectionState === 'disconnected' && !serversLoading && safeServers.length === 0;

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
                Não foi possível conectar ao Fluxer no momento. Tente novamente em instantes.
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
                servers={safeServers}
                selectedServerId={selectedServerId}
                channels={channelsLoading ? [] : safeChannels}
                selectedChannelId={selectedChannelId}
                selectedChannel={selectedChannel}
                onSelectChannel={handleChannelSelect}
                onCreateChannel={handleCreateChannel}
                isCreatingChannel={isCreatingChannel}
                newChannelName=""
                onNewChannelNameChange={() => {}}
                newChannelType="text"
                onNewChannelTypeChange={() => {}}
                onJoinVoice={handleJoinVoice}
                onToggleMembers={() => setIsMobileMembersOpen(true)}
                isMobileMenuOpen={isMobileMembersOpen}
              />
            </div>

            <main className="flex min-w-0 flex-1 flex-col">
              <DiscordChat channel={selectedChannel} onSelectMember={handleSelectMember} />
            </main>
          </>
        )}
      </div>

      <VoicePanel channel={currentVoiceChannel} guildId={selectedServerId} />

      <DiscordVoiceMiniPlayer
        channel={currentVoiceChannel}
        isInVoiceChannel={!!activeVoiceChannelId}
        isMuted={fluxerVoiceService.getState().muted}
        isDeafened={fluxerVoiceService.getState().deafened}
        onToggleMute={() => fluxerVoiceService.toggleMute()}
        onToggleAudio={() => fluxerVoiceService.toggleDeafen()}
        onLeaveVoice={handleLeaveVoice}
      />

      <footer className="flex items-center justify-between border-t border-slate-800 bg-slate-900/70 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <ConnectionStatus status={connectionState} />
          <span className="hidden text-slate-600 sm:inline">|</span>
          <span className="hidden sm:inline">
            Fluxer: {botStatus?.status || 'offline'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white transition"
            onClick={handleLeaveVoice}
            title="Sair do voz"
          >
            <PhoneOff size={16} />
          </button>
          <button
            className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white transition disabled:opacity-60"
            onClick={() => {
              const targetId = selectedChannel?.id || activeVoiceChannelId || '';
              if (!targetId) return;
              handleJoinVoice(targetId);
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
