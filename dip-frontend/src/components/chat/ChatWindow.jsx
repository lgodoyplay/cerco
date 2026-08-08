import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Minus, MessageCircleMore, CircleDot, LoaderCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { chatService } from './ChatService';

const ChatWindow = ({ user, onClose, minimized, onToggleMinimized, onUnreadChange }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
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
  }, [messages.length]);

  const handleSend = async (content) => {
    if (!content || sending) return;
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
  };

  const handleScroll = (event) => {
    const element = event.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 32;
    autoScrollRef.current = isAtBottom;
    if (isAtBottom) {
      setHasNewMessages(false);
    }
  };

  const messageList = useMemo(() => (Array.isArray(messages) ? messages : []), [messages]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-federal-600/15 p-2 text-federal-400">
            <MessageCircleMore size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Chat Geral</h3>
            <p className="text-[11px] text-slate-400">{onlineCount} online</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
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

      <div className="flex-1 overflow-y-auto px-3 py-3" onScroll={handleScroll}>
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            <LoaderCircle className="mr-2 animate-spin" size={16} />
            Carregando mensagens...
          </div>
        ) : messageList.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
            Ainda não há mensagens. Seja o primeiro a falar.
          </div>
        ) : (
          <div className="space-y-2">
            {messageList.map((message) => (
              <ChatMessage key={message.id} message={message} isCurrentUser={message.isCurrentUser} />
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
