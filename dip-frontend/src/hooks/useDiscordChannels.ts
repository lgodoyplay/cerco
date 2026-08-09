import { useEffect, useState } from 'react';
import { getChannels } from '../services/discord/discordService';
import type { DiscordChannel } from '../services/discord/discordTypes';

export const useDiscordChannels = (serverId?: string) => {
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      setChannels([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const data = await getChannels(serverId);
        if (isMounted) {
          setChannels(data);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [serverId]);

  return { channels, loading };
};
