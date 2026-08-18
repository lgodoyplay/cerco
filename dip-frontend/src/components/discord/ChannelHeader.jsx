import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  Users,
  RefreshCw,
  Hash,
  Volume2,
  Inbox,
  ChevronDown,
  X,
  Menu,
  Phone,
  Video,
} from 'lucide-react';

const ChannelHeader = ({
  channel,
  onToggleMembers,
  onRefresh,
  isRefreshing,
  onToggleMobileSidebar,
  onSearch,
  onStartVoiceCall,
  onStartVideoCall,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (value) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const isCallable = channel?.type === 'text' || !channel?.type;

  return (
    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur-sm transition-all">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
          title="Canais"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {channel?.type === 'voice' ? (
              <Volume2 size={18} className="shrink-0 text-emerald-400" />
            ) : (
              <Hash size={18} className="shrink-0 text-federal-400" />
            )}
            <h2 className="truncate text-sm font-bold text-white md:text-base">
              {channel?.name || 'Selecionar canal'}
            </h2>
          </div>
          <p className="truncate text-xs text-slate-500 md:text-sm">
            {channel?.topic || channel?.description || 'Canal preparado para integração com backend.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              'rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white',
              showSearch && 'bg-slate-800 text-white'
            )}
            title="Pesquisar mensagens"
          >
            <Search size={16} />
          </button>
          {showSearch && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl animate-fade-in">
              <input
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-federal-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {isCallable && (
          <>
            <button
              onClick={() => onStartVoiceCall?.(channel?.id)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Chamada de voz"
            >
              <Phone size={16} />
            </button>
            <button
              onClick={() => onStartVideoCall?.(channel?.id)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Chamada de vídeo"
            >
              <Video size={16} />
            </button>
          </>
        )}

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            'rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-60',
            isRefreshing && 'animate-spin text-federal-400'
          )}
          title="Atualizar"
        >
          <RefreshCw size={16} />
        </button>

        <button
          onClick={onToggleMembers}
          className={cn(
            'rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white',
            'hidden md:flex'
          )}
          title="Membros"
        >
          <Users size={16} />
        </button>

        <button
          onClick={() => {}}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          title="Notificações"
        >
          <Bell size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChannelHeader;
