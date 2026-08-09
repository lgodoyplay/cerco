import React, { useMemo, useState } from 'react';
import { Compass, MessageCircleMore, Mic, PhoneOff, Users, Radio, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useDiscordServers } from '../../../hooks/useDiscordServers';
import { useDiscordChannels } from '../../../hooks/useDiscordChannels';
import { useDiscordMessages } from '../../../hooks/useDiscordMessages';
import { useDiscordMembers } from '../../../hooks/useDiscordMembers';
import { useDiscordVoice } from '../../../hooks/useDiscordVoice';
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
  const { servers, loading: serversLoading } = useDiscordServers();
  const [selectedServerId, setSelectedServerId] = useState('server-euforia');
  const [selectedChannelId, setSelectedChannelId] = useState('channel-geral');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [activeView, setActiveView] = useState('chat');
  const [draft, setDraft] = useState('');
  const [voiceUiState, setVoiceUiState] = useState({ isMuted: false, isDeafened: false, isSpeaking: true });
  const { channels, loading: channelsLoading } = useDiscordChannels(selectedServerId);
  const { messages, loading: messagesLoading, addMessage } = useDiscordMessages(selectedChannelId);
  const { members } = useDiscordMembers(selectedServerId);
  const { activeVoiceChannelId, isConnected, isMockMode, connectToVoice, disconnect } = useDiscordVoice();

  const selectedServer = useMemo(() => servers.find((server) => server.id === selectedServerId) || servers[0], [servers, selectedServerId]);
  const selectedChannel = useMemo(() => channels.find((channel) => channel.id === selectedChannelId) || channels[0], [channels, selectedChannelId]);
  const selectedMember = useMemo(() => members.find((member) => member.id === selectedMemberId) || null, [members, selectedMemberId]);
  const currentVoiceChannel = useMemo(() => channels.find((channel) => channel.id === activeVoiceChannelId) || null, [channels, activeVoiceChannelId]);

  const handleSendMessage = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!draft.trim()) return;
    await addMessage(draft);
    setDraft('');
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannelId(channel.id);
    setActiveView('chat');
    if (channel.type === 'voice') {
      connectToVoice(channel.id);
    }
  };

  const toggleMute = () => {
    setVoiceUiState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleAudio = () => {
    setVoiceUiState((prev) => ({ ...prev, isDeafened: !prev.isDeafened }));
  };

  const leaveVoice = () => {
    disconnect();
    setVoiceUiState((prev) => ({ ...prev, isMuted: false, isDeafened: false, isSpeaking: false }));
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[680px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl shadow-black/30">
      <div className="flex flex-1 overflow-hidden">
        <DiscordServerList
          servers={serversLoading ? [] : servers}
          selectedServerId={selectedServerId}
          onSelectServer={(serverId) => {
            setSelectedServerId(serverId);
            setSelectedChannelId(serverId === 'server-euforia' ? 'channel-geral' : serverId === 'server-ocp' ? 'channel-ocp-geral' : 'channel-comunidade-geral');
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
            {isConnected ? 'Você está conectado' : 'Conexão mockada'}
          </div>
          <span className="hidden sm:inline">Modo mockado • pronto para backend</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white" onClick={leaveVoice}>
            <PhoneOff size={16} />
          </button>
          <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white" onClick={() => {
            connectToVoice(selectedChannel?.id || activeVoiceChannelId || 'voice-geral');
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
