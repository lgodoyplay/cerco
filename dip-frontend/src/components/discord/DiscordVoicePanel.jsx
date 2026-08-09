import React from 'react';
import { Mic, Volume2, PhoneOff, Sparkles } from 'lucide-react';

const DiscordVoicePanel = ({ channel, isInVoiceChannel, isMuted, isDeafened, isSpeaking, onToggleMute, onToggleAudio, onLeaveVoice }) => {
  if (!channel || !isInVoiceChannel) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200 shadow-lg shadow-emerald-950/20">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles size={16} />
        {channel.name}
      </div>
      <div className="mt-3 space-y-2 text-sm text-emerald-100/90">
        <div className="flex items-center justify-between">
          <span>Você está conectado</span>
          <span className="rounded-full border border-emerald-400/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em]">Mock</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${isSpeaking ? 'border-emerald-300 animate-pulse' : 'border-emerald-400/30'}`}>
            <Mic size={16} />
          </div>
          <div className="flex-1">
            <p className="font-medium">Alan Godoy</p>
            <p className="text-xs text-emerald-100/70">Estado visual apenas</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={onToggleMute} className="rounded-full border border-emerald-400/40 px-3 py-2 text-sm transition hover:bg-emerald-400/20">
          {isMuted ? '🔇 Mudo' : '🎙️ Microfone'}
        </button>
        <button onClick={onToggleAudio} className="rounded-full border border-emerald-400/40 px-3 py-2 text-sm transition hover:bg-emerald-400/20">
          {isDeafened ? '🔇 Áudio' : '🔊 Áudio'}
        </button>
        <button onClick={onLeaveVoice} className="rounded-full border border-emerald-400/40 px-3 py-2 text-sm transition hover:bg-emerald-400/20">
          <span className="flex items-center gap-2"><PhoneOff size={14} />Sair</span>
        </button>
      </div>
    </div>
  );
};

export default DiscordVoicePanel;
