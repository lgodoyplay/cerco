import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircleMore } from 'lucide-react';

const ChatMessage = ({ message, isCurrentUser }) => {
  const safeDate = message?.created_at ? new Date(message.created_at) : new Date();
  const formattedTime = isNaN(safeDate.getTime())
    ? ''
    : format(safeDate, 'HH:mm', { locale: ptBR });

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 shadow-sm ${isCurrentUser ? 'bg-federal-600 text-white' : 'bg-slate-800/90 text-slate-100 border border-slate-700'}`}>
        <div className="flex items-center gap-2 mb-1.5">
          {message?.user_avatar_url ? (
            <img src={message.user_avatar_url} alt={message?.user_name || 'Usuário'} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-200">
              {message?.user_name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold truncate">{message?.user_name || 'Usuário'}</p>
            <p className={`text-[10px] ${isCurrentUser ? 'text-federal-100/80' : 'text-slate-400'}`}>{formattedTime}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message?.content || ''}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
