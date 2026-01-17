import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileSearch, 
  ArrowLeft, 
  Save, 
  Camera, 
  X, 
  Youtube,
  Image as ImageIcon,
  MapPin,
  User,
  Car,
  Plus
} from 'lucide-react';
import { useForensics } from '../../../hooks/useForensics';
import { useSettings } from '../../../hooks/useSettings';
import clsx from 'clsx';

const RegisterForensics = () => {
  const navigate = useNavigate();
  const { addForensics } = useForensics();
  const { discordConfig } = useSettings();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Pessoa', // Default
    description: '',
    youtube_link: ''
  });

  const [photos, setPhotos] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPhotos = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      description: ''
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const handlePhotoDescriptionChange = (id, desc) => {
    setPhotos(prev => prev.map(p => 
      p.id === id ? { ...p, description: desc } : p
    ));
  };

  const removePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.type) return;

    try {
      setLoading(true);
      const newId = await addForensics(formData, photos);

      // Enviar notificação para o Discord se configurado
      if (discordConfig?.forensicsWebhook) {
        try {
          const embed = {
            title: "🔬 Nova Solicitação de Perícia",
            description: `**${formData.title}**`,
            color: 0x06b6d4, // Cyan
            fields: [
              { name: "Tipo", value: formData.type, inline: true },
              { name: "Descrição", value: formData.description || "Sem descrição detalhada" },
              { name: "Evidências", value: `${photos.length} fotos anexadas`, inline: true },
              { name: "Vídeo", value: formData.youtube_link ? "Sim" : "Não", inline: true }
            ],
            footer: { text: "Sistema de Perícias Técnicas" },
            timestamp: new Date().toISOString()
          };

          await fetch(discordConfig.forensicsWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
          });
        } catch (webhookError) {
          console.error('Erro ao enviar webhook:', webhookError);
        }
      }

      navigate('/dashboard/forensics');
    } catch (error) {
      console.error('Erro ao salvar perícia:', error);
      alert('Erro ao salvar perícia. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <button 
        onClick={() => navigate('/dashboard/forensics')}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Camera className="text-federal-500" size={28} />
            Nova Perícia Técnica
          </h2>
          <p className="text-slate-400 mt-2">Registre laudos periciais de pessoas, locais ou veículos com evidências fotográficas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Título da Perícia</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="Ex: Homicídio na Praça Central"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Tipo de Perícia</label>
              <div className="grid grid-cols-3 gap-3">
                {['Pessoa', 'Local', 'Veículo'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, type})}
                    className={clsx(
                      "flex flex-col items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                      formData.type === type 
                        ? "bg-federal-600 border-federal-500 text-white shadow-lg shadow-federal-900/50" 
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700"
                    )}
                  >
                    {type === 'Pessoa' && <User size={20} />}
                    {type === 'Local' && <MapPin size={20} />}
                    {type === 'Veículo' && <Car size={20} />}
                    <span className="text-xs font-bold">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Link do YouTube (Opcional)</label>
              <div className="relative">
                <Youtube className="absolute left-4 top-3.5 text-slate-600" size={20} />
                <input
                  type="url"
                  value={formData.youtube_link}
                  onChange={(e) => setFormData({...formData, youtube_link: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Descrição Geral</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
                placeholder="Descreva o contexto geral da perícia..."
              />
            </div>
          </div>

          {/* Photos Section */}
          <div className="border-t border-slate-800 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="text-federal-500" size={24} />
                Galeria de Evidências
              </h3>
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2">
                <Plus size={18} />
                Adicionar Fotos
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </label>
            </div>

            {photos.length === 0 ? (
              <div className="bg-slate-950/50 border border-slate-800 border-dashed rounded-xl p-10 text-center">
                <Camera size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500">Nenhuma foto adicionada ainda.</p>
                <p className="text-slate-600 text-sm">Clique em "Adicionar Fotos" para incluir evidências.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-4 group">
                    <div className="w-24 h-24 bg-slate-900 rounded-lg shrink-0 overflow-hidden relative">
                      <img 
                        src={photo.preview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Descrição da Evidência
                      </label>
                      <textarea
                        value={photo.description}
                        onChange={(e) => handlePhotoDescriptionChange(photo.id, e.target.value)}
                        className="w-full h-16 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-federal-500 focus:outline-none resize-none"
                        placeholder={
                          formData.type === 'Pessoa' ? "Ex: Detalhe do ferimento..." :
                          formData.type === 'Local' ? "Ex: Visão geral da sala..." :
                          "Ex: Placa do veículo..."
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "bg-federal-600 hover:bg-federal-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Save size={20} />
              {loading ? 'Salvando...' : 'Registrar Perícia'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegisterForensics;
