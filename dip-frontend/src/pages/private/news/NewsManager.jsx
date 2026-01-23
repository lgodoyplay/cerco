import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Newspaper, Plus, Search, Calendar, Trash2, Edit, Image as ImageIcon, Eye, X } from 'lucide-react';
import clsx from 'clsx';
import ImageUploadArea from '../../../components/ImageUploadArea';

const NewsManager = () => {
  const { user } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    is_public: true
  });

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
      } else {
        const { error } = await supabase
          .from('news')
          .insert([{
            ...formData,
            author_id: user.id
          }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      resetForm();
      fetchNews();
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
    setIsModalOpen(true);
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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="text-federal-500" />
            Gerenciador de Notícias
          </h2>
          <p className="text-slate-400">Publique notícias e apreensões para o portal público.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-4 py-2 bg-federal-600 hover:bg-federal-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-federal-900/20"
        >
          <Plus size={18} />
          Nova Notícia
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
           <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : news.length === 0 ? (
           <div className="p-8 text-center text-slate-500">Nenhuma notícia publicada.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {news.map((item) => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col group">
                <div className="h-48 bg-slate-800 relative overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-slate-900/80 text-white hover:bg-federal-600 rounded-lg backdrop-blur-sm transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-slate-900/80 text-white hover:bg-red-600 rounded-lg backdrop-blur-sm transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">{item.content}</p>
                  <div className="flex justify-between items-center text-xs text-slate-500 mt-auto pt-4 border-t border-slate-800">
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 my-8">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 pb-4 border-b border-slate-800">
              {editingId ? <Edit size={32} className="text-federal-500" /> : <Plus size={32} className="text-federal-500" />}
              {editingId ? 'Editar Notícia' : 'Nova Notícia'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Título</label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                  placeholder="Título da notícia ou apreensão..."
                  required
                />
              </div>

              <div>
                <ImageUploadArea
                  label="Imagem / Documento"
                  id="news-image"
                  image={formData.image_url}
                  onUpload={handleImageUpload}
                  onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  aspect={16/9}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Conteúdo</label>
                <textarea 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none h-32 resize-none"
                  placeholder="Descreva os detalhes..."
                  required
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
                  Publicar na Home (Visível para todos)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-lg shadow-lg shadow-federal-900/20 transition-all flex items-center gap-2"
                >
                  {editingId ? 'Salvar Alterações' : 'Publicar Notícia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsManager;
