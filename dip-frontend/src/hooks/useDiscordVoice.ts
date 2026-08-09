import { useState } from 'react';

export const useDiscordVoice = () => {
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>('voice-geral');
  const [isConnected, setIsConnected] = useState(true);
  const [isMockMode] = useState(true);

  const connectToVoice = (channelId: string) => {
    setActiveVoiceChannelId(channelId);
    setIsConnected(true);
  };

  const disconnect = () => {
    setActiveVoiceChannelId(null);
    setIsConnected(false);
  };

  return { activeVoiceChannelId, isConnected, isMockMode, connectToVoice, disconnect };
};
