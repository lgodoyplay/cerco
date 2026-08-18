import React from 'react';
import { Hash, Volume2, Plus, Settings, Search, Circle, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const ServerSidebar = ({
  servers,
  selectedServerId,
  onSelectServer,
  onCreateServer,
  isCreatingServer,
  newServerName,
  onNewServerNameChange,
  onCreateChannel,
  isCreatingChannel,
  newChannelName,
  onNewChannelNameChange,
  newChannelType,
  onNewChannelTypeChange,
  onJoinVoice,
  channels,
  selectedChannelId,
  selectedChannel,
  onSelectChannel,
  onToggleMembers,
  isMobileMenuOpen,
}) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [isAddingChannel, setIsAddingChannel] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const sidebarRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsAdding(false);
        setIsAddingChannel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const textChannels = React.useMemo(
    () => channels.filter((channel) => channel.type === 'text'),
    [channels]
  );

  const voiceChannels = React.useMemo(
    () => channels.filter((channel) => channel.type === 'voice'),
    [channels]
  );

  const filteredText = React.useMemo(
    () => textChannels.filter((ch) => ch.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [textChannels, searchQuery]
  );

  const filteredVoice = React.useMemo(
    () => voiceChannels.filter((ch) => ch.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [voiceChannels, searchQuery]
  );

  const server = Array.isArray(servers) ? servers.find((s) => s.id === selectedServerId) : undefined;

  return (
    <div className="flex w-full flex-col border-r border-slate-800 bg-slate-900/95 lg:w-72" ref={sidebarRef}>
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-federal-500 to-fuchsia-600 text-xs font-bold text-white">
            {server?.shortName || server?.name?.charAt(0) || 'CE'}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-white">{server?.name || 'Selecione um servidor'}</h2>
            <p className="truncate text-xs text-slate-500">{server?.description || 'Comunicação interna'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMembers}
            className={cn(
              'rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden',
              isMobileMenuOpen && 'bg-slate-800 text-white'
            )}
            title="Membros"
          >
            <Users size={16} />
          </button>
          <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white" title="Configurações">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
        <div className="mb-4 px-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar canais..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-200 outline-none transition focus:border-federal-500 focus:ring-1 focus:ring-federal-500/40"
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">Canais de texto</span>
            <span className="text-[10px] font-semibold text-slate-600">{filteredText.length}</span>
          </div>
          <div className="space-y-0.5">
            {filteredText.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={cn(
                  'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all',
                  selectedChannelId === channel.id
                    ? 'bg-federal-600/20 text-white shadow-inner'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Hash size={14} className="shrink-0 text-slate-500" />
                <span className="truncate">{channel.name}</span>
                {channel.unread && <Circle size={8} className="ml-auto shrink-0 fill-rose-400 text-rose-400" />}
              </button>
            ))}
          </div>
          {isAddingChannel ? (
            <div className="mt-2 space-y-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-2">
              <input
                value={newChannelName}
                onChange={(e) => onNewChannelNameChange(e.target.value)}
                placeholder="nome-do-canal"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-federal-500"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={newChannelType}
                  onChange={(e) => onNewChannelTypeChange(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 outline-none focus:border-federal-500"
                >
                  <option value="text">Texto</option>
                  <option value="voice">Voz</option>
                </select>
                 <button
                   onClick={() => onCreateChannel(selectedServerId, newChannelName, newChannelType)}
                   disabled={isCreatingChannel || !newChannelName.trim()}
                   className="rounded-lg border border-federal-700 bg-federal-900/40 px-3 py-2 text-xs font-semibold text-federal-200 transition hover:bg-federal-800/60 disabled:opacity-50"
                 >
                   Criar
                 </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingChannel(true)}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
            >
              <Plus size={14} /> Adicionar canal
            </button>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">Canais de voz</span>
            <span className="text-[10px] font-semibold text-slate-600">{filteredVoice.length}</span>
          </div>
          <div className="space-y-0.5">
            {filteredVoice.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onJoinVoice(channel.id)}
                className={cn(
                  'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all',
                  selectedChannelId === channel.id
                    ? 'bg-federal-600/20 text-white shadow-inner'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Volume2 size={14} className="shrink-0 text-slate-500" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerSidebar;
