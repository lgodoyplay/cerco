import React, { useState } from 'react';
import { Save, Eraser, User, FileText, Camera, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import ImageUploadArea from '../../components/ImageUploadArea';
import { supabase } from '../../lib/supabase';

const RegisterArrest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    passport: '',
    reason: '',
    articles: '',
    officer: '',
    description: '',
  });

  const [images, setImages] = useState({
    face: null,
    bag: null,
    tablet: null,
    approach: null
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

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
    return formData.name && formData.passport && formData.articles && formData.officer && images.face;
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
    
    if (!images.face) {
      setNotification({ type: 'error', message: 'A foto do rosto é obrigatória.' });
      return;
    }

    setLoading(true);

    try {
      // 0. Get User
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Upload Image to Supabase Storage (Face is mandatory)
      const fileBlob = dataURLtoBlob(images.face);
      const sanitizedDoc = formData.passport.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `arrests/${Date.now()}_${sanitizedDoc}_face.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prisoes')
        .upload(fileName, fileBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('prisoes').getPublicUrl(fileName);

      // 2. Insert Data into Database
      const { error: insertError } = await supabase
        .from('prisoes')
        .insert([{
          nome: formData.name,
          documento: formData.passport,
          artigo: formData.articles,
          data_prisao: new Date().toISOString(),
          status: 'Preso',
          foto_principal: publicUrl,
          conduzido_por: formData.officer,
          observacoes: formData.description,
          created_by: user?.id
        }]);

      if (insertError) throw insertError;

      // 3. Log Action
      if (user) {
        await supabase.from('system_logs').insert([{
          user_id: user.id,
          action: 'Nova Prisão',
          details: `Prisão registrada: ${formData.name} (Art. ${formData.articles})`
        }]);
      }

      setNotification({ type: 'success', message: 'Prisão registrada com sucesso!' });
      setTimeout(() => navigate('/dashboard/arrests'), 2000); // Fixed redirect path

    } catch (error) {
      console.error('Erro ao registrar prisão:', error);
      setNotification({ type: 'error', message: `Erro ao registrar: ${error.message}` });
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
            <Shield className="text-federal-500" size={32} />
            Registrar Prisão
          </h2>
          <p className="text-slate-400 mt-2">Preencha o formulário e anexe as provas necessárias para o fichamento.</p>
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
                id="face" 
                label="Foto do Rosto" 
                image={images.face} 
                onUpload={handleImageUpload} 
                onRemove={handleImageRemove}
                required 
              />
              <ImageUploadArea 
                id="bag" 
                label="Foto da Bolsa" 
                image={images.bag} 
                onUpload={handleImageUpload} 
                onRemove={handleImageRemove}
                required 
              />
              <ImageUploadArea 
                id="tablet" 
                label="Foto do Tablet" 
                image={images.tablet} 
                onUpload={handleImageUpload} 
                onRemove={handleImageRemove}
                required 
              />
              <ImageUploadArea 
                id="approach" 
                label="Bolsa na Abordagem" 
                image={images.approach} 
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
              Dados do Detento e Ocorrência
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nome do Indivíduo</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Nome completo do cidadão"
                  required
                />
              </div>

              {/* Documento */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Documento / RG</label>
                <input
                  type="text"
                  name="passport"
                  value={formData.passport}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="000000"
                  required
                />
              </div>

              {/* Oficial */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Oficial Responsável</label>
                <input
                  type="text"
                  name="officer"
                  value={formData.officer}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Seu nome ou badge"
                  required
                />
              </div>

              {/* Motivo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Motivo da Prisão</label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Ex: Tentativa de Homicídio, Roubo a Banco..."
                  required
                />
              </div>

              {/* Artigos */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Artigos Aplicados</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3.5 text-slate-600" size={20} />
                  <input
                    type="text"
                    name="articles"
                    value={formData.articles}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                    placeholder="Art. 157, Art. 121, Art. 33..."
                    required
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Observações</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
                  placeholder="Detalhes adicionais sobre a abordagem, itens apreendidos ou comportamento do indivíduo..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-8 mt-8 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setFormData({ name: '', passport: '', reason: '', articles: '', officer: '', description: '' });
                  setImages({ face: null, bag: null, tablet: null, approach: null });
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
                    ? "bg-federal-600 hover:bg-federal-500 text-white shadow-federal-900/50 hover:shadow-federal-600/20 transform hover:-translate-y-0.5" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                )}
              >
                <Save size={18} />
                Registrar Prisão
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterArrest;
