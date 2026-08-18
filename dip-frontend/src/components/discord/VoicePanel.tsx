import React from 'react';
import { Mic, Volume2, PhoneOff, Video, Monitor, Sparkles, WifiOff } from 'lucide-react';
import { fluxerVoiceService } from '../../services/fluxer/voice';

const DiscordVoicePanel = ({ channel, guildId }) => {
  const [state, setState] = React.useState(fluxerVoiceService.getState());

  React.useEffect(() => {
    const unsubscribe = fluxerVoiceService.subscribe(setState);
    return unsubscribe;
  }, []);

  if (!channel || !state.connected) {
    return null;
  }

  const toggleMute = () => fluxerVoiceService.toggleMute();
  const toggleDeafen = () => fluxerVoiceService.toggleDeafen();
  const toggleVideo = () => fluxerVoiceService.toggleVideo();
  const toggleScreen = () => fluxerVoiceService.toggleScreen();
  const leave = () => fluxerVoiceService.leave();

  return (
    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200 shadow-lg shadow-emerald-950/20">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles size={16} />
        {channel.name}
      </div>
      <div className="mt-3 space-y-2 text-sm text-emerald-100/90">
        {state.participants.length === 0 ? (
          <div className="flex items-center gap-2">
            <WifiOff size={16} />
            <span>Conectado, aguardando participantes...</span>
          </div>
        ) : (
          state.participants.map((participant) => (
            <div key={participant.user_id} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold text-white ${
                  participant.speaking ? 'border-emerald-300 animate-pulse' : 'border-emerald-400/30'
                }`}
              >
                {participant.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <p className="font-medium">{participant.name || 'Participante'}</p>
                <p className="text-xs text-emerald-100/70">
                  {participant.muted ? 'Mudo' : 'Não mudo'} • {participant.deafened ? 'Surdo' : 'Não surdo'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={toggleMute} className="rounded-full border border-emerald-400/40 px-3 py-2 text-sm transition hover:bg-emerald-400/20">
          {state.muted ? '🔇 Microfone' : '🎙️ Microfone'}
        </button>
        <button onClick={toggleDeafen} className="rounded-full border border-emerald-400/40 px-3 py-2 text-sm transition hover:bg-emerald-400/20">
          {state.deafened ? '🔇 Áudio' : '🔊 Áudio'}
        </button>
        <button onClick={toggleVideo} className="rounded-full border border-emerald-400/40 px-3 py-2 text-sm transition hover:bg-emerald-400/20">
          {state.video ? '📹 Vídeo' : '📹 Vídeo'}
        </button>
        <button onClick={toggleScreen} className="rounded-full border border-emerald-400/40 px-3 py-2 text-sm transition hover:bg-emerald-400/20">
          {state.screen ? '🖥️ Tela' : '🖥️ Tela'}
        </button>
        <button onClick={leave} className="rounded-full border border-emerald-400/40 px-3 py-2 text-sm transition hover:bg-emerald-400/20">
          <span className="flex items-center gap-2"><PhoneOff size={14} />Sair</span>
        </button>
      </div>
      {state.error && (
        <div className="mt-3 text-xs text-red-300">{state.error}</div>
      )}
    </div>
  );
};

export default DiscordVoicePanel;
