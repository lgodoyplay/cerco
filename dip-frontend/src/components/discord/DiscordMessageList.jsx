import React from 'react';
import { MoreHorizontal } from 'lucide-react';

const DiscordMessageList = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm shadow-black/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-federal-500 to-violet-600 text-sm font-semibold text-white">
                {message.author.avatar}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{message.author.name}</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-400">{message.author.role}</span>
                  <span className="text-xs text-slate-500">{message.timestamp}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{message.content}</p>
                {message.attachments?.length ? (
                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-800/70 p-2 text-sm text-slate-300">
                    {message.attachments.join(', ')}
                  </div>
                ) : null}
                {message.reactions?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.reactions.map((reaction) => (
                      <span key={`${message.id}-${reaction.emoji}`} className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">
                        {reaction.emoji} {reaction.count}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <button className="rounded-full p-2 text-slate-500 hover:bg-slate-800 hover:text-white" title="Mais opções">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DiscordMessageList;
