import React from 'react';
import { Mic, Volume2, PhoneOff } from 'lucide-react';

const DiscordVoiceMiniPlayer = ({ channel, isInVoiceChannel, isMuted, isDeafened, onToggleMute, onToggleAudio, onLeaveVoice }) => {
  if (!channel || !isInVoiceChannel) {
    return null;
  }

  return (
    <div className="border-t border-slate-800 bg-slate-900/90 px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        <div>
          <p className="font-semibold">🔊 {channel.name}</p>
          <p className="text-xs text-emerald-100/70">Conectado • estado visual ativo</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleMute} className="rounded-full border border-emerald-400/40 p-2 transition hover:bg-emerald-400/20">
            <Mic size={15} />
          </button>
          <button onClick={onToggleAudio} className="rounded-full border border-emerald-400/40 p-2 transition hover:bg-emerald-400/20">
            <Volume2 size={15} />
          </button>
          <button onClick={onLeaveVoice} className="rounded-full border border-emerald-400/40 p-2 transition hover:bg-emerald-400/20">
            <PhoneOff size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscordVoiceMiniPlayer;
