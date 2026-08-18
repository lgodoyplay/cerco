import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, UserX, Shield, Volume2, VolumeX, PhoneOff, Mic, MicOff, Copy, UserPlus, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const statusStyles = {
  online: 'bg-emerald-400',
  idle: 'bg-amber-400',
  offline: 'bg-slate-600',
  dnd: 'bg-rose-500',
};

const statusLabels = {
  online: 'Online',
  idle: 'Ausente',
  offline: 'Offline',
  dnd: 'Não perturbe',
};

const MemberSidebar = ({ members, selectedMemberId, onSelectMember, voiceMembers = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const onlineMembers = React.useMemo(
    () => members.filter((m) => m.status !== 'offline'),
    [members]
  );

  const offlineMembers = React.useMemo(
    () => members.filter((m) => m.status === 'offline'),
    [members]
  );

  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const filteredOnline = React.useMemo(
    () => filteredMembers.filter((m) => m.status !== 'offline'),
    [filteredMembers]
  );

  const filteredOffline = React.useMemo(
    () => filteredMembers.filter((m) => m.status === 'offline'),
    [filteredMembers]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">Membros</p>
            <h3 className="text-sm font-bold text-white">
              {onlineMembers.length} <span className="font-normal text-slate-500">online</span>
            </h3>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="rounded-lg border border-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Filtros"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar membro..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none transition focus:border-federal-500 focus:ring-1 focus:ring-federal-500/40"
            />
            <UserX size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredOnline.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-600">
              Online — {filteredOnline.length}
            </p>
            <div className="space-y-1">
              {filteredOnline.map((member) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  isSelected={selectedMemberId === member.id}
                  onSelect={onSelectMember}
                />
              ))}
            </div>
          </div>
        )}

        {filteredOffline.length > 0 && (
          <div>
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-600">
              Offline — {filteredOffline.length}
            </p>
            <div className="space-y-1">
              {filteredOffline.map((member) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  isSelected={selectedMemberId === member.id}
                  onSelect={onSelectMember}
                  isOffline
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MemberItem = ({ member, isSelected, onSelect, isOffline = false }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <button
        onClick={() => onSelect(member.id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-200',
          isSelected
            ? 'border-federal-500/40 bg-slate-800'
            : 'border-transparent bg-transparent hover:border-slate-800 hover:bg-slate-900/60',
          isOffline && 'opacity-60'
        )}
      >
        <div className="relative shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-600 text-xs font-semibold text-white">
            {member.avatar}
          </div>
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900',
              statusStyles[member.status] || 'bg-slate-600'
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-white">{member.name}</span>
            {member.role && member.role !== 'Membro' && (
              <span className="hidden rounded-full border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-400 sm:inline-block">
                {member.role}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-500">{statusLabels[member.status] || 'Offline'}</p>
        </div>

        <div
          className={cn(
            'flex items-center gap-1 transition-opacity duration-200',
            showActions ? 'opacity-100' : 'opacity-0'
          )}
        >
          <button className="rounded p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white" title="Mencionar">
            <MessageSquare size={12} />
          </button>
          <button className="rounded p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white" title="Chamar">
            <Volume2 size={12} />
          </button>
        </div>
      </button>
    </div>
  );
};

export default MemberSidebar;
