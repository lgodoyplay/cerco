import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import AvatarUpload from '../../components/AvatarUpload';
import { User, Shield, Calendar, BookOpen, Save, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      getProfile();
      getMyCourses();
    }
  }, [user]);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMyCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('cursos_policiais')
        .select(`
          id,
          cursos (
            id,
            nome,
            descricao
          )
        `)
        .eq('policial_id', user.id);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error.message);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const updates = {
        id: user.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (url) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);

      if (error) throw error;
      setProfile({ ...profile, avatar_url: url });
      setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
    } catch (error) {
      console.error('Error updating avatar:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar nova foto.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-federal-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <User className="text-federal-500" size={32} />
            Meu Perfil
          </h1>
          <p className="text-slate-400 mt-1">Gerencie suas informações pessoais e visualize seus cursos.</p>
        </div>
      </div>

      {message && (
        <div className={clsx(
          "p-4 rounded-xl border flex items-center gap-3",
          message.type === 'success' ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400" : "bg-red-950/30 border-red-500/30 text-red-400"
        )}>
          <CheckCircle size={20} />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center shadow-lg">
            <AvatarUpload 
              url={profile?.avatar_url} 
              onUpload={handleAvatarUpload}
              size={180}
            />
            
            <div className="mt-6 text-center w-full">
              <h2 className="text-xl font-bold text-white">{profile?.full_name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2 text-federal-400 font-medium bg-federal-950/30 py-1 px-3 rounded-full border border-federal-500/20 inline-flex">
                <Shield size={14} />
                {profile?.role || 'Agente'}
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4 w-full pt-6 border-t border-slate-800">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{courses.length}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Cursos</p>
                </div>
                <div className="text-center border-l border-slate-800">
                  <p className="text-2xl font-bold text-white">
                    {new Date(profile?.created_at).getFullYear()}
                  </p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Desde</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form & Courses */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Form */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-federal-500" />
              Dados Pessoais
            </h3>
            
            <form onSubmit={updateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={profile?.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-federal-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email / Login</label>
                  <input
                    type="text"
                    value={user.email}
                    disabled
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data de Entrada</label>
                  <div className="flex items-center gap-2 w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed">
                    <Calendar size={16} />
                    {new Date(profile?.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-federal-600 hover:bg-federal-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-federal-900/20"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Courses List */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-federal-500" />
              Meus Cursos e Especializações
            </h3>

            {courses.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                <BookOpen size={32} className="mx-auto mb-2 opacity-20" />
                <p>Nenhum curso registrado em sua ficha.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courses.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-federal-500/30 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-federal-900/20 flex items-center justify-center border border-federal-500/20 text-federal-400 group-hover:text-federal-300 group-hover:border-federal-500/40 transition-all">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{item.cursos?.nome}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.cursos?.descricao || 'Curso Oficial'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
