import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, User, Key, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Login agora gerencia o estado de loading e user internamente
    // A navegação será tratada pelo useEffect abaixo
    const success = await login(username, password);
    if (!success) {
      setError('Credenciais inválidas. Acesso negado.');
    }
  };

  // Efeito de segurança para garantir que só redirecionamos quando o usuário estiver carregado
  React.useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-federal-900/50 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 mb-6 shadow-2xl shadow-federal-900/50 relative group">
            <div className="absolute inset-0 bg-federal-500/10 blur-xl rounded-full group-hover:bg-federal-500/20 transition-all" />
            <Shield className="w-12 h-12 text-federal-500 relative z-10" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">CERCO</h1>
          <div className="h-1 w-20 bg-federal-600 mx-auto mb-4 rounded-full" />
          <p className="text-federal-400 font-medium tracking-[0.2em] uppercase text-sm">Polícia Civil</p>
          <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Acesso Restrito</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-federal-500 to-transparent opacity-50" />
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider ml-1">Identificação</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-600 group-focus-within:text-federal-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all sm:text-sm"
                  placeholder="ID ou Usuário"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider ml-1">Senha de Acesso</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-600 group-focus-within:text-federal-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-federal-900/50 text-sm font-bold text-white bg-federal-600 hover:bg-federal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-federal-500 transition-all duration-200 uppercase tracking-wider mt-6 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>AUTENTICANDO...</span>
                </div>
              ) : (
                'ENTRAR NO SISTEMA'
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-slate-600 text-xs flex items-center justify-center gap-2">
            <Lock size={12} />
            Conexão Segura e Monitorada
          </p>
          <p className="text-slate-700 text-[10px]">
            O acesso não autorizado a este sistema é crime federal sujeito a pena de reclusão.
            <br />IP registrado para fins de auditoria.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
