import { useEffect, useState } from 'react';
import { getServers } from '../services/discord/discordService';
import type { DiscordServer } from '../services/discord/discordTypes';

export const useDiscordServers = () => {
  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await getServers();
        if (isMounted) {
          setServers(data);
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
  }, []);

  return { servers, loading };
};
