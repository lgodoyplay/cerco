import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const PermissionGuard = ({ permission, children, fallback }) => {
  const { user } = useAuth();

  // Se o usuário não estiver carregado ainda, não mostramos nada (ou loading)
  // Mas como isso vai rodar dentro de ProtectedRoute, o usuário deve existir.
  
  // Verifica se o usuário tem a permissão necessária
  // Adicionalmente, podemos dar bypass para 'Diretor Geral' se desejado, 
  // mas vamos seguir estritamente as checkboxes como solicitado.
  const hasPermission = user?.permissions?.includes(permission);

  if (!hasPermission) {
    if (fallback) return fallback;
    
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[60vh] text-slate-400 animate-fade-in">
        <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 border border-slate-800 shadow-xl shadow-red-900/10">
            <ShieldAlert size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Acesso Negado</h2>
        <p className="text-center max-w-md text-slate-400 leading-relaxed">
          Você não tem permissão para acessar esta funcionalidade.
          <br/>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-600 mt-4 block">
            Permissão Necessária: {permission}
          </span>
        </p>
      </div>
    );
  }

  return children;
};

export default PermissionGuard;
