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
        // Busca perfil para obter role e username
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
           console.warn("Auth: Erro ao carregar perfil.", profileError);
        }

        if (isMounted.current) {
          setUser({ 
            ...session.user, 
            ...(profile || {}), 
            username: profile?.full_name || session.user.email,
            role: profile?.role || 'Agente'
          });
        }
      } else {
        // Só limpamos o usuário se NÃO estivermos no meio de um login manual
        if (isMounted.current && !isLoggingIn.current) {
            setUser(null);
        }
      }
    } catch (err) {
      console.error("Erro crítico ao carregar sessão:", err);
      if (isMounted.current && !isLoggingIn.current) setUser(null);
      
      // Tenta limpar sessão inválida para evitar loop de erro
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('.')[0]?.split('//')[1] + '-auth-token');
      } catch (e) {
        // Ignora erro de logout
      }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      
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

    // Timeout de segurança
    timeoutRef.current = setTimeout(() => {
        if (isMounted.current && loading) {
            console.warn("Auth timeout forçado.");
            setLoading(false);
            if (!isLoggingIn.current) setUser(null);
        }
    }, 10000); 

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
      
      // Remove espaços extras do identificador (mas não da senha)
      let email = identifier.trim();

      // Se não parece um email, tenta resolver pelo ID Funcional ou Email salvo no profile
      if (!email.includes('@')) {
          console.log('Tentando resolver email para ID:', email);
          const { data, error } = await supabase.rpc('get_email_by_identifier', { identifier: email });
          
          if (error) {
            console.error('CRITICAL: RPC get_email_by_identifier falhou:', error);
            // Se falhar a RPC, tentamos construir o email padrão do sistema como fallback
            const fallbackEmail = `${email.toLowerCase()}@dip.system`;
            console.log(`RPC falhou. Tentando fallback para email padrão: ${fallbackEmail}`);
            email = fallbackEmail;
          } else if (data) {
              console.log('Email resolvido via RPC:', data);
              email = data;
          } else {
              console.log('Nenhum email encontrado via RPC. Tentando fallback padrão.');
              const fallbackEmail = `${email.toLowerCase()}@dip.system`;
              email = fallbackEmail;
          }
      }

      console.log(`Tentando login com email: ${email}`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('CRITICAL: signInWithPassword falhou:', error);
        throw error;
      }
      
      console.log('Login bem sucedido! Sessão:', data.session?.user?.id);
      
      return true;
    } catch (error) {
      console.error('Login error:', error.message);
      return false;
    } finally {
      // Pequeno delay para garantir que estados se estabilizem antes de liberar a flag
      setTimeout(() => {
          isLoggingIn.current = false;
      }, 500);
    }
  };

  const updateUser = (data) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  const logout = async () => {
    try {
        isLoggingIn.current = false; // Garante que flags sejam resetadas
        await supabase.auth.signOut();
    } catch (e) {
        console.warn("Erro ao fazer logout:", e);
    } finally {
        setUser(null);
        localStorage.clear();
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
