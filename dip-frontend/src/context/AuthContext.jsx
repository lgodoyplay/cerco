import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);
  const isMounted = useRef(true);
  // Flag para evitar que eventos do Supabase interfiram durante o processo de login manual
  const isLoggingIn = useRef(false);

  const loadUserSession = async (session) => {
    // Se estamos carregando uma sessão, cancelamos o timeout de segurança
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    try {
      if (session?.user) {
        let profile = null;
        
        // Tenta buscar o perfil, mas não falha o login se der erro de rede
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error && error.code !== 'PGRST116') {
             console.warn("Auth: Erro ao carregar perfil.", error);
          }
          profile = data;
        } catch (profileErr) {
          console.warn("Auth: Exceção ao buscar perfil (rede?):", profileErr);
          // Não fazemos nada, profile continua null e seguimos o fluxo
        }

        if (isMounted.current) {
          setUser(prev => ({ 
            ...(prev || {}), // Mantém dados anteriores se existirem
            ...session.user, 
            ...(profile || {}), 
            username: profile?.full_name || session.user.email,
            role: profile?.role || prev?.role || 'Agente'
          }));
        }
      } else {
        // Só limpamos o usuário se NÃO estivermos no meio de um login manual
        if (isMounted.current && !isLoggingIn.current) {
            setUser(null);
        }
      }
    } catch (err) {
      console.error("Erro crítico ao carregar sessão:", err);
      // Se tivermos um erro crítico aqui, evitamos deslogar imediatamente se já tivermos um usuário
      // Apenas se não tiver user nenhum é que forçamos null
      if (isMounted.current && !isLoggingIn.current && !user) setUser(null);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    let mounted = true;

    // 1. Inicialização: Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserSession(session);
    }).catch(err => {
      console.error("Erro no getSession:", err);
      if (isMounted.current) {
          setUser(null);
          setLoading(false);
      }
    });

    // 2. Listener para mudanças de estado (Login, Logout, Refresh)
    let subscription;
    try {
      const authResult = supabase.auth.onAuthStateChange((event, session) => {
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (event === 'SIGNED_OUT') {
          if (isMounted.current && !isLoggingIn.current) {
              setUser(null);
              setLoading(false);
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Se estivermos logando manualmente, deixamos o fluxo manual cuidar disso
          if (!isLoggingIn.current) {
              loadUserSession(session);
          }
        } else if (event === 'INITIAL_SESSION') {
           if (session) loadUserSession(session); 
        }
      });
      subscription = authResult?.data?.subscription;
    } catch (realtimeError) {
      console.warn('AuthContext: inscrição Realtime indisponível no momento.', realtimeError);
    }

    // Timeout de segurança (Aumentado para 30s para evitar logouts em conexões lentas)
    timeoutRef.current = setTimeout(() => {
        if (isMounted.current && loading) {
            console.warn("Auth timeout forçado (30s).");
            setLoading(false);
            if (!isLoggingIn.current) setUser(null);
        }
    }, 30000); 

    return () => {
        mounted = false;
        isMounted.current = false;
        subscription.unsubscribe();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const login = async (identifier, password) => {
    try {
      isLoggingIn.current = true;

      let email = identifier.trim();

      if (!email.includes('@')) {
        const { data, error } = await supabase.rpc('get_email_by_identifier', { identifier: email });
        if (error || !data) {
          email = `${email.toLowerCase()}@dip.system`;
        } else {
          email = data;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      await loadUserSession(data.session);
      return true;
    } catch (error) {
      console.error('Login error:', error.message);
      return false;
    } finally {
      setTimeout(() => { isLoggingIn.current = false; }, 500);
    }
  };

  const updateUser = (data) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  const logout = async () => {
    try {
      isLoggingIn.current = false;
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erro ao fazer logout:', e);
    } finally {
      setUser(null);
      // Remove apenas as chaves do Supabase, preservando outros dados do localStorage
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k));
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user, loading }}>
      {loading ? (
        <div className="fixed inset-0 bg-slate-950 z-[9999] flex items-center justify-center flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-800 border-t-yellow-500 rounded-full animate-spin"></div>
            <span className="text-slate-400 text-sm font-medium animate-pulse">Iniciando sistema...</span>
          </div>
          
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
