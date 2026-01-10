import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Função unificada para carregar usuário e perfil
    const loadUserSession = async (session) => {
      try {
        if (session?.user) {
          // Busca perfil para obter role e username
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
             console.warn("Aviso: Não foi possível carregar o perfil do usuário.", profileError);
          }

          if (mounted) {
            setUser({ 
              ...session.user, 
              ...(profile || {}), 
              username: profile?.full_name || session.user.email,
              role: profile?.role || 'Agente' // Fallback seguro
            });
          }
        } else {
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error("Erro crítico ao carregar sessão:", err);
        if (mounted) setUser(null);
        
        // Tenta limpar sessão inválida para evitar loop de erro
        try {
          await supabase.auth.signOut();
          localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('.')[0]?.split('//')[1] + '-auth-token');
        } catch (e) {
          console.warn("Erro ao limpar sessão inválida:", e);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // 1. Inicialização: Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserSession(session);
    }).catch(err => {
      console.error("Erro no getSession:", err);
      if (mounted) {
          setUser(null);
          setLoading(false);
      }
    });

    // 2. Listener para mudanças de estado (Login, Logout, Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth State Change:", event);
      
      if (event === 'SIGNED_OUT') {
        if (mounted) {
            setUser(null);
            setLoading(false);
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Recarrega dados apenas se necessário para evitar loops
        // Mas para garantir atualização de perfil, chamamos a função segura
        loadUserSession(session);
      } else if (event === 'INITIAL_SESSION') {
         // Já tratado pelo getSession, mas garante redundância segura
         // loadUserSession(session); 
      }
    });

    // Timeout de segurança absoluto (caso Supabase trave)
    const timeout = setTimeout(() => {
        if (mounted && loading) {
            console.warn("Auth timeout forçado.");
            setLoading(false);
            setUser(null); // Força estado deslogado para permitir nova tentativa
        }
    }, 3000); // Reduzido para 3s para feedback mais rápido

    return () => {
        mounted = false;
        subscription.unsubscribe();
        clearTimeout(timeout);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Login error:', error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.warn("Erro ao fazer logout:", e);
    } finally {
        setUser(null);
        localStorage.clear(); // Limpeza completa
        window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {loading ? (
        <div className="fixed inset-0 bg-slate-950 z-[9999] flex items-center justify-center flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-800 border-t-yellow-500 rounded-full animate-spin"></div>
            <span className="text-slate-400 text-sm font-medium animate-pulse">Iniciando sistema...</span>
          </div>
          
          {/* Botão de Emergência após 2s se ainda estiver carregando (via CSS animation delay seria ideal, mas aqui vai fixo) */}
          <button 
            onClick={() => {
                setLoading(false);
                logout();
            }}
            className="mt-4 px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded hover:bg-slate-700 transition-colors border border-slate-700"
          >
            Demorando muito? Clique aqui para reiniciar
          </button>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
