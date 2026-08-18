import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

const ServerSidebar = ({
  servers,
  selectedServerId,
  onSelectServer,
  onCreateServer,
  isCreatingServer,
  newServerName,
  onNewServerNameChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleCreate = async () => {
    if (!newServerName.trim() || !onCreateServer) return;
    await onCreateServer();
    setIsAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
    }
  };

  return (
    <aside className="flex w-20 flex-col items-center justify-between border-r border-slate-800 bg-slate-900/95 py-4 transition-all duration-300">
      <div className="flex flex-col items-center gap-3">
        {servers.map((server) => (
          <div key={server.id} className="relative group">
            <button
              onClick={() => onSelectServer(server.id)}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-bold text-white transition-all duration-200',
                selectedServerId === server.id
                  ? 'rounded-2xl bg-slate-100 text-slate-950 shadow-lg shadow-black/30 border-transparent'
                  : 'rounded-3xl bg-slate-800 border-slate-700 hover:rounded-2xl hover:bg-slate-700 hover:border-slate-600'
              )}
              title={server.name}
            >
              <span className="truncate px-1">{server.shortName || server.name.slice(0, 2).toUpperCase()}</span>
            </button>
            {selectedServerId !== server.id && (
              <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 -translate-x-5 rounded-r-full bg-white opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-x-4" />
            )}
            {server.unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg">
                {server.unreadCount}
              </span>
            )}
          </div>
        ))}

        {isAdding ? (
          <div className="flex w-12 flex-col gap-2 rounded-2xl border border-slate-700 bg-slate-950 p-2 animate-fade-in">
            <input
              ref={inputRef}
              value={newServerName}
              onChange={(e) => onNewServerNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nome..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-federal-500"
            />
            <button
              onClick={handleCreate}
              disabled={isCreatingServer || !newServerName.trim()}
              className="rounded-lg border border-federal-700 bg-federal-900/40 px-2 py-1.5 text-xs font-semibold text-federal-200 transition hover:bg-federal-800/60 disabled:opacity-50"
            >
              Criar
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/70 text-slate-400 transition-all duration-200 hover:border-federal-500 hover:text-white hover:bg-slate-800"
            title="Adicionar servidor"
          >
            <Plus size={18} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default ServerSidebar;
