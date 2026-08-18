import React, { useEffect } from 'react';
import { useJitsiCall } from '../../hooks/useJitsiCall';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Users, Minimize2, Maximize2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: any[]) => twMerge(clsx(inputs));

type JitsiCallProps = {
  conversationId: string;
  user: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  type?: 'voice' | 'video';
  roomName?: string;
  domain?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
  onEnded?: () => void;
  onParticipantJoined?: (participant: { id: string; displayName: string }) => void;
  onParticipantLeft?: (participantId: string) => void;
  className?: string;
};

const JitsiCall: React.FC<JitsiCallProps> = ({
  conversationId,
  user,
  type = 'voice',
  roomName: propRoomName,
  domain: propDomain,
  isMinimized = false,
  onToggleMinimize,
  onClose,
  onEnded,
  onParticipantJoined,
  onParticipantLeft,
  className,
}) => {
  const { state, containerRef, join, leave, toggleAudio, toggleVideo, toggleScreenShare, retry } = useJitsiCall({
    user,
    conversationId,
    type,
    onEnded,
    onParticipantJoined,
    onParticipantLeft,
  });

  useEffect(() => {
    if (conversationId && state.status === 'idle') {
      const room = propRoomName || `cerco-${type}-${conversationId}`;
      const domain = propDomain || 'meet.jit.si';
      join(room, domain, type);
    }
  }, [conversationId, type, join, state.status, propRoomName, propDomain]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.status === 'joined' || state.status === 'joining') {
        leave();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.status, leave]);

  return (
    <div
      className={cn(
        'flex flex-col bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300',
        isMinimized ? 'rounded-lg fixed bottom-20 right-4 w-72 h-48 z-[60]' : 'fixed inset-0 z-[60] md:inset-4 md:rounded-xl md:border md:shadow-2xl',
        className
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-10 bg-slate-950/90 backdrop-blur flex items-center justify-between px-3 z-10 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {isMinimized ? 'Chamada ativa' : `Chamada ${type === 'video' ? 'de vídeo' : 'de voz'}`}
        </div>
        <div className="flex items-center gap-1">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title={isMinimized ? 'Maximizar' : 'Minimizar'}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          )}
          {!isMinimized && (
            <button
              onClick={() => {
                leave();
                onClose?.();
              }}
              className="p-1.5 hover:bg-red-900/50 rounded text-red-400 hover:text-red-200"
              title="Sair"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative min-h-0">
        {state.status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-20">
            <div className="text-center p-6">
              <p className="text-red-400 font-bold mb-2">Não foi possível iniciar a chamada</p>
              <p className="text-slate-400 text-sm mb-4">{state.error}</p>
              <button
                onClick={retry}
                className="px-4 py-2 bg-federal-600 hover:bg-federal-500 text-white rounded-lg text-sm font-bold"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full bg-black" />
      </div>

      {!isMinimized && (
        <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className={cn(
                'p-3 rounded-full transition-colors',
                state.isAudioMuted ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              )}
              title={state.isAudioMuted ? 'Ativar microfone' : 'Desativar microfone'}
            >
              {state.isAudioMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={toggleVideo}
              className={cn(
                'p-3 rounded-full transition-colors',
                state.isVideoMuted ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              )}
              title={state.isVideoMuted ? 'Ativar câmera' : 'Desativar câmera'}
            >
              {state.isVideoMuted ? <VideoOff size={18} /> : <Video size={18} />}
            </button>
            {type === 'video' && (
              <button
                onClick={toggleScreenShare}
                className={cn(
                  'p-3 rounded-full transition-colors',
                  state.isScreenSharing ? 'bg-federal-600 hover:bg-federal-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                )}
                title="Compartilhar tela"
              >
                <MonitorUp size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Users size={14} />
              <span>{state.participants.length + 1}</span>
            </div>
            <button
              onClick={() => {
                leave();
                onClose?.();
              }}
              className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors"
              title="Sair da chamada"
            >
              <PhoneOff size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JitsiCall;
