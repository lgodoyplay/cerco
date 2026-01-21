import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Car, MapPin, Calendar, User, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

const SeizureList = () => {
  const [seizures, setSeizures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [photos, setPhotos] = useState({});

  useEffect(() => {
    fetchSeizures();
  }, []);

  const fetchSeizures = async () => {
    try {
      const { data, error } = await supabase
        .from('prf_seizures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSeizures(data);
    } catch (error) {
      console.error('Error fetching seizures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (seizureId) => {
    if (photos[seizureId]) return; // Already fetched

    try {
      const { data, error } = await supabase
        .from('prf_photos')
        .select('photo_url')
        .eq('seizure_id', seizureId);

      if (error) throw error;
      setPhotos(prev => ({ ...prev, [seizureId]: data }));
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchPhotos(id);
    }
  };

  if (loading) return <div className="text-center text-slate-400 py-8">Carregando apreensões...</div>;
  if (seizures.length === 0) return <div className="text-center text-slate-400 py-8">Nenhuma apreensão registrada.</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">Apreensões Recentes</h3>
      {seizures.map((item) => (
        <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
          <div 
            className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-900 transition-colors"
            onClick={() => toggleExpand(item.id)}
          >
            <div className="flex items-center gap-4">
              <div className="bg-red-500/10 p-2 rounded-lg text-red-500">
                <Car size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-white">{item.vehicle_model} - <span className="text-slate-400">{item.vehicle_plate}</span></h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</span>
                  <span className="flex items-center gap-1"><User size={14} /> {item.officer_name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                 item.status === 'Apreendido' ? 'bg-red-500/20 text-red-400' :
                 item.status === 'Liberado' ? 'bg-green-500/20 text-green-400' :
                 'bg-yellow-500/20 text-yellow-400'
               }`}>
                 {item.status}
               </span>
               {expandedId === item.id ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
            </div>
          </div>

          {expandedId === item.id && (
            <div className="border-t border-slate-800 p-4 bg-slate-900/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Motivo</p>
                  <p className="text-slate-300">{item.reason}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Local</p>
                  <p className="text-slate-300 flex items-center gap-1"><MapPin size={14} /> {item.location || 'Não informado'}</p>
                </div>
                {item.notes && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Observações</p>
                    <p className="text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">{item.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ImageIcon size={14} /> Fotos do Veículo
                </p>
                {photos[item.id] ? (
                  photos[item.id].length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {photos[item.id].map((photo, idx) => (
                        <a key={idx} href={photo.photo_url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition-colors">
                          <img src={photo.photo_url} alt={`Evidência ${idx}`} className="w-full h-32 object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Nenhuma foto registrada.</p>
                  )
                ) : (
                  <div className="animate-pulse h-32 bg-slate-800 rounded-lg"></div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SeizureList;
