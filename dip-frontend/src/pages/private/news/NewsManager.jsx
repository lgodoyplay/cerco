import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Newspaper, Plus, Search, Calendar, Trash2, Edit, Image as ImageIcon, Eye } from 'lucide-react';
import clsx from 'clsx';

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingId ? 'Editar Notícia' : 'Nova Notícia'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-federal-500 focus:outline-none"
                  placeholder="Título da notícia ou apreensão..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">URL da Imagem</label>
                <input 
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-federal-500 focus:outline-none"
                  placeholder="https://..."
                />
                <p className="text-xs text-slate-500 mt-1">Use um link direto para a imagem (Imgur, Discord, etc).</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Conteúdo</label>
                <textarea 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-federal-500 focus:outline-none h-48 resize-none"
                  placeholder="Descreva os detalhes..."
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                  className="rounded bg-slate-950 border-slate-800 text-federal-600 focus:ring-federal-500"
                />
                <label htmlFor="is_public" className="text-sm text-slate-300">Visível ao público (Home)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-federal-600 hover:bg-federal-700 text-white rounded-lg transition-colors font-bold"
                >
                  Salvar Notícia
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
