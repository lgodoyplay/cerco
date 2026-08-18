import React, { useState } from 'react';
import { Search, Volume2, Circle, Plus } from 'lucide-react';

const DiscordChannelSidebar = ({ server, channels, selectedChannelId, onSelectChannel, selectedChannelType, onCreateChannel, isCreatingChannel, newChannelName, onNewChannelNameChange, newChannelType, onNewChannelTypeChange, onJoinVoice }) => {
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
        <div className="flex items-center justify-between">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Canais de texto</p>
        </div>
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
        <div className="mt-2 flex items-center gap-2">
          <input
            value={newChannelName}
            onChange={(e) => onNewChannelNameChange(e.target.value)}
            placeholder="novo-canal"
            className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-federal-500"
          />
          <select
            value={newChannelType}
            onChange={(e) => onNewChannelTypeChange(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-xs text-slate-200 outline-none focus:border-federal-500"
          >
            <option value="text">Texto</option>
            <option value="voice">Voz</option>
          </select>
          <button
            onClick={onCreateChannel}
            disabled={isCreatingChannel || !newChannelName.trim()}
            className="rounded-lg border border-federal-700 bg-federal-900/40 px-2 py-2 text-xs text-federal-200 hover:bg-federal-800/60 disabled:opacity-50"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="mt-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Canais de voz</p>
        <div className="space-y-1">
          {voiceChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onJoinVoice(channel.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${selectedChannelId === channel.id ? 'bg-federal-600/20 text-white shadow-inner' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="flex items-center gap-2">
                <Volume2 size={14} />
                {channel.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default DiscordChannelSidebar;
