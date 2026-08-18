import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Paperclip,
  Film,
  Send,
  AtSign,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Link,
  Image as ImageIcon,
  GripVertical,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const emojiOptions = ['😀', '😊', '🚀', '👏', '🔥', '💡', '👍', '👎', '🎯', '⭐', '💪', '🤝'];

const placeholderTexts = {
  text: 'Digite uma mensagem em #canal...',
  voice: 'Conectado ao canal de voz. Aqui não há chat.',
  general: 'Bate-papo geral da equipe...',
  operations: 'Mensagens de operação tática...',
};

const MessageComposer = ({
  draft,
  onDraftChange,
  onSend,
  onAttachFile,
  channelType = 'text',
  channelName = '',
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const emojiRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji) => {
    onDraftChange(`${draft}${emoji}`);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!draft?.trim()) return;
    onSend();
    textareaRef.current?.focus();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onAttachFile(file);
      event.target.value = '';
    }
  };

  const getPlaceholder = () => {
    if (channelType !== 'text') return placeholderTexts.voice;
    if (channelName.toLowerCase().includes('geral')) return placeholderTexts.general;
    if (channelName.toLowerCase().includes('oper')) return placeholderTexts.operations;
    return placeholderTexts.text;
  };

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300',
        isFocused
          ? 'border-federal-500/60 bg-slate-950 shadow-lg shadow-federal-900/10'
          : 'border-slate-800 bg-slate-950/80 shadow-inner shadow-black/20'
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-800/60 px-3 py-2">
        <GripVertical size={14} className="text-slate-600" />
        <div className="flex items-center gap-1">
          <button type="button" className="rounded p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300" title="Negrito">
            <Bold size={14} />
          </button>
          <button type="button" className="rounded p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300" title="Itálico">
            <Italic size={14} />
          </button>
          <button type="button" className="rounded p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300" title="Riscado">
            <Strikethrough size={14} />
          </button>
          <button type="button" className="rounded p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300" title="Código">
            <Code size={14} />
          </button>
        </div>
        <div className="mx-2 h-4 w-px bg-slate-800" />
        <div className="flex items-center gap-1">
          <button type="button" className="rounded p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300" title="Lista">
            <List size={14} />
          </button>
          <button type="button" className="rounded p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300" title="Lista ordenada">
            <ListOrdered size={14} />
          </button>
          <button type="button" className="rounded p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300" title="Citação">
            <Quote size={14} />
          </button>
          <button type="button" className="rounded p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300" title="Link">
            <Link size={14} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={3}
          placeholder={getPlaceholder()}
          disabled={channelType !== 'text'}
          className={cn(
            'w-full resize-none border-none bg-transparent text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600',
            channelType !== 'text' && 'cursor-not-allowed opacity-60'
          )}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 px-3 py-2">
        <div className="flex items-center gap-1">
          <div className="relative" ref={emojiRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Emoji"
            >
              <Smile size={18} />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 flex max-w-xs flex-wrap gap-1 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="rounded-lg p-1.5 text-lg transition hover:bg-slate-800"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white" title="Anexar arquivo">
            <Paperclip size={18} />
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>

          <button
            type="button"
            onClick={() => {}}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title="Anexar imagem"
          >
            <ImageIcon size={18} />
          </button>

          <button
            type="button"
            onClick={() => {}}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title="GIF"
          >
            <Film size={18} />
          </button>

          <button
            type="button"
            onClick={() => {}}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title="Mencionar"
          >
            <AtSign size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!draft?.trim()}
          className="flex items-center gap-2 rounded-xl bg-federal-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-federal-500 hover:shadow-lg hover:shadow-federal-900/30 disabled:opacity-50 disabled:hover:shadow-none"
        >
          <Send size={16} />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </div>
    </div>
  );
};

export default MessageComposer;
