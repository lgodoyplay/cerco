import React, { useState } from 'react';
import { Smile, Paperclip, Film, Send } from 'lucide-react';

const emojiOptions = ['😀', '😊', '🚀', '👏', '🔥', '💡'];

const DiscordMessageInput = ({ draft, onDraftChange, onSend, onAttachFile }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji) => {
    onDraftChange(`${draft}${emoji}`);
    setShowEmojiPicker(false);
  };

  const handleSend = () => {
    if (!draft?.trim()) return;
    onSend();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onAttachFile(file);
      event.target.value = '';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 shadow-inner shadow-black/20">
      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        rows={3}
        placeholder="Digite uma mensagem..."
        className="w-full resize-none border-none bg-transparent text-sm text-slate-200 outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button type="button" className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:text-white" onClick={() => setShowEmojiPicker((prev) => !prev)}>
              <Smile size={16} />
            </button>
            {showEmojiPicker ? (
              <div className="absolute bottom-12 left-0 flex gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2">
                {emojiOptions.map((emoji) => (
                  <button key={emoji} type="button" className="text-lg" onClick={() => handleEmojiSelect(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <label className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:text-white cursor-pointer">
            <Paperclip size={16} />
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
          <button type="button" className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:text-white">
            <Film size={16} />
          </button>
        </div>
        <button type="button" onClick={handleSend} className="flex items-center gap-2 rounded-full bg-federal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-federal-500">
          <Send size={16} />
          Enviar
        </button>
      </div>
    </div>
  );
};

export default DiscordMessageInput;
