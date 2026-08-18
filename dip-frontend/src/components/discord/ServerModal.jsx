import React, { useState, useRef, useEffect } from 'react';
import { Plus, Hash, Volume2, Settings, Users, Search, ChevronDown, ChevronRight, Circle } from 'lucide-react';

const ServerModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (!isOpen) setName('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Criar servidor</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <Circle size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Nome do servidor</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Operações Táticas"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-federal-500 focus:ring-1 focus:ring-federal-500/40"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white">
              Cancelar
            </button>
            <button type="submit" disabled={!name.trim()} className="rounded-xl bg-federal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-federal-500 disabled:opacity-50">
              Criar servidor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChannelModal = ({ isOpen, onClose, onCreate, serverId }) => {
  const [name, setName] = useState('text');
  const [channelName, setChannelName] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('text');
      setChannelName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!channelName.trim() || !serverId) return;
    onCreate(serverId, channelName.trim().toLowerCase().replace(/\s+/g, '-'), name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Criar canal</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <Circle size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Nome do canal</label>
            <input
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Ex: operacoes"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-federal-500 focus:ring-1 focus:ring-federal-500/40"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Tipo</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setName('text')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${name === 'text' ? 'border-federal-500 bg-federal-600/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'}`}
              >
                <Hash size={16} /> Texto
              </button>
              <button
                type="button"
                onClick={() => setName('voice')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${name === 'voice' ? 'border-federal-500 bg-federal-600/20 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'}`}
              >
                <Volume2 size={16} /> Voz
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white">
              Cancelar
            </button>
            <button type="submit" disabled={!channelName.trim()} className="rounded-xl bg-federal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-federal-500 disabled:opacity-50">
              Criar canal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserProfilePopover = ({ member, onClose }) => {
  const popoverRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (member) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [member, onClose]);

  if (!member) return null;

  const statusStyles = {
    online: 'bg-emerald-400',
    idle: 'bg-amber-400',
    offline: 'bg-slate-500',
    dnd: 'bg-rose-500',
  };

  const statusLabels = {
    online: 'Online',
    idle: 'Ausente',
    offline: 'Offline',
    dnd: 'Não perturbe',
  };

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-4 mb-2 w-72 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => { setIsHovering(false); onClose(); }}
    >
      <div className="h-24 rounded-t-2xl bg-gradient-to-r from-federal-600 to-violet-600" />
      <div className="px-4 pb-4">
        <div className="relative -mt-10 mb-3 flex items-end justify-between">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-900 bg-gradient-to-br from-federal-500 to-violet-600 text-lg font-bold text-white shadow-lg">
            {member.avatar}
          </div>
          <span className={`mb-1 rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyles[member.status] ? 'text-white' : 'text-slate-400'}`}>
            {statusLabels[member.status]}
          </span>
        </div>
        <h4 className="text-base font-bold text-white">{member.name}</h4>
        <p className="text-xs text-slate-400">{member.role}</p>
        <div className="mt-3 space-y-1 text-xs text-slate-400">
          <p>ID: {member.id}</p>
          <p>Membro desde: {member.joinedAt || 'Indisponível'}</p>
          {member.bio && <p className="pt-2 text-slate-300">{member.bio}</p>}
        </div>
      </div>
    </div>
  );
};

export { ServerModal, ChannelModal, UserProfilePopover };
