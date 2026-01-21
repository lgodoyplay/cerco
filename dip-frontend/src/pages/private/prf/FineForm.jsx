import React, { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import PhotoUploader from './PhotoUploader';

const FineForm = ({ onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState({
    vehicle_plate: '',
    vehicle_model: '',
    driver_name: '',
    driver_passport: '',
    violation_type: '',
    fine_amount: '',
    location: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Fine Record
      const { data: fine, error: fineError } = await supabase
        .from('prf_fines')
        .insert([{
          officer_id: user.id,
          officer_name: user.full_name,
          ...formData,
          fine_amount: formData.fine_amount ? parseFloat(formData.fine_amount) : null
        }])
        .select()
        .single();

      if (fineError) throw fineError;

      // 2. Link Photos
      if (photos.length > 0) {
        const photoRecords = photos.map(url => ({
          fine_id: fine.id,
          photo_url: url,
          photo_type: 'evidence'
        }));

        const { error: photoError } = await supabase
          .from('prf_photos')
          .insert(photoRecords);
          
        if (photoError) throw photoError;
      }

      alert('Multa registrada com sucesso!');
      onSuccess();
      setFormData({
        vehicle_plate: '',
        vehicle_model: '',
        driver_name: '',
        driver_passport: '',
        violation_type: '',
        fine_amount: '',
        location: '',
        notes: ''
      });
      setPhotos([]);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao registrar multa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Placa do Veículo</label>
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
          <label className="block text-sm font-medium text-slate-400 mb-1">Modelo do Veículo</label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.vehicle_model}
            onChange={e => setFormData({...formData, vehicle_model: e.target.value})}
            placeholder="Ex: Fiat Uno"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Motorista</label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.driver_name}
            onChange={e => setFormData({...formData, driver_name: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Passaporte do Motorista</label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.driver_passport}
            onChange={e => setFormData({...formData, driver_passport: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Infração</label>
          <input
            required
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.violation_type}
            onChange={e => setFormData({...formData, violation_type: e.target.value})}
            placeholder="Ex: Excesso de velocidade"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Valor da Multa ($)</label>
          <input
            type="number"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.fine_amount}
            onChange={e => setFormData({...formData, fine_amount: e.target.value})}
            placeholder="0.00"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-400 mb-1">Local da Infração</label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-400 mb-1">Observações</label>
          <textarea
            rows="3"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
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
          {loading ? 'Registrando...' : 'Registrar Multa'}
        </button>
      </div>
    </form>
  );
};

export default FineForm;
