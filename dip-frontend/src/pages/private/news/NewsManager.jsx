import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Newspaper, 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  Edit, 
  Image as ImageIcon, 
  Eye, 
  X,
  Save,
  RotateCcw
} from 'lucide-react';
import clsx from 'clsx';
import ImageUploadArea from '../../../components/ImageUploadArea';

const NewsManager = () => {
  const { user } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    is_public: true
  });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          author:author_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    try {
      if (editingId) {
        const { error } = await supabase
          .from('news')
          .update({
            ...formData,
            updated_at: new Date()
          })
          .eq('id', editingId);
        if (error) throw error;
        setSuccessMsg('Notícia atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('news')
          .insert([{
            ...formData,
            author_id: user.id
          }]);
        if (error) throw error;
        setSuccessMsg('Notícia publicada com sucesso!');
      }

      resetForm();
      fetchNews();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error saving news:', error);
      alert('Erro ao salvar notícia.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;
    try {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw error;
      fetchNews();
      if (editingId === id) resetForm();
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      content: item.content,
      image_url: item.image_url || '',
      is_public: item.is_public
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      image_url: '',
      is_public: true
    });
    setEditingId(null);
  };

  const handleImageUpload = async (id, base64, file) => {
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('news')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('news')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 pt-8 pb-4 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-federal-600/20 border border-federal-500/30 flex items-center justify-center">
              <Newspaper className="text-federal-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gerenciador de Notícias</h1>
              <p className="text-slate-400 text-sm">Publique e gerencie notícias do portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulário (Esquerda) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                {editingId ? <Edit className="text-federal-500" /> : <Plus className="text-federal-500" />}
                {editingId ? 'Editar Notícia' : 'Nova Notícia'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    placeholder="Título da notícia..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
                  />
                </div>

                <div>
                  <ImageUploadArea
                    label="Imagem de Capa"
                    id="news-image"
                    image={formData.image_url}
                    onUpload={handleImageUpload}
                    onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    aspect={16/9}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Conteúdo</label>
                  <textarea
                    required
                    rows="6"
                    placeholder="Descreva os detalhes..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <input 
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-federal-600 focus:ring-federal-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="is_public" className="text-sm font-medium text-slate-300 cursor-pointer select-none flex-1">
                    Publicar na Home
                  </label>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm text-center">
                    {successMsg}
                  </div>
                )}

                <div className="flex gap-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-federal-900/20 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Publicar')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Lista de Notícias (Direita) */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[500px]">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Newspaper className="text-federal-500" />
                Notícias Publicadas
              </h3>

              {loading && !news.length ? (
                <div className="text-center py-10 text-slate-500">Carregando...</div>
              ) : news.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Nenhuma notícia encontrada.</div>
              ) : (
                <div className="space-y-4">
                  {news.map((item) => (
                    <div key={item.id} className="group bg-slate-950 border border-slate-800 hover:border-federal-500/50 rounded-xl p-4 flex gap-4 transition-all hover:shadow-lg hover:shadow-federal-900/10">
                      {/* Thumbnail */}
                      <div className="w-24 h-24 shrink-0 rounded-lg bg-slate-900 overflow-hidden border border-slate-800">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700">
                            <ImageIcon size={24} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-white line-clamp-1">{item.title}</h4>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEdit(item)}
                              className="p-1.5 hover:bg-federal-600/20 text-slate-400 hover:text-federal-400 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-400 line-clamp-2 mt-1 mb-auto">
                          {item.content}
                        </p>

                        <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-800/50">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          <span>{item.author?.full_name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NewsManager;
