import React, { useEffect, useRef, useCallback } from 'react';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import ChannelHeader from './ChannelHeader';
import { fluxerGetMessages, fluxerSendMessage } from '../../services/fluxer/api';

const DiscordChat = ({ channel, onSelectMember }) => {
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
        const data = await fluxerGetMessages(cid, 50);
        if (mountedRef.current) {
          setMessages(Array.isArray(data) ? data : []);
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
          setMessages((prev) => [...prev, created]);
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
    <div className="flex h-full w-full flex-col">
      <ChannelHeader channel={channel} />
      {error && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="min-h-0 flex-1">
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
