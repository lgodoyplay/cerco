import React, { useState, useRef, useEffect } from 'react';
import { X, Copy, Shield, Calendar, Mail, Phone, UserPlus, UserCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const statusStyles = {
  online: 'bg-emerald-400',
  idle: 'bg-amber-400',
  offline: 'bg-slate-600',
  dnd: 'bg-rose-500',
};

const statusLabels = {
  online: 'Online',
  idle: 'Ausente',
  offline: 'Offline',
  dnd: 'Não perturbe',
};

const UserProfilePopover = ({ member, onClose }) => {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (member) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [member, onClose]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    if (member) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [member, onClose]);

  if (!member) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-4 mb-2 w-80 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 animate-fade-in-up"
    >
      <div className="relative h-28 rounded-t-2xl bg-gradient-to-br from-federal-600 to-violet-600" />
      <div className="px-5 pb-5">
        <div className="relative -mt-12 mb-3 flex items-end justify-between">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-900 bg-gradient-to-br from-federal-500 to-violet-600 text-xl font-bold text-white shadow-lg">
            {member.avatar}
          </div>
          <div className="mb-2 flex gap-2">
            <button className="rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white" title="Adicionar amigo">
              <UserPlus size={14} />
            </button>
            <button className="rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white" title="Enviar mensagem">
              <Mail size={14} />
            </button>
          </div>
        </div>

        <div className="mb-3">
          <h4 className="text-base font-bold text-white">{member.name}</h4>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
              {member.role}
            </span>
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
              <span className={`h-2 w-2 rounded-full ${statusStyles[member.status] || 'bg-slate-600'}`} />
              {statusLabels[member.status] || 'Offline'}
            </span>
          </div>
        </div>

        {member.bio && (
          <div className="mb-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
            {member.bio}
          </div>
        )}

        <div className="space-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-slate-600" />
            <span>ID: {member.id}</span>
            <button
              onClick={() => navigator.clipboard.writeText(member.id)}
              className="ml-auto rounded p-1 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
              title="Copiar ID"
            >
              <Copy size={12} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-slate-600" />
            <span>Entrou em: {member.joinedAt || 'Desconhecido'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePopover;
