import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChangePasswordModal = () => {
  const { user, updateUser } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Update Auth Password
      const { error: authError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (authError) throw authError;

      // 2. Update Profile flag
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Update local state
      updateUser({ must_change_password: false });
      setSuccess(true);
      
      // Optional: Auto-reload or just close (since it's conditionally rendered)
      // The parent component will stop rendering this modal once user.must_change_password is false
      
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Erro ao alterar senha: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-green-500/30 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in-up">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Senha Alterada!</h2>
          <p className="text-slate-400 mb-6">Sua senha foi atualizada com sucesso. Você já pode acessar o sistema.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold w-full transition-colors"
          >
            Continuar para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-federal-600/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-federal-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Alteração de Senha Obrigatória</h2>
          <p className="text-slate-400 text-center mt-2 text-sm">
            Por motivos de segurança, você deve alterar sua senha provisória no primeiro acesso.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nova Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-federal-500 outline-none pr-10"
                placeholder="Mínimo 6 caracteres"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Confirmar Nova Senha</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-federal-500 outline-none"
              placeholder="Digite novamente a senha"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-federal-600 hover:bg-federal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-lg mt-4 transition-all"
          >
            {loading ? 'Atualizando...' : 'Definir Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
