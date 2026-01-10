import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch profile to get role and username
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data: profile }) => {
            setUser({ ...session.user, ...profile, username: profile?.full_name || session.user.email });
          })
          .catch(err => {
            console.error("Error loading profile:", err);
            // Even if profile fails, we might still want to let them in as basic user, or just finish loading
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
       if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setUser({ ...session.user, ...profile, username: profile?.full_name || session.user.email });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {loading ? (
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-yellow-500 rounded-full animate-spin"></div>
            <span className="text-slate-400 text-sm font-medium">Carregando sistema...</span>
          </div>
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
