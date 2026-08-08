import React, { useEffect, useState } from 'react';
import { MessageCircleMore } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';

const FloatingChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const canUseChat = Boolean(user?.id);

  useEffect(() => {
    if (!isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const handleToggleMinimized = () => {
    setIsMinimized((prev) => !prev);
  };

  if (!canUseChat) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      {isOpen && !isMinimized ? (
        <div className="w-[92vw] max-w-[420px] h-[70vh] max-h-[620px] min-h-[420px]">
          <ChatWindow
            user={user}
            onClose={handleClose}
            minimized={isMinimized}
            onToggleMinimized={handleToggleMinimized}
            onUnreadChange={setUnreadCount}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggleChat}
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900/95 text-white shadow-2xl shadow-black/40 transition hover:scale-105 hover:bg-slate-800"
        aria-label="Abrir chat geral"
      >
        <MessageCircleMore size={24} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingChat;
