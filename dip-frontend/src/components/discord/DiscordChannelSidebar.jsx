import React from 'react';
import { Search, Volume2, Circle } from 'lucide-react';

const DiscordChannelSidebar = ({ server, channels, selectedChannelId, onSelectChannel, selectedChannelType }) => {
  const textChannels = channels.filter((channel) => channel.type === 'text');
  const voiceChannels = channels.filter((channel) => channel.type === 'voice');

  return (
    <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-900/80 p-4 lg:flex">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Servidor</p>
            <h2 className="text-lg font-semibold text-white">{server?.name || 'Servidor'}</h2>
          </div>
          <button className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white">
            <Search size={16} />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-400">{server?.description || 'Comunicação interna modular'}</p>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Canais de texto</p>
        <div className="space-y-1">
          {textChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel)}
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
          {voiceChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${selectedChannelType === 'voice' && selectedChannelId === channel.id ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
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
  );
};

export default DiscordChannelSidebar;
