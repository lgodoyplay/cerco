import React from 'react';

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

const DiscordMemberList = ({ members, selectedMemberId, onSelectMember }) => {
  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Membros</p>
        <h3 className="text-base font-semibold text-white">Online</h3>
      </div>
      <div className="space-y-2">
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelectMember(member.id)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${selectedMemberId === member.id ? 'border-federal-500/40 bg-slate-800' : 'border-slate-800 bg-slate-950/70 hover:border-federal-500/40 hover:bg-slate-800'}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-600 text-sm font-semibold text-white">
                {member.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{member.name}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${statusStyles[member.status]}`} />
                </div>
                <p className="text-xs text-slate-500">{member.role}</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{statusLabels[member.status]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DiscordMemberList;
