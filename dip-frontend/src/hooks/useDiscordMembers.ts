import { useEffect, useState } from 'react';
import { getMembers } from '../services/discord/discordService';
import type { DiscordMember } from '../services/discord/discordTypes';

export const useDiscordMembers = (serverId?: string) => {
  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const data = await getMembers(serverId);
        if (isMounted) {
          setMembers(data);
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

  return { members, loading };
};
