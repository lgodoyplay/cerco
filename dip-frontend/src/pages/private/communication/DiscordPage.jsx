import React, { useMemo, useState } from 'react';
import { MessageCircleMore, Mic, PhoneOff, Plus, Search, Sparkles, Users, Volume2, ChevronRight, MoreHorizontal, Smile, Paperclip, Film, Send, BellRing, Circle, Compass, Radio } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useDiscordServers } from '../../../hooks/useDiscordServers';
import { useDiscordChannels } from '../../../hooks/useDiscordChannels';
import { useDiscordMessages } from '../../../hooks/useDiscordMessages';
import { useDiscordMembers } from '../../../hooks/useDiscordMembers';
import { useDiscordVoice } from '../../../hooks/useDiscordVoice';

const DiscordPage = () => {
  const { user } = useAuth();
  const { servers, loading: serversLoading } = useDiscordServers();
  const [selectedServerId, setSelectedServerId] = useState('server-euforia');
  const [selectedChannelId, setSelectedChannelId] = useState('channel-geral');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [activeView, setActiveView] = useState('chat');
  const [draft, setDraft] = useState('');
  const { channels, loading: channelsLoading } = useDiscordChannels(selectedServerId);
  const { messages, loading: messagesLoading, addMessage } = useDiscordMessages(selectedChannelId);
  const { members } = useDiscordMembers(selectedServerId);
  const { activeVoiceChannelId, isConnected, isMockMode, connectToVoice, disconnect } = useDiscordVoice();

  const selectedServer = useMemo(() => servers.find((server) => server.id === selectedServerId) || servers[0], [servers, selectedServerId]);
  const selectedChannel = useMemo(() => channels.find((channel) => channel.id === selectedChannelId) || channels[0], [channels, selectedChannelId]);
  const selectedMember = useMemo(() => members.find((member) => member.id === selectedMemberId) || null, [members, selectedMemberId]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
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

  const renderStatusDot = (status) => {
    if (status === 'online') return <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />;
    if (status === 'idle') return <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />;
    return <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />;
  };

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[680px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl shadow-black/30">
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-20 flex-col items-center justify-between border-r border-slate-800 bg-slate-900/90 px-3 py-4 md:flex">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-federal-500 to-fuchsia-600 text-sm font-bold text-white shadow-lg shadow-federal-900/40">
              CE
            </div>
            <div className="flex flex-col gap-2">
              {serversLoading ? <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-800" /> : servers.map((server) => (
                <button
                  key={server.id}
                  onClick={() => {
                    setSelectedServerId(server.id);
                    setSelectedChannelId(server.id === 'server-euforia' ? 'channel-geral' : 'channel-ocp-geral');
                    setActiveView('chat');
                  }}
                  className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 text-sm font-semibold text-white transition-all ${selectedServerId === server.id ? 'bg-slate-100 text-slate-950 shadow-lg' : 'bg-slate-800 hover:bg-slate-700'}`}
                  title={server.name}
                >
                  <span>{server.shortName}</span>
                  {server.unreadCount ? <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold">{server.unreadCount}</span> : null}
                </button>
              ))}
            </div>
            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/70 text-slate-400 transition hover:border-federal-500 hover:text-white">
              <Plus size={18} />
            </button>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-2 text-slate-400">
            <BellRing size={18} />
          </div>
        </aside>

        <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-900/80 p-4 lg:flex">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Servidor</p>
                <h2 className="text-lg font-semibold text-white">{selectedServer?.name || 'Servidor'}</h2>
              </div>
              <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white">
                <Search size={16} />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-400">{selectedServer?.description || 'Comunicação interna modular'}</p>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Canais de texto</p>
            <div className="space-y-1">
              {channelsLoading ? <div className="h-8 animate-pulse rounded-lg bg-slate-800" /> : channels.filter((channel) => channel.type === 'text').map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${selectedChannelId === channel.id ? 'bg-federal-600/20 text-white shadow-inner' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-slate-500">#</span>
                    {channel.name}
                  </span>
                  {channel.unread ? <Circle size={8} className="text-rose-400" fill="currentColor" /> : null}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Canais de voz</p>
            <div className="space-y-1">
              {channels.filter((channel) => channel.type === 'voice').map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${activeVoiceChannelId === channel.id ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2">
                    <Volume2 size={14} />
                    {channel.name}
                  </span>
                  {channel.connected ? <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">Conectado</span> : null}
                </button>
              ))}
            </div>
          </div>
        </aside>

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
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm shadow-black/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-federal-500 to-violet-600 text-sm font-semibold text-white">
                              {message.author.avatar}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-white">{message.author.name}</span>
                                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-400">{message.author.role}</span>
                                <span className="text-xs text-slate-500">{message.timestamp}</span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-300">{message.content}</p>
                              {message.attachments?.length ? (
                                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-800/70 p-2 text-sm text-slate-300">
                                  {message.attachments.join(', ')}
                                </div>
                              ) : null}
                              {message.reactions?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {message.reactions.map((reaction) => (
                                    <span key={`${message.id}-${reaction.emoji}`} className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">
                                      {reaction.emoji} {reaction.count}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <button className="rounded-full p-2 text-slate-500 hover:bg-slate-800 hover:text-white">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-slate-800 bg-slate-900/70 p-4 md:px-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 shadow-inner shadow-black/20">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSendMessage(event);
                      }
                    }}
                    rows={3}
                    placeholder="Digite uma mensagem..."
                    className="w-full resize-none border-none bg-transparent text-sm text-slate-200 outline-none"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
                    <div className="flex items-center gap-2">
                      <button type="button" className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:text-white">
                        <Smile size={16} />
                      </button>
                      <button type="button" className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:text-white">
                        <Paperclip size={16} />
                      </button>
                      <button type="button" className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:text-white">
                        <Film size={16} />
                      </button>
                    </div>
                    <button type="submit" className="flex items-center gap-2 rounded-full bg-federal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-federal-500">
                      <Send size={16} />
                      Enviar
                    </button>
                  </div>
                </div>
              </form>
            </section>

            <aside className={`w-full max-w-sm border-l border-slate-800 bg-slate-900/70 p-4 transition-all lg:flex lg:flex-col ${activeView === 'members' ? 'flex' : 'hidden'}`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Membros</p>
                  <h3 className="text-base font-semibold text-white">Online</h3>
                </div>
                <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white lg:hidden" onClick={() => setActiveView('chat')}>
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-left transition hover:border-federal-500/40 hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-600 text-sm font-semibold text-white">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{member.name}</span>
                          {renderStatusDot(member.status)}
                        </div>
                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{member.status === 'online' ? 'on' : 'off'}</span>
                  </button>
                ))}
              </div>

              {selectedMember ? (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-federal-500 to-violet-600 text-sm font-semibold text-white">
                      {selectedMember.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{selectedMember.name}</p>
                      <p className="text-sm text-slate-400">{selectedMember.role}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-400">
                    <p>{selectedMember.bio}</p>
                    <p>Entrou em: {selectedMember.joinedAt}</p>
                  </div>
                  <button className="mt-4 flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:text-white">
                    <Sparkles size={14} />
                    Editar perfil
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                  Clique em um membro para abrir o perfil.
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>

      <footer className="flex items-center justify-between border-t border-slate-800 bg-slate-900/70 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300">
            <Radio size={14} />
            {isConnected ? 'Você está conectado' : 'Conexão mockada'}
          </div>
          <span className="hidden sm:inline">Modo mockado • pronto para backend</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white" onClick={() => disconnect()}>
            <PhoneOff size={16} />
          </button>
          <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white" onClick={() => connectToVoice(activeVoiceChannelId || 'voice-geral')}>
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
