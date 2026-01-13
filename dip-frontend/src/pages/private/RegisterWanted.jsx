import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Eraser, User, FileText, Camera, CheckCircle, AlertCircle, Shield, Siren, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import ImageUploadArea from '../../components/ImageUploadArea';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';

const RegisterWanted = () => {
  const navigate = useNavigate();
  const { discordConfig } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    reason: '',
    dangerLevel: 'Baixa',
    officer: '',
    observations: '',
  });

  const [images, setImages] = useState({
    proof1: null,
    proof2: null,
    proof3: null,
    proof4: null
  });

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (id, dataUrl) => {
    setImages(prev => ({ ...prev, [id]: dataUrl }));
  };

  const handleImageRemove = (id) => {
    setImages(prev => ({ ...prev, [id]: null }));
  };

  const isFormValid = () => {
    return images.proof1 && 
           formData.name && formData.document && formData.reason && 
           formData.dangerLevel && formData.officer;
  };

  const dataURLtoBlob = (dataurl) => {
    if (!dataurl) return null;
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!images.proof1) {
      setNotification({
        type: 'error',
        message: 'A Prova 1 (Foto Principal) é obrigatória.'
      });
      return;
    }

    setLoading(true);

    try {
      // 0. Get User
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Upload Photo to Supabase Storage
      const fileBlob = dataURLtoBlob(images.proof1);
      const sanitizedDoc = formData.document.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `wanted/${Date.now()}_${sanitizedDoc}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('procurados')
        .upload(fileName, fileBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('procurados').getPublicUrl(fileName);

      // 2. Insert Data into Database
      const { error: insertError } = await supabase
        .from('procurados')
        .insert([{
          nome: formData.name,
          documento: formData.document,
          motivo: formData.reason,
          periculosidade: formData.dangerLevel,
          observacoes: formData.observations,
          status: 'Procurado',
          foto_principal: publicUrl,
          created_by: user?.id
        }]);

      if (insertError) throw insertError;

      // 3. Log Action
      await supabase.from('system_logs').insert([{
        user_id: user?.id,
        action: 'Novo Procurado',
        details: `Procurado cadastrado: ${formData.name} (Periculosidade: ${formData.dangerLevel})`
      }]);

      // 4. Send Discord Notification
      if (discordConfig?.wantedWebhook) {
        try {
          const embed = {
            title: "⚠️ NOVO PROCURADO REGISTRADO",
            description: `**${formData.name}** foi adicionado à lista de procurados.`,
            color: 0xdc2626, // Red
            thumbnail: { url: publicUrl },
            fields: [
              { name: "Periculosidade", value: formData.dangerLevel, inline: true },
              { name: "Motivo", value: formData.reason, inline: true },
              { name: "Documento", value: formData.document },
              { name: "Observações", value: formData.observations || 'Nenhuma' },
              { name: "Policial Responsável", value: formData.officer }
            ],
            footer: { text: "Sistema de Procurados DPF" },
            timestamp: new Date().toISOString()
          };
          
          await fetch(discordConfig.wantedWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
          });
        } catch (err) {
          console.error("Erro ao enviar webhook Discord:", err);
        }
      }

      setNotification({
        type: 'success',
        message: 'Procurado registrado com sucesso!'
      });

      setTimeout(() => {
        setNotification(null);
        navigate('/dashboard/wanted-list');
      }, 2000);

    } catch (error) {
      console.error('Erro ao registrar procurado:', error);
      setNotification({
        type: 'error',
        message: `Erro ao registrar: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Siren className="text-red-500" size={32} />
            Registrar Procurado
          </h2>
          <p className="text-slate-400 mt-2">Adicione um novo indivíduo à lista de procurados da Polícia Federal.</p>
        </div>
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Photos */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm sticky top-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Camera className="text-federal-400" size={20} />
              Provas Fotográficas
            </h3>
            
            <div className="space-y-6">
              <ImageUploadArea 
                id="proof1" 
                label="Foto 1 - Prova Principal" 
                image={images.proof1} 
                onUpload={handleImageUpload} 
                onRemove={handleImageRemove}
                required 
                aspect={1}
              />
              <ImageUploadArea 
                id="proof2" 
                label="Foto 2 - Prova Adicional" 
                image={images.proof2} 
                onUpload={handleImageUpload} 
                onRemove={handleImageRemove}
              />
              <ImageUploadArea 
                id="proof3" 
                label="Foto 3 - Prova Adicional" 
                image={images.proof3} 
                onUpload={handleImageUpload} 
                onRemove={handleImageRemove}
              />
              <ImageUploadArea 
                id="proof4" 
                label="Foto 4 - Prova Adicional" 
                image={images.proof4} 
                onUpload={handleImageUpload} 
                onRemove={handleImageRemove}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Form Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 pb-4 border-b border-slate-800">
              <User size={20} className="text-federal-500" />
              Dados do Indivíduo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nome do Procurado</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Nome completo ou alcunha"
                  required
                />
              </div>

              {/* Documento */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Documento / ID</label>
                <input
                  type="text"
                  name="document"
                  value={formData.document}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="000000"
                  required
                />
              </div>

              {/* Periculosidade */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nível de Periculosidade</label>
                <div className="relative">
                   <AlertTriangle className="absolute left-4 top-3.5 text-slate-600" size={20} />
                   <select
                    name="dangerLevel"
                    value={formData.dangerLevel}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none appearance-none"
                    required
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Extrema">Extrema</option>
                  </select>
                </div>
              </div>

              {/* Oficial */}
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

              {/* Motivo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Motivo da Procura</label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Ex: Mandado de prisão em aberto, fuga..."
                  required
                />
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Observações</label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
                  placeholder="Detalhes adicionais, locais prováveis, cúmplices..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-8 mt-8 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setFormData({ name: '', document: '', reason: '', dangerLevel: 'Baixa', officer: '', observations: '' });
                  setImages({ proof1: null, proof2: null, proof3: null, proof4: null });
                }}
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
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/50 hover:shadow-red-600/20 transform hover:-translate-y-0.5" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                )}
              >
                <Save size={18} />
                Registrar Procurado
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterWanted;
