import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { FileText, MapPin, Calendar, User, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

const FineList = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [photos, setPhotos] = useState({});

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      const { data, error } = await supabase
        .from('prf_fines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFines(data);
    } catch (error) {
      console.error('Error fetching fines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (fineId) => {
    if (photos[fineId]) return;

    try {
      const { data, error } = await supabase
        .from('prf_photos')
        .select('photo_url')
        .eq('fine_id', fineId);

      if (error) throw error;
      setPhotos(prev => ({ ...prev, [fineId]: data }));
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

  if (loading) return <div className="text-center text-slate-400 py-8">Carregando multas...</div>;
  if (fines.length === 0) return <div className="text-center text-slate-400 py-8">Nenhuma multa registrada.</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">Multas Recentes</h3>
      {fines.map((item) => (
        <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
          <div 
            className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-900 transition-colors"
            onClick={() => toggleExpand(item.id)}
          >
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500/10 p-2 rounded-lg text-yellow-500">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-white">{item.violation_type}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
                  <span className="text-slate-300 font-medium">{item.vehicle_plate}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</span>
                  <span className="flex items-center gap-1"><User size={14} /> {item.officer_name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
               {item.fine_amount && (
                 <span className="font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                   $ {item.fine_amount}
                 </span>
               )}
               {expandedId === item.id ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
            </div>
          </div>

          {expandedId === item.id && (
            <div className="border-t border-slate-800 p-4 bg-slate-900/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Condutor</p>
                  <p className="text-slate-300">{item.driver_name || 'Não identificado'}</p>
                  {item.driver_passport && <p className="text-xs text-slate-500 mt-1">Passaporte: {item.driver_passport}</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Local</p>
                  <p className="text-slate-300 flex items-center gap-1"><MapPin size={14} /> {item.location || 'Não informado'}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Veículo</p>
                    <p className="text-slate-300">{item.vehicle_model || 'N/A'}</p>
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
                  <ImageIcon size={14} /> Evidências (Fotos)
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

export default FineList;
