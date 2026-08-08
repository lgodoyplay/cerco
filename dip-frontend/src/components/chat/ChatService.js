import { supabase } from '../../lib/supabase';

const CHAT_TABLE = 'global_chat_messages';

const isMissingTableError = (error) => {
  const code = error?.code || '';
  const message = String(error?.message || '').toLowerCase();

  return code === '42P01' || code === 'PGRST205' || message.includes('does not exist') || message.includes('relation') || message.includes('not found');
};

const normalizeMessage = (message, currentUser) => {
  const senderId = message?.user_id || message?.userId;
  const senderName = message?.user_name || message?.userName || message?.sender_name || 'Usuário';
  const avatarUrl = message?.user_avatar_url || message?.avatar_url || null;

  return {
    id: message?.id,
    user_id: senderId,
    content: message?.content || '',
    created_at: message?.created_at || new Date().toISOString(),
    user_name: senderName,
    user_avatar_url: avatarUrl,
    user_role: message?.user_role || null,
    isCurrentUser: senderId === currentUser?.id,
  };
};

export const chatService = {
  async fetchMessages(currentUser) {
    try {
      const { data, error } = await supabase
        .from(CHAT_TABLE)
        .select('*')
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) {
        if (isMissingTableError(error)) {
          console.info('Chat: tabela ainda não existe no banco; aguardando criação.');
          return [];
        }
        console.warn('Chat: erro ao buscar mensagens', error);
        return [];
      }

      return (data || []).map((message) => normalizeMessage(message, currentUser));
    } catch (error) {
      console.warn('Chat: exceção ao buscar mensagens', error);
      return [];
    }
  },

  async sendMessage(content, currentUser) {
    if (!currentUser?.id) return null;
    const safeContent = String(content || '').trim();
    if (!safeContent) return null;

    try {
      const payload = {
        user_id: currentUser.id,
        content: safeContent.slice(0, 1000),
        user_name: currentUser.full_name || currentUser.username || currentUser.email || 'Usuário',
        user_avatar_url: currentUser.avatar_url || null,
        user_role: currentUser.role || null,
      };

      const { data, error } = await supabase
        .from(CHAT_TABLE)
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          console.info('Chat: tabela ainda não existe no banco; não foi possível enviar a mensagem.');
          return null;
        }
        console.warn('Chat: erro ao enviar mensagem', error);
        return null;
      }

      return normalizeMessage(data, currentUser);
    } catch (error) {
      console.warn('Chat: exceção ao enviar mensagem', error);
      return null;
    }
  },

  subscribeToMessages(currentUser, onMessage) {
    const channel = supabase.channel(`global-chat-${currentUser?.id || 'anonymous'}`);

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: CHAT_TABLE },
        (payload) => {
          const message = normalizeMessage(payload.new, currentUser);
          onMessage(message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async subscribeToPresence(currentUser, onPresenceChange) {
    if (!currentUser?.id) return () => {};

    const channel = supabase.channel(`global-chat-presence-${currentUser.id}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      onPresenceChange(count);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: currentUser.id,
          user_name: currentUser.full_name || currentUser.username || currentUser.email || 'Usuário',
          avatar_url: currentUser.avatar_url || null,
        });
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  },
};
