import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Minus, MessageCircleMore, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { chatService } from './ChatService';
import { getAvatarPublicUrl } from '../../lib/avatar';

const createUniqueId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const makeConversationItem = (id, name, avatarUrl, muted = false) => ({
  id,
  name,
  avatarUrl,
  muted,
  isGroup: false,
});

const ChatWindow = ({ user, onClose, minimized, onToggleMinimized, onUnreadChange }) => {
  const [messages, setMessages] = useState([]);
  const [groupMessages, setGroupMessages] = useState({});
  const normalizedUserAvatar = getAvatarPublicUrl(user?.avatar_url || user?.avatar || null) || user?.avatar_url || user?.avatar || null;
  const [conversations, setConversations] = useState([
    makeConversationItem('general', 'Chat Geral', normalizedUserAvatar, false),
  ]);
  const [selectedConversationId, setSelectedConversationId] = useState('general');
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const bottomRef = useRef(null);
  const autoScrollRef = useRef(true);

  const notifyUnread = (value) => {
    if (typeof onUnreadChange === 'function') {
      onUnreadChange(value);
    }
  };

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleToggleMinimized = () => {
    if (typeof onToggleMinimized === 'function') {
      onToggleMinimized();
    }
  };

  useEffect(() => {
    const nextAvatar = getAvatarPublicUrl(user?.avatar_url || user?.avatar || null) || user?.avatar_url || user?.avatar || null;
    setConversations((prev) => {
      const next = [...prev];
      const generalIndex = next.findIndex((conv) => conv.id === 'general');
      if (generalIndex >= 0) {
        next[generalIndex] = { ...next[generalIndex], avatarUrl: nextAvatar };
      }
      return next;
    });
  }, [user?.avatar_url, user?.avatar]);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      const initialMessages = await chatService.fetchMessages(user);
      setMessages(initialMessages);
      setLoading(false);
    };

    loadMessages();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const unsubscribeMessages = chatService.subscribeToMessages(user, (message) => {
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });

      if (!autoScrollRef.current) {
        setHasNewMessages(true);
        notifyUnread((prev) => prev + 1);
      } else {
        setHasNewMessages(false);
        notifyUnread(0);
      }
    });

    const unsubscribePresence = chatService.subscribeToPresence(user, (count) => {
      setOnlineCount(count);
    });

    return () => {
      if (typeof unsubscribeMessages === 'function') {
        unsubscribeMessages();
      }
      if (typeof unsubscribePresence === 'function') {
        unsubscribePresence();
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (autoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, groupMessages, selectedConversationId]);

  const activeMessages = useMemo(() => {
    if (selectedConversationId === 'general') {
      return Array.isArray(messages) ? messages : [];
    }
    return Array.isArray(groupMessages[selectedConversationId]) ? groupMessages[selectedConversationId] : [];
  }, [messages, groupMessages, selectedConversationId]);

  const handleSend = async (content) => {
    if (!content || sending) return;

    if (selectedConversationId === 'general') {
      setSending(true);
      const sentMessage = await chatService.sendMessage(content, user);
      setSending(false);

      if (sentMessage) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === sentMessage.id)) return prev;
          return [...prev, sentMessage];
        });
        autoScrollRef.current = true;
        setHasNewMessages(false);
        notifyUnread(0);
      }
      return;
    }

    const newMessage = {
      id: createUniqueId(),
      user_id: user.id,
      user_name: user.full_name || user.username || user.email || 'Você',
      user_avatar_url: user.avatar_url || null,
      content,
      created_at: new Date().toISOString(),
      isCurrentUser: true,
    };

    setGroupMessages((prev) => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), newMessage],
    }));
    autoScrollRef.current = true;
    setHasNewMessages(false);
    notifyUnread(0);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return;

    if (selectedConversationId === 'general') {
      const ok = await chatService.deleteMessage(messageId, user);
      if (ok) {
        setMessages((prev) => prev.filter((message) => message.id !== messageId));
      }
      return;
    }

    setGroupMessages((prev) => ({
      ...prev,
      [selectedConversationId]: (prev[selectedConversationId] || []).filter((m) => m.id !== messageId),
    }));
  };

  const handleScroll = (event) => {
    const element = event.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 32;
    autoScrollRef.current = isAtBottom;
    if (isAtBottom) {
      setHasNewMessages(false);
      notifyUnread(0);
    }
  };

  const handleCreateGroup = () => {
    const name = groupName.trim();
    if (!name) return;

    const id = createUniqueId();
    const groupAvatar = getAvatarPublicUrl(user?.avatar_url || user?.avatar || null) || user?.avatar_url || user?.avatar || null;
    const newConversation = makeConversationItem(id, name, groupAvatar, false);
    newConversation.isGroup = true;

    setConversations((prev) => [
      ...prev,
      newConversation,
    ]);
    setGroupMessages((prev) => ({
      ...prev,
      [id]: [],
    }));
    setSelectedConversationId(id);
    setShowCreateGroup(false);
    setGroupName('');
  };

  const currentConversation = conversations.find((conversation) => conversation.id === selectedConversationId) || conversations[0];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-federal-600/15 p-2 text-federal-400">
            <MessageCircleMore size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{currentConversation?.name || 'Chat Geral'}</h3>
            <p className="text-[11px] text-slate-400">{onlineCount} online</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowCreateGroup((prev) => !prev)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Criar grupo"
            title="Criar grupo"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={handleToggleMinimized}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Minimizar chat"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Fechar chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {showCreateGroup && (
        <div className="border-b border-slate-800 bg-slate-950/70 p-3">
          <div className="flex gap-2">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nome do grupo"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-federal-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCreateGroup}
              className="rounded-xl bg-federal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-federal-500"
            >
              Criar
            </button>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-800 bg-slate-950/60">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => setSelectedConversationId(conversation.id)}
            className={`flex flex-1 items-center gap-2 border-r border-slate-800 px-2 py-2 text-left text-xs transition ${selectedConversationId === conversation.id ? 'bg-federal-600/15 text-white' : 'text-slate-300 hover:bg-slate-800/70'}`}
          >
            {conversation.avatarUrl ? (
              <img src={conversation.avatarUrl} alt={conversation.name} className="h-7 w-7 rounded-full object-cover border border-slate-700" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-200">
                {conversation.name?.slice(0, 2).toUpperCase() || 'G'}
              </div>
            )}
            <span className="truncate">{conversation.name}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3" onScroll={handleScroll}>
        {loading && selectedConversationId === 'general' ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            <LoaderCircle className="mr-2 animate-spin" size={16} />
            Carregando mensagens...
          </div>
        ) : activeMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
            Ainda não há mensagens. Seja o primeiro a falar.
          </div>
        ) : (
          <div className="space-y-2">
            {activeMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.isCurrentUser || message.user_id === user?.id}
                onDelete={message.user_id === user?.id ? handleDeleteMessage : undefined}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {hasNewMessages && !autoScrollRef.current && (
        <div className="mx-3 mb-2 rounded-full border border-federal-500/30 bg-federal-600/10 px-3 py-1.5 text-center text-[11px] font-medium text-federal-300">
          Novas mensagens abaixo
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  );
};

export default ChatWindow;
