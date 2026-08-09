import React from 'react';
import { Plus, BellRing } from 'lucide-react';

const DiscordServerList = ({ servers, selectedServerId, onSelectServer }) => {
  return (
    <aside className="hidden w-20 flex-col items-center justify-between border-r border-slate-800 bg-slate-900/90 px-3 py-4 md:flex">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-federal-500 to-fuchsia-600 text-sm font-bold text-white shadow-lg shadow-federal-900/40">
          CE
        </div>
        <div className="flex flex-col gap-2">
          {servers.map((server) => (
            <button
              key={server.id}
              onClick={() => onSelectServer(server.id)}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 text-sm font-semibold text-white transition-all ${selectedServerId === server.id ? 'bg-slate-100 text-slate-950 shadow-lg' : 'bg-slate-800 hover:bg-slate-700'}`}
              title={server.name}
            >
              <span>{server.shortName}</span>
              {server.unreadCount ? (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold">
                  {server.unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/70 text-slate-400 transition hover:border-federal-500 hover:text-white" title="Adicionar servidor">
          <Plus size={18} />
        </button>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-2 text-slate-400">
        <BellRing size={18} />
      </div>
    </aside>
  );
};

export default DiscordServerList;
