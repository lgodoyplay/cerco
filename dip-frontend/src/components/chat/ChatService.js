import { supabase } from '../../lib/supabase';
import { getAvatarPublicUrl } from '../../lib/avatar';

const CHAT_TABLE = 'global_chat_messages';

const isMissingTableError = (error) => {
  const code = error?.code || '';
  const message = String(error?.message || '').toLowerCase();

  return code === '42P01' || code === 'PGRST205' || message.includes('does not exist') || message.includes('relation') || message.includes('not found');
};

const getProfileAvatar = (userId, profileMap, fallback) => {
  const profile = userId ? profileMap?.[userId] : null;
  const rawAvatarUrl = profile?.avatar_url || fallback || null;
  return getAvatarPublicUrl(rawAvatarUrl) || rawAvatarUrl || null;
};

const normalizeMessage = (message, currentUser, profileMap = {}) => {
  const senderId = message?.user_id || message?.userId;
  const senderName = profileMap?.[senderId]?.full_name
    || message?.user_name
    || message?.userName
    || message?.sender_name
    || 'Usuário';
  const rawAvatarUrl = message?.user_avatar_url || message?.avatar_url || null;
  const avatarUrl = getProfileAvatar(senderId, profileMap, rawAvatarUrl);

  return {
    id: message?.id,
    user_id: senderId,
    content: message?.content || '',
    created_at: message?.created_at || new Date().toISOString(),
    user_name: senderName,
    user_avatar_url: avatarUrl,
    user_role: message?.user_role || null,
    user_role_color: message?.user_role_color || message?.role_color || null,
    isCurrentUser: senderId === currentUser?.id,
  };
};

export const isAdminDeleteCandidate = (currentUser, canDeleteAnyMessage = false) => {
  if (canDeleteAnyMessage) return true;

  const roleName = String(currentUser?.role || currentUser?.user_role || '').toLowerCase();
  if (roleName.includes('admin')) return true;

  const permissionValues = [];
  const permissionSource = currentUser?.permissions ?? currentUser?.raw_user_meta_data?.permissions ?? [];

  if (Array.isArray(permissionSource)) {
    permissionValues.push(...permissionSource.map((item) => String(item || '').toLowerCase()));
  } else if (permissionSource) {
    permissionValues.push(String(permissionSource).toLowerCase());
  }

  return permissionValues.some((permission) => permission.includes('admin_access') || permission.includes('admin'));
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

      const safeData = Array.isArray(data) ? data : [];
      const senderIds = [...new Set(safeData.map((message) => message?.user_id).filter(Boolean))];
      let profileMap = {};

      if (senderIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);

        if (!profilesError && Array.isArray(profilesData)) {
          profileMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {});
        }
      }

      return safeData.map((message) => normalizeMessage(message, currentUser, profileMap));
    } catch (error) {
      console.warn('Chat: exceção ao buscar mensagens', error);
      return [];
    }
  },

  async sendMessage(content, currentUser, userRoleColor = null) {
    if (!currentUser?.id) return null;
    const safeContent = String(content || '').trim();
    if (!safeContent) return null;

    try {
      const normalizedAvatar = getAvatarPublicUrl(currentUser.avatar_url || currentUser.avatar || null)
        || currentUser.avatar_url
        || currentUser.avatar
        || null;

      const payload = {
        user_id: currentUser.id,
        content: safeContent.slice(0, 1000),
        user_name: currentUser.full_name || currentUser.username || currentUser.email || 'Usuário',
        user_avatar_url: normalizedAvatar,
        user_role: currentUser.role || null,
        user_role_color: userRoleColor || null,
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

  async deleteMessage(messageId, currentUser, canDeleteAnyMessage = false) {
    if (!messageId) return false;

    const canDeleteThisMessage = canDeleteAnyMessage || isAdminDeleteCandidate(currentUser, false);

    try {
      let query = supabase.from(CHAT_TABLE).delete().eq('id', messageId);

      if (!canDeleteThisMessage) {
        query = query.eq('user_id', currentUser?.id || '');
      }

      const { error } = await query;

      if (error) {
        if (isMissingTableError(error)) {
          console.info('Chat: tabela ainda não existe no banco; não foi possível excluir a mensagem.');
          return false;
        }
        console.warn('Chat: erro ao apagar mensagem', error);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Chat: exceção ao apagar mensagem', error);
      return false;
    }
  },

  subscribeToMessages(currentUser, onMessage) {
    const channel = supabase.channel(`global-chat-${currentUser?.id || 'anonymous'}`);

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: CHAT_TABLE },
        async (payload) => {
          if (typeof onMessage !== 'function') return;

          let profileMap = {};
          const senderId = payload?.new?.user_id;
          if (senderId) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', senderId)
              .single();

            if (profilesData) {
              profileMap[profilesData.id] = profilesData;
            }
          }

          const message = normalizeMessage(payload.new, currentUser, profileMap);
          onMessage({ type: 'insert', message });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: CHAT_TABLE },
        (payload) => {
          if (typeof onMessage !== 'function') return;
          onMessage({ type: 'delete', messageId: payload?.old?.id });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToPresence(currentUser, onPresenceChange) {
    if (!currentUser?.id) return () => {};

    const channel = supabase.channel(`global-chat-presence-${currentUser.id}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      if (typeof onPresenceChange !== 'function') return;
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
