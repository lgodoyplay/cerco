import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import PhotoUploader from './PhotoUploader';

const SeizureForm = ({ onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_model: '',
    vehicle_plate: '',
    vehicle_color: '',
    reason: '',
    location: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Seizure Record
      const { data: seizure, error: seizureError } = await supabase
        .from('prf_seizures')
        .insert([{
          officer_id: user.id,
          officer_name: user.full_name,
          ...formData,
          status: 'Apreendido'
        }])
        .select()
        .single();

      if (seizureError) throw seizureError;

      // 2. Link Photos
      if (photos.length > 0) {
        const photoRecords = photos.map(url => ({
          seizure_id: seizure.id,
          photo_url: url,
          photo_type: 'vehicle_condition'
        }));

        const { error: photoError } = await supabase
          .from('prf_photos')
          .insert(photoRecords);
          
        if (photoError) throw photoError;
      }

      alert('Apreensão registrada com sucesso!');
      onSuccess();
      setFormData({
        vehicle_model: '',
        vehicle_plate: '',
        vehicle_color: '',
        reason: '',
        location: '',
        notes: ''
      });
      setPhotos([]);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao registrar apreensão: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Modelo do Veículo</label>
          <input
            required
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.vehicle_model}
            onChange={e => setFormData({...formData, vehicle_model: e.target.value})}
            placeholder="Ex: Honda Civic"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Placa</label>
          <input
            required
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase"
            value={formData.vehicle_plate}
            onChange={e => setFormData({...formData, vehicle_plate: e.target.value.toUpperCase()})}
            placeholder="ABC-1234"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Cor</label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.vehicle_color}
            onChange={e => setFormData({...formData, vehicle_color: e.target.value})}
            placeholder="Ex: Prata"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Motivo da Apreensão</label>
          <input
            required
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.reason}
            onChange={e => setFormData({...formData, reason: e.target.value})}
            placeholder="Ex: Documentação irregular"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-400 mb-1">Local da Abordagem</label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
            placeholder="Ex: Rodovia X, km 10"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-400 mb-1">Observações</label>
          <textarea
            rows="3"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            placeholder="Detalhes adicionais sobre o estado do veículo ou objetos encontrados..."
          />
        </div>
      </div>

      <PhotoUploader photos={photos} setPhotos={setPhotos} />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
        >
          {loading ? 'Registrando...' : 'Registrar Apreensão'}
        </button>
      </div>
    </form>
  );
};

export default SeizureForm;
