import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Reply, Trash2, Pin, Copy, Flag, User, Paperclip, MessageCircleMore } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';

const MessageList = ({ messages, onSelectMember }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const groupedMessages = React.useMemo(() => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((message) => {
      if (
        currentGroup &&
        currentGroup.author.id === message.author.id &&
        Math.abs(new Date(message.timestamp) - new Date(currentGroup.timestamp)) < 300000
      ) {
        currentGroup.messages.push(message);
      } else {
        currentGroup = {
          author: message.author,
          timestamp: message.timestamp,
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

  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
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
    <div className="space-y-1">
      {groupedMessages.map((group, groupIndex) => (
        <div key={`group-${groupIndex}`}>
          {showDateSeparator(group.timestamp, groupIndex) && (
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                {formatDate(group.timestamp)}
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>
          )}

          <div
            className="group flex gap-4 px-4 py-2 transition-colors hover:bg-slate-900/40"
            onMouseEnter={() => setHoveredId(groupIndex)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="mt-0.5 shrink-0">
              <button
                onClick={() => onSelectMember?.(group.author)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-federal-500 to-violet-600 text-sm font-semibold text-white transition hover:ring-2 hover:ring-federal-400/50"
                title={group.author.name}
              >
                {group.author.avatar}
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectMember?.(group.author)}
                  className="truncate text-sm font-semibold text-white transition hover:underline"
                >
                  {group.author.name}
                </button>
                <span className="rounded-full border border-slate-800 bg-slate-800/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-slate-400">
                  {group.author.role}
                </span>
                {groupIndex === 0 && (
                  <span className="text-[11px] text-slate-600">{formatTime(group.timestamp)}</span>
                )}
              </div>

              {group.messages.map((msg, msgIndex) => (
                <div key={msg.id} className={cn('text-sm leading-6 text-slate-300', msgIndex > 0 && 'mt-1')}>
                  {msg.content}
                </div>
              ))}

              {group.messages[0]?.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.messages[0].attachments.map((attachment, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/70 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-700 hover:bg-slate-800"
                    >
                      <Paperclip size={12} className="text-slate-500" />
                      <span className="truncate max-w-[200px]">{attachment}</span>
                    </div>
                  ))}
                </div>
              )}

              {group.messages[0]?.reactions?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {group.messages[0].reactions.map((reaction) => (
                    <span
                      key={reaction.emoji}
                      className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300 transition hover:border-slate-600"
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
                <button className="p-1.5 text-slate-500 transition hover:text-white hover:bg-slate-800" title="Responder">
                  <Reply size={14} />
                </button>
                <button className="p-1.5 text-slate-500 transition hover:text-white hover:bg-slate-800" title="Copiar">
                  <Copy size={14} />
                </button>
                <button className="p-1.5 text-slate-500 transition hover:text-white hover:bg-slate-800" title="Fixar">
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
