import { useEffect, useState } from 'react';
import { getMessages, sendMessage } from '../services/discord/discordService';
import type { DiscordMessage } from '../services/discord/discordTypes';

export const useDiscordMessages = (channelId?: string) => {
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const data = await getMessages(channelId);
        if (isMounted) {
          setMessages(data);
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
  }, [channelId]);

  const addMessage = async (content: string) => {
    if (!channelId || !content.trim()) {
      return;
    }

    const created = await sendMessage(channelId, content.trim());
    setMessages((prev) => [...prev, created]);
  };

  return { messages, loading, addMessage };
};
