import React, { useState } from 'react';
import { Lock, X, Key } from 'lucide-react';

const RoomPasswordModal = ({ room, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Digite a senha.');
      return;
    }

    if (password === room.password) {
      onSuccess();
    } else {
      setError('Senha incorreta.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-950 p-6 flex flex-col items-center border-b border-slate-800 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 bg-federal-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-federal-500/30">
            <Lock className="text-federal-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white text-center">Frequência Protegida</h2>
          <p className="text-slate-400 text-sm mt-1 text-center">
            A sala <span className="text-white font-mono font-bold">{room?.name}</span> requer senha.
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha de Acesso</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-slate-600 group-focus-within:text-federal-500 transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all font-mono tracking-widest"
                placeholder="••••••"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-federal-600 hover:bg-federal-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-federal-900/20 active:scale-[0.98] uppercase tracking-wider text-sm flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            Desbloquear Acesso
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoomPasswordModal;
