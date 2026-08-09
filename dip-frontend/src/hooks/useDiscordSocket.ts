import { useEffect, useMemo, useState } from 'react';
import { discordSocket } from '../services/discord/discordSocket';

export const useDiscordSocket = () => {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting' | 'disconnected'>('connecting');
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    const listener = (event: any) => {
      if (event?.type === 'connected') {
        setConnectionState('connected');
      } else if (event?.type === 'disconnected') {
        setConnectionState('disconnected');
      } else {
        setLastEvent(event);
      }
    };

    discordSocket.on(listener);
    discordSocket.connect();

    return () => {
      discordSocket.off(listener);
    };
  }, []);

  return useMemo(() => ({ connectionState, lastEvent }), [connectionState, lastEvent]);
};
