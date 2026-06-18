import { useState, useEffect } from 'react';
import { Shield, Eye, X, FileText, Image, Video, Calendar, User, Trash2, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

const CorregedoriaList = () => {
  const [denuncias, setDenuncias] = useState([]);
  const [selectedDenuncia, setSelectedDenuncia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDenuncias = async () => {
      try {
        const { data, error } = await supabase.from('corregedoria').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setDenuncias(data || []);
      } catch (err) {
        console.error('Error fetching:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDenuncias();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta denúncia?')) return;
    try {
      const { error } = await supabase.from('corregedoria').delete().eq('id', id);
      if (error) throw error;
      setDenuncias(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const renderItemIcon = (item) => {
    if (item.type === 'link') return <LinkIcon size={18} className="text-blue-400" />;
    const url = item.url || item;
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return <Image size={18} className="text-blue-400" />;
    if (/\.(mp4|webm|mov)$/i.test(url)) return <Video size={18} className="text-purple-400" />;
    return <FileText size={18} className="text-yellow-400" />;
  };

  const getItemUrl = (item) => {
    return typeof item === 'string' ? item : item.url;
  };

  const getItemName = (item) => {
    if (typeof item === 'string') {
      return decodeURIComponent(item.split('/').pop().split('?')[0]);
    }
    if (item.type === 'link') {
      return item.url;
    }
    return item.name || decodeURIComponent(item.url.split('/').pop().split('?')[0]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield size={32} className="text-red-500" />
          Denúncias da Corregedoria
        </h2>
        <p className="text-slate-400 mt-2">Visualize e gerencie todas as denúncias enviadas para a Corregedoria.</p>
      </div>

      {denuncias.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <p className="text-slate-400 text-xl">Nenhuma denúncia recebida ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {denuncias.map((denuncia) => (
            <div key={denuncia.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {denuncia.nome || 'Denúncia Anônima'}
                  </h3>
                </div>
                <p className="text-slate-400 text-sm line-clamp-2">
                  {denuncia.detalhes}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {format(new Date(denuncia.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {denuncia.arquivos?.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {denuncia.arquivos.length} item(s)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDenuncia(denuncia)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => handleDelete(denuncia.id)}
                  className="p-3 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedDenuncia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedDenuncia(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield size={24} className="text-red-500" />
                Detalhes da Denúncia
              </h3>
              <button onClick={() => setSelectedDenuncia(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Nome do Envio
                </span>
                <p className="text-xl text-white font-medium">
                  {selectedDenuncia.nome || 'Denúncia Anônima'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Data e Hora
                </span>
                <p className="text-lg text-slate-300">
                  {format(new Date(selectedDenuncia.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                  Detalhes
                </span>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedDenuncia.detalhes}
                </p>
              </div>

              {selectedDenuncia.arquivos?.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-4">
                    Arquivos e Provas
                  </span>
                  <div className="grid gap-4">
                    {selectedDenuncia.arquivos.map((item, index) => (
                      <div key={index} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                        {renderItemIcon(item)}
                        <div className="flex-1">
                          {typeof item === 'object' && item.type === 'link' ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 truncate hover:underline"
                            >
                              {item.url}
                            </a>
                          ) : (
                            <p className="text-sm text-white truncate">
                              {getItemName(item)}
                            </p>
                          )}
                        </div>
                        <a
                          href={getItemUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          Abrir
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorregedoriaList;
