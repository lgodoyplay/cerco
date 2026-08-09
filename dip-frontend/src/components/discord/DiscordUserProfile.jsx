import React from 'react';
import { Sparkles } from 'lucide-react';

const DiscordUserProfile = ({ member }) => {
  if (!member) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
        Clique em um membro para abrir o perfil.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-federal-500 to-violet-600 text-sm font-semibold text-white">
          {member.avatar}
        </div>
        <div>
          <p className="font-semibold text-white">{member.name}</p>
          <p className="text-sm text-slate-400">{member.role}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-400">
        <p>{member.bio}</p>
        <p>ID: {member.id}</p>
        <p>Membro desde: {member.joinedAt}</p>
      </div>
      <button className="mt-4 flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:text-white">
        <Sparkles size={14} />
        Editar perfil
      </button>
    </div>
  );
};

export default DiscordUserProfile;
