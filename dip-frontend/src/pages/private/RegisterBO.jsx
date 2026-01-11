import React, { useState } from 'react';
import { Save, Eraser, FileText, CheckCircle, AlertCircle, Shield, MapPin, Calendar, User } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';

const RegisterBO = () => {
  const { logAction } = useSettings();
  const [formData, setFormData] = useState({
    complainant: '',
    description: '',
    location: '',
    date: '',
    officer: '',
  });

  const [notification, setNotification] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.complainant && formData.description && formData.location && formData.date && formData.officer;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('boletins')
        .insert([{
          comunicante: formData.complainant,
          descricao: formData.description,
          localizacao: formData.location,
          data_fato: formData.date,
          policial_responsavel: formData.officer,
          status: 'Registrado',
          created_by: user?.id
        }]);

      if (error) throw error;

      // Log action
      logAction(`B.O. Registrado: ${formData.complainant} - ${formData.description.substring(0, 30)}...`);

      // Success
      setNotification({
        type: 'success',
        message: 'Boletim de ocorrência registrado com sucesso'
      });
      
      // Clear form
      setFormData({
        complainant: '',
        description: '',
        location: '',
        date: '',
        officer: '',
      });
    } catch (error) {
      console.error('Erro ao registrar BO:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao registrar boletim: ' + error.message
      });
    } finally {
      setLoading(false);
    }
    
    // Clear notification after 3s
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="text-federal-500" size={32} />
          Registrar Boletim de Ocorrência
        </h2>
        <p className="text-slate-400 mt-2">Preencha os dados abaixo para registrar uma nova ocorrência no sistema.</p>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={clsx(
          "fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in-up",
          notification.type === 'success' 
            ? "bg-emerald-900/90 border-emerald-500 text-emerald-100" 
            : "bg-red-900/90 border-red-500 text-red-100"
        )}>
          {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <div>
            <h4 className="font-bold">{notification.type === 'success' ? 'Sucesso' : 'Erro'}</h4>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Comunicante */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nome do Comunicante</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-600" size={20} />
              <input
                type="text"
                name="complainant"
                value={formData.complainant}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="Quem está reportando o fato?"
                required
              />
            </div>
          </div>

          {/* Local */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Local da Ocorrência</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 text-slate-600" size={20} />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="Endereço ou Ponto de Referência"
                required
              />
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Data do Fato</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-3.5 text-slate-600" size={20} />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Descrição da Ocorrência</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
              placeholder="Descreva detalhadamente o que aconteceu..."
              required
            />
          </div>

          {/* Policial Responsável */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Policial Responsável</label>
            <div className="relative">
              <Shield className="absolute left-4 top-3.5 text-slate-600" size={20} />
              <input
                type="text"
                name="officer"
                value={formData.officer}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="Seu nome ou distintivo"
                required
              />
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setFormData({ complainant: '', description: '', location: '', date: '', officer: '' })}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Eraser size={18} />
            Limpar
          </button>
          
          <button
            type="submit"
            disabled={!isFormValid()}
            className={clsx(
              "px-8 py-3 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2",
              isFormValid() 
                ? "bg-federal-600 hover:bg-federal-500 text-white shadow-federal-900/50 hover:shadow-federal-600/20 transform hover:-translate-y-0.5" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
            )}
          >
            <FileText size={18} />
            Registrar BO
          </button>
        </div>

      </form>
    </div>
  );
};

export default RegisterBO;
