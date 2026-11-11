import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { normalizeRoleName } from '../../hooks/usePermissions';
import { getAvatarPublicUrl } from '../../lib/avatar';

const ChatMessage = ({ message, isCurrentUser, onDelete }) => {
  const { roles } = useSettings();
  const safeDate = message?.created_at ? new Date(message.created_at) : new Date();
  const formattedTime = isNaN(safeDate.getTime())
    ? ''
    : format(safeDate, 'HH:mm', { locale: ptBR });
  const avatarSrc = getAvatarPublicUrl(message?.user_avatar_url || message?.avatar_url || null)
    || message?.user_avatar_url
    || message?.avatar_url
    || null;
  const roleLabel = message?.user_role || message?.role || null;
  const roleColor = (roles || []).find((role) => normalizeRoleName(role?.title || role?.name) === normalizeRoleName(roleLabel))?.color
    || message?.user_role_color
    || null;
  const canDeleteThisMessage = typeof onDelete === 'function';

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`group relative max-w-[85%] rounded-2xl px-3 py-2.5 shadow-sm ${isCurrentUser ? 'bg-federal-600 text-white' : 'bg-slate-800/90 text-slate-100 border border-slate-700'}`}
        style={roleColor ? { borderColor: roleColor, boxShadow: `0 0 0 1px ${roleColor}33` } : undefined}
      >
        {canDeleteThisMessage && (
          <button
            type="button"
            onClick={() => onDelete(message?.id)}
            className="absolute -top-2 -right-2 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow-md transition hover:bg-red-600 hover:text-white group-hover:flex"
            aria-label="Apagar mensagem"
            title="Apagar mensagem"
          >
            <Trash2 size={14} />
          </button>
        )}

        <div className="flex items-center gap-2 mb-1.5">
          {avatarSrc ? (
            <img src={avatarSrc} alt={message?.user_name || 'Usuário'} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-200">
              {message?.user_name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-semibold truncate">{message?.user_name || 'Usuário'}</p>
              {roleLabel && (
                <span
                  className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${isCurrentUser ? 'text-federal-50' : 'text-slate-200'}`}
                  style={roleColor ? {
                    borderColor: roleColor,
                    backgroundColor: `${roleColor}22`,
                    color: isCurrentUser ? '#fff' : '#f8fafc'
                  } : undefined}
                >
                  {roleLabel}
                </span>
              )}
            </div>
            <p className={`text-[10px] ${isCurrentUser ? 'text-federal-100/80' : 'text-slate-400'}`}>{formattedTime}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message?.content || ''}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
