export type VoiceState = {
  connected: boolean;
  connecting: boolean;
  guildId: string | null;
  channelId: string | null;
  sessionId: string | null;
  muted: boolean;
  deafened: boolean;
  video: boolean;
  screen: boolean;
  participants: Array<{
    user_id: string;
    name?: string;
    muted: boolean;
    deafened: boolean;
    video: boolean;
    screen: boolean;
    speaking: boolean;
  }>;
  error: string | null;
  liveKitUrl: string | null;
  liveKitToken: string | null;
  liveKitRoom: string | null;
};

const INITIAL_STATE: VoiceState = {
  connected: false,
  connecting: false,
  guildId: null,
  channelId: null,
  sessionId: null,
  muted: false,
  deafened: false,
  video: false,
  screen: false,
  participants: [],
  error: null,
  liveKitUrl: null,
  liveKitToken: null,
  liveKitRoom: null,
};

export class FluxerVoiceService {
  private state: VoiceState = { ...INITIAL_STATE };
  private listeners: Set<(state: VoiceState) => void> = new Set();
  private mediaStream: MediaStream | null = null;
  private localAudioTrack: { stop: () => void } | null = null;

  subscribe(listener: (state: VoiceState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  async join(guildId: string, channelId: string, liveKitInfo: { endpoint: string; token: string; roomName?: string }) {
    this.setState({
      ...this.state,
      connecting: true,
      error: null,
      guildId,
      channelId,
      liveKitUrl: liveKitInfo.endpoint,
      liveKitToken: liveKitInfo.token,
      liveKitRoom: liveKitInfo.roomName || `guild_${guildId}_channel_${channelId}`,
    });

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.setState({
        ...this.state,
        connecting: false,
        connected: true,
        sessionId: `voice-${Date.now()}`,
      });
    } catch (error: any) {
      console.error('[Fluxer Voice] Erro ao acessar microfone:', error);
      this.setState({
        ...this.state,
        connecting: false,
        connected: false,
        error: 'Permissão de microfone negada ou dispositivo indisponível.',
      });
    }
  }

  async leave() {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack = null;
      }
    } catch (error) {
      console.error('[Fluxer Voice] Erro ao limpar mídia:', error);
    }

    this.setState({ ...INITIAL_STATE });
  }

  toggleMute() {
    this.setState({ ...this.state, muted: !this.state.muted });
  }

  toggleDeafen() {
    this.setState({ ...this.state, deafened: !this.state.deafened });
  }

  toggleVideo() {
    this.setState({ ...this.state, video: !this.state.video });
  }

  toggleScreen() {
    this.setState({ ...this.state, screen: !this.state.screen });
  }

  setError(error: string | null) {
    this.setState({ ...this.state, error });
  }

  setParticipants(participants: VoiceState['participants']) {
    this.setState({ ...this.state, participants });
  }

  private setState(partial: Partial<VoiceState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const fluxerVoiceService = new FluxerVoiceService();
