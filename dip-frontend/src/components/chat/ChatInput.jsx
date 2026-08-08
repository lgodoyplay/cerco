import React, { useState } from 'react';
import { SendHorizonal } from 'lucide-react';

const ChatInput = ({ onSend, disabled = false }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    if (typeof onSend === 'function') {
      onSend(trimmed);
    }
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-800 bg-slate-950/70 p-3">
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Escreva uma mensagem..."
        className="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 max-h-28"
        maxLength={1000}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="rounded-xl bg-federal-600 p-2.5 text-white transition hover:bg-federal-500 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Enviar mensagem"
      >
        <SendHorizonal size={18} />
      </button>
    </form>
  );
};

export default ChatInput;
