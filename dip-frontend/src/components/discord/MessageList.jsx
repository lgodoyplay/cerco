import React, { useState, useRef, useEffect } from 'react';
import { Reply, Trash2, Pin, Copy, Paperclip, MessageCircleMore } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';

const MessageList = ({ messages, onSelectMember }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const groupedMessages = React.useMemo(() => {
    const groups = [];
    let currentGroup = null;

    (messages || []).forEach((message) => {
      const authorId = message?.author?.id || message?.authorId || message?.userId || 'unknown';
      const ts = message?.timestamp || message?.createdAt || new Date().toISOString();

      if (
        currentGroup &&
        currentGroup.author.id === authorId &&
        Math.abs(new Date(ts) - new Date(currentGroup.timestamp)) < 300000
      ) {
        currentGroup.messages.push(message);
      } else {
        currentGroup = {
          author: {
            id: authorId,
            name: message?.author?.name || message?.author?.username || 'Usuário',
            avatar: message?.author?.avatar || null,
            role: message?.author?.role || 'Membro',
          },
          timestamp: ts,
          messages: [message],
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [messages]);

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ptBR });
    } catch {
      return timestamp;
    }
  };

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const showDateSeparator = (currentTimestamp, index) => {
    if (index === 0) return true;
    try {
      const current = new Date(currentTimestamp);
      const prev = new Date(groupedMessages[index - 1].timestamp);
      return current.toDateString() !== prev.toDateString();
    } catch {
      return false;
    }
  };

  const renderAvatar = (author) => {
    const initials = (author?.name || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';

    if (author?.avatar) {
      return (
        <img
          src={author.avatar}
          alt={author.name}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-800/80"
        />
      );
    }

    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-federal-500 to-violet-600 text-xs font-bold text-white ring-2 ring-slate-800/80">
        {initials}
      </div>
    );
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="rounded-full border border-dashed border-slate-700 bg-slate-950/70 p-5 text-slate-500">
          <MessageCircleMore size={40} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Sem mensagens</h3>
          <p className="mt-1 max-w-xs text-sm text-slate-400">
            Seja o primeiro a enviar uma mensagem. Use ENTER para enviar e SHIFT+ENTER para nova linha.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto space-y-1 scroll-smooth">
      {groupedMessages.map((group, groupIndex) => (
        <div key={`group-${groupIndex}`}>
          {showDateSeparator(group.timestamp, groupIndex) && (
            <div className="my-4 flex items-center gap-4 px-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {formatDate(group.timestamp)}
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>
          )}

          <div
            className="group flex gap-3 px-4 py-2 transition-colors hover:bg-slate-900/30"
            onMouseEnter={() => setHoveredId(groupIndex)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="mt-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onSelectMember?.(group.author)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition hover:ring-2 hover:ring-federal-500/60"
                title={group.author.name}
              >
                {renderAvatar(group.author)}
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectMember?.(group.author)}
                  className="text-sm font-semibold text-white transition hover:text-federal-300 hover:underline"
                >
                  {group.author.name}
                </button>
                <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  {group.author.role}
                </span>
                <span className="text-[11px] text-slate-500">{formatTime(group.messages[0]?.timestamp || group.timestamp)}</span>
              </div>

              <div className="space-y-1">
                {group.messages.map((msg, msgIndex) => (
                  <div
                    key={msg.id || `${group.author.id}-${msgIndex}-${msg.timestamp}`}
                    className={cn(
                      'max-w-[85%] rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm leading-6 text-slate-200 shadow-sm shadow-black/10',
                      msgIndex > 0 && 'ml-2 border-slate-700/70 bg-slate-900/60'
                    )}
                  >
                    {msg.content || 'Mensagem vazia'}
                  </div>
                ))}
              </div>

              {group.messages[0]?.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.messages[0].attachments.map((attachment, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-600"
                    >
                      <Paperclip size={12} className="text-slate-500" />
                      <span className="max-w-[220px] truncate">{attachment}</span>
                    </div>
                  ))}
                </div>
              )}

              {group.messages[0]?.reactions?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {group.messages[0].reactions.map((reaction) => (
                    <span
                      key={reaction.emoji}
                      className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300"
                    >
                      {reaction.emoji} <span className="text-slate-500">{reaction.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div
              className={cn(
                'flex items-start gap-1 transition-opacity duration-200',
                hoveredId === groupIndex ? 'opacity-100' : 'opacity-0'
              )}
            >
              <div className="flex rounded-lg border border-slate-800 bg-slate-900/90 backdrop-blur-sm">
                <button className="p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white" title="Responder">
                  <Reply size={14} />
                </button>
                <button className="p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white" title="Copiar">
                  <Copy size={14} />
                </button>
                <button className="p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white" title="Fixar">
                  <Pin size={14} />
                </button>
                <button className="p-1.5 text-rose-400 transition hover:bg-slate-800 hover:text-rose-300" title="Excluir">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
