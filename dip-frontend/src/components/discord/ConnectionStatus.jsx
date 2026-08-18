import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

const ConnectionStatus = ({ status }) => {
  const config = {
    connected: {
      icon: Wifi,
      label: 'Conectado',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      dot: 'bg-emerald-400',
    },
    disconnected: {
      icon: WifiOff,
      label: 'Desconectado',
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      dot: 'bg-rose-400',
    },
    connecting: {
      icon: Loader2,
      label: 'Conectando',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      dot: 'bg-amber-400',
    },
    reconnecting: {
      icon: Loader2,
      label: 'Reconectando',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      dot: 'bg-amber-400',
    },
  };

  const state = config[status] || config.connecting;
  const Icon = state.icon;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${state.color}`}>
      <span className={`relative flex h-2 w-2`}>
        <span className={`absolute inline-flex h-full w-full rounded-full ${state.dot} opacity-75 ${status === 'connecting' || status === 'reconnecting' ? 'animate-ping' : ''}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${state.dot}`} />
      </span>
      <Icon size={12} className={status === 'connecting' || status === 'reconnecting' ? 'animate-spin' : ''} />
      {state.label}
    </div>
  );
};

export default ConnectionStatus;
