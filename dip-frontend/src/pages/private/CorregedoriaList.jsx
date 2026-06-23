import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, FileText, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { parseCorregedoriaAttachment } from '../../utils/corregedoriaMedia';

const CorregedoriaList = () => {
  const navigate = useNavigate();
  const [denuncias, setDenuncias] = useState([]);
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
                      {denuncia.arquivos.map(parseCorregedoriaAttachment).filter((item) => item.url).length} item(s)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/dashboard/corregedoria/${denuncia.id}`)}
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
    </div>
  );
};

export default CorregedoriaList;
