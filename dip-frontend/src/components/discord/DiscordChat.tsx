import React, { useEffect, useRef, useCallback } from 'react';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import ChannelHeader from './ChannelHeader';
import { fluxerGetMessages, fluxerSendMessage } from '../../services/fluxer/api';

const DiscordChat = ({ channel, onSelectMember, onStartVoiceCall, onStartVideoCall }) => {
  const [messages, setMessages] = React.useState([]);
  const [messagesLoading, setMessagesLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [draft, setDraft] = React.useState('');
  const channelIdRef = useRef(channel?.id);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      const cid = channel?.id;
      channelIdRef.current = cid;
      if (!cid) {
        setMessages([]);
        setMessagesLoading(false);
        return;
      }

      setMessagesLoading(true);
      setError(null);

      try {
        const data = await fluxerGetMessages(cid, 100);
        const normalized = Array.isArray(data)
          ? [...data]
              .filter((message) => message && (message.id || message.content || message.author))
              .sort((a, b) => new Date(a.timestamp || a.createdAt || 0).getTime() - new Date(b.timestamp || b.createdAt || 0).getTime())
          : [];

        if (mountedRef.current) {
          setMessages(normalized);
        }
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err?.message || 'Falha ao carregar mensagens.');
          setMessages([]);
        }
      } finally {
        if (mountedRef.current) {
          setMessagesLoading(false);
        }
      }
    };

    loadMessages();
  }, [channel?.id]);

  const handleSend = useCallback(
    async (content) => {
      const cid = channelIdRef.current;
      if (!cid || !content.trim()) return;

      setSending(true);
      setError(null);

      try {
        const created = await fluxerSendMessage(cid, content.trim());
        if (mountedRef.current) {
          setMessages((prev) => {
            const merged = [...prev, created].filter(Boolean);
            return merged.sort((a, b) => new Date(a.timestamp || a.createdAt || 0).getTime() - new Date(b.timestamp || b.createdAt || 0).getTime());
          });
          setDraft('');
        }
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err?.message || 'Falha ao enviar mensagem.');
        }
      } finally {
        if (mountedRef.current) {
          setSending(false);
        }
      }
    },
    []
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <ChannelHeader channel={channel} onStartVoiceCall={onStartVoiceCall} onStartVideoCall={onStartVideoCall} />
      {error && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageList messages={messages} loading={messagesLoading} onSelectMember={onSelectMember} />
      </div>
      <MessageComposer
        draft={draft}
        onDraftChange={setDraft}
        channelType={channel?.type || 'text'}
        channelName={channel?.name || ''}
        onSend={handleSend}
        disabled={sending || (channel?.type !== 'text')}
      />
    </div>
  );
};

export default DiscordChat;
