import { useEffect, useRef, useCallback, useState } from 'react';

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'joining' | 'joined' | 'left' | 'error';

export interface Participant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isMuted?: boolean;
  isVideoMuted?: boolean;
}

export interface JitsiCallState {
  status: CallStatus;
  roomName: string;
  domain: string;
  type: CallType;
  participants: Participant[];
  error: string | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
}

export interface UseJitsiCallOptions {
  user: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  conversationId?: string;
  type?: CallType;
  onEnded?: () => void;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (participantId: string) => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

const JITSI_SCRIPT_URL = 'https://meet.jit.si/external_api.js';

const loadJitsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      return reject(new Error('Document is not available'));
    }

    if (window.JitsiMeetExternalAPI) {
      return resolve();
    }

    const existing = document.querySelector('script[src="https://meet.jit.si/external_api.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar Jitsi Meet API.')));
      return;
    }

    const script = document.createElement('script');
    script.src = JITSI_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar Jitsi Meet API.'));
    document.body.appendChild(script);
  });
};

export const useJitsiCall = (options: UseJitsiCallOptions) => {
  const { user, conversationId, type = 'voice', onEnded, onParticipantJoined, onParticipantLeft } = options;

  const [state, setState] = useState<JitsiCallState>({
    status: 'idle',
    roomName: '',
    domain: 'meet.jit.si',
    type,
    participants: [],
    error: null,
    isAudioMuted: false,
    isVideoMuted: true,
    isScreenSharing: false,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);
  const listenersAttached = useRef(false);

  const cleanup = useCallback(() => {
    if (apiRef.current) {
      try {
        apiRef.current.dispose();
      } catch {
        // ignore cleanup errors
      }
      apiRef.current = null;
    }
    listenersAttached.current = false;
    setState((prev) => ({
      ...prev,
      status: 'idle',
      participants: [],
      error: null,
      isAudioMuted: false,
      isVideoMuted: true,
      isScreenSharing: false,
    }));
  }, []);

  const join = useCallback(
    async (roomName: string, domain = 'meet.jit.si', callType: CallType = 'voice') => {
      if (!roomName || !containerRef.current) return;

      cleanup();
      setState((prev) => ({
        ...prev,
        status: 'joining',
        roomName,
        domain,
        type: callType,
        error: null,
      }));

      try {
        await loadJitsiScript();

        const avatarUrl =
          user?.avatar_url && user.avatar_url.startsWith('http')
            ? user.avatar_url
            : undefined;

        const options = {
          roomName,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: {
            displayName: user?.full_name || user?.email || 'Usuário',
            email: user?.email || undefined,
            avatarUrl,
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: callType === 'voice',
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
            enableNoAudioDetection: true,
            enableNoisyMicDetection: true,
            enableLobby: false,
            requireDisplayName: true,
            startAudioOnly: callType === 'voice',
            fileRecordingsEnabled: false,
            liveStreamingEnabled: false,
            disableThirdPartyRequests: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: callType === 'voice'
              ? ['microphone', 'hangup', 'tileview', 'settings', 'raisehand', 'fullscreen', 'videoquality']
              : ['microphone', 'camera', 'hangup', 'tileview', 'settings', 'raisehand', 'fullscreen', 'videoquality', 'desktop'],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            MOBILE_APP_PROMO: false,
            DEFAULT_BACKGROUND: '#0f172a',
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            filmStripOnly: false,
            appName: 'CERCO',
          },
        };

        if (window.JitsiMeetExternalAPI) {
          apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

          apiRef.current.addListener('videoConferenceJoined', (event: any) => {
            setState((prev) => ({ ...prev, status: 'joined', isVideoMuted: callType === 'voice' }));
          });

          apiRef.current.addListener('videoConferenceLeft', () => {
            cleanup();
            onEnded?.();
          });

          apiRef.current.addListener('readyToClose', () => {
            cleanup();
            onEnded?.();
          });

          apiRef.current.addListener('participantJoined', (event: any) => {
            const participant: Participant = {
              id: event.id,
              displayName: event.displayName || event.nick || 'Participante',
              avatarUrl: event.avatarURL,
            };
            setState((prev) => ({
              ...prev,
              participants: prev.participants.some((p) => p.id === participant.id)
                ? prev.participants
                : [...prev.participants, participant],
            }));
            onParticipantJoined?.(participant);
          });

          apiRef.current.addListener('participantLeft', (event: any) => {
            const participantId = event.id;
            setState((prev) => ({
              ...prev,
              participants: prev.participants.filter((p) => p.id !== participantId),
            }));
            onParticipantLeft?.(participantId);
          });

          apiRef.current.addListener('audioMuteStatusChanged', (event: any) => {
            setState((prev) => ({ ...prev, isAudioMuted: event.muted }));
          });

          apiRef.current.addListener('videoMuteStatusChanged', (event: any) => {
            setState((prev) => ({ ...prev, isVideoMuted: event.muted }));
          });

          apiRef.current.addListener('screenSharingStatusChanged', (event: any) => {
            setState((prev) => ({ ...prev, isScreenSharing: event.on }));
          });

          apiRef.current.addListener('errorOccurred', (event: any) => {
            setState((prev) => ({ ...prev, error: event.message || 'Erro na chamada.' }));
          });
        }
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: error?.message || 'Não foi possível iniciar a chamada.',
        }));
      }
    },
    [cleanup, onEnded, onParticipantJoined, onParticipantLeft, user]
  );

  const leave = useCallback(() => {
    if (apiRef.current) {
      try {
        apiRef.current.executeCommand('hangup');
      } catch {
        // ignore
      }
    }
    cleanup();
    onEnded?.();
  }, [cleanup, onEnded]);

  const toggleAudio = useCallback(async () => {
    if (!apiRef.current) return;
    try {
      const muted = await apiRef.current.isAudioMuted();
      await apiRef.current.executeCommand('toggleAudio');
      setState((prev) => ({ ...prev, isAudioMuted: !muted }));
    } catch {
      // ignore
    }
  }, []);

  const toggleVideo = useCallback(async () => {
    if (!apiRef.current) return;
    try {
      const videoMuted = await apiRef.current.isVideoMuted();
      await apiRef.current.executeCommand('toggleVideo');
      setState((prev) => ({ ...prev, isVideoMuted: !videoMuted }));
    } catch {
      // ignore
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!apiRef.current) return;
    try {
      await apiRef.current.executeCommand('toggleScreenShare');
    } catch {
      // ignore
    }
  }, []);

  const retry = useCallback(async () => {
    if (state.roomName && conversationId) {
      await join(state.roomName, state.domain, state.type);
    }
  }, [state.roomName, state.domain, state.type, conversationId, join]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    containerRef,
    join,
    leave,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    retry,
    cleanup,
  };
};
