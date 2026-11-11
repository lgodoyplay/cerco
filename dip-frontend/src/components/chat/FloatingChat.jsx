import React, { useEffect, useState } from 'react';
import { MessageCircleMore } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';

class ChatRuntimeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Chat: erro de runtime capturado', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

const FloatingChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const canUseChat = Boolean(user?.id);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleToggleMinimized = () => {
    setIsMinimized((prev) => !prev);
  };

  if (!canUseChat) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      <div className={`${isOpen && !isMinimized ? 'block' : 'hidden'} w-[92vw] max-w-[420px] h-[70vh] max-h-[620px] min-h-[420px]`}>
        <ChatRuntimeErrorBoundary>
          <ChatWindow
            user={user}
            isOpen={isOpen}
            onClose={handleClose}
            minimized={isMinimized}
            onToggleMinimized={handleToggleMinimized}
            onUnreadChange={setUnreadCount}
          />
        </ChatRuntimeErrorBoundary>
      </div>

      <button
        type="button"
        onClick={toggleChat}
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900/95 text-white shadow-2xl shadow-black/40 transition hover:scale-105 hover:bg-slate-800"
        aria-label="Abrir chat geral"
      >
        <MessageCircleMore size={24} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-950/50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingChat;
