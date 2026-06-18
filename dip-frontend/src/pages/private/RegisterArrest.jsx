import React, { useState, useRef, useEffect } from 'react';
import { Save, Eraser, User, FileText, Camera, CheckCircle, AlertCircle, Shield, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate, useLocation } from 'react-router-dom';
import ImageUploadArea from '../../components/ImageUploadArea';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import { usePermissions } from '../../hooks/usePermissions';

const RegisterArrest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { discordConfig, crimes = [] } = useSettings(); // Ensure crimes is always an array
  const { can } = usePermissions();
  const prefillData = location.state?.wantedPerson;
  const [reformulating, setReformulating] = useState(false);

  // Function to reformulate text with AI
  const reformulateDescription = async () => {
    if (!formData.description.trim()) return;
    try {
      setReformulating(true);
      const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      if (!OPENAI_API_KEY) {
        alert('Chave da API OpenAI não configurada!');
        return;
      }
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente de polícia que reformula descrições de prisões e ocorrências para serem mais adequadas a registros de boletim de ocorrência. Use linguagem formal, clara e detalhada.'
            },
            {
              role: 'user',
              content: `Reformule a seguinte descrição para um registro de BO:\n\n${formData.description}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) throw new Error('Erro na API de IA');
      const data = await response.json();
      const reformulated = data.choices[0]?.message?.content || formData.description;
      setFormData(prev => ({ ...prev, description: reformulated }));
    } catch (error) {
      console.error('Erro ao reformular:', error);
      alert('Erro ao reformular a descrição. Tente novamente.');
    } finally {
      setReformulating(false);
    }
  };

  // Protect route
  if (!can('arrest_manage')) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <Shield size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
        <p>Você não tem permissão para registrar prisões.</p>
        <button 
          onClick={() => navigate('/dashboard/arrests')}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    name: prefillData?.name || '',
    passport: prefillData?.document || '',
    reason: prefillData?.reason || '',
    articles: '',
    selectedArticles: [],
    officer: '',
    description: prefillData ? `Prisão realizada a partir de mandado de busca. Motivo original: ${prefillData.reason}` : '',
    broughtByOtherPolice: false,
  });
  
  const [isArticlesDropdownOpen, setIsArticlesDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsArticlesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleArticleChange = (articleId) => {
    setFormData(prev => {
      const isSelected = prev.selectedArticles.includes(articleId);
      const newSelectedArticles = isSelected
        ? prev.selectedArticles.filter(id => id !== articleId)
        : [...prev.selectedArticles, articleId];
      
      // Generate articles string like "Art. 121, Art. 157"
      const articlesString = newSelectedArticles
        .map(id => crimes.find(c => c && c.id === id)) // Fix: ensure c exists before accessing c.id
        .filter(Boolean)
        .map(crime => `Art. ${crime.article}`)
        .join(', ');

      return {
        ...prev,
        selectedArticles: newSelectedArticles,
        articles: articlesString
      };
    });
  };

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
    if (formData.broughtByOtherPolice) {
      return formData.name && formData.passport && formData.articles && formData.officer;
    }
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
    
    if (!formData.broughtByOtherPolice && !images.face) {
      setNotification({ type: 'error', message: 'A foto do rosto é obrigatória.' });
      return;
    }

    setLoading(true);

    try {
      // 0. Get User
      const { data: { user } } = await supabase.auth.getUser();

      let publicUrl = null;

      // 1. Upload Image to Supabase Storage (Face is mandatory unless brought by other police)
      if (!formData.broughtByOtherPolice && images.face) {
        const fileBlob = dataURLtoBlob(images.face);
        const sanitizedDoc = formData.passport.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `arrests/${Date.now()}_${sanitizedDoc}_face.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('prisoes')
          .upload(fileName, fileBlob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage.from('prisoes').getPublicUrl(fileName);
        publicUrl = url;
      }

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
          conduzido_por_outra_policia: formData.broughtByOtherPolice,
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

      // 3.1 If this was a wanted person, remove from wanted list
      if (prefillData?.id) {
        const { error: deleteError } = await supabase
          .from('procurados')
          .delete()
          .eq('id', prefillData.id);

        if (deleteError) {
          console.error('Error removing from wanted list:', deleteError);
        } else if (user) {
          await supabase.from('system_logs').insert([{
            user_id: user.id,
            action: 'Procurado Preso',
            details: `Procurado ${formData.name} removido da lista após prisão.`
          }]);
        }
      }

      // 4. Send Discord Notification
      if (discordConfig?.arrestsWebhook) {
        try {
          const embed = {
            title: "🚨 Nova Prisão Registrada",
            color: 0xea580c, // Orange
            thumbnail: { url: publicUrl },
            fields: [
              { name: "Detento", value: formData.name, inline: true },
              { name: "Documento", value: formData.passport, inline: true },
              { name: "Artigos", value: formData.articles },
              { name: "Motivo", value: formData.reason },
              { name: "Oficial Responsável", value: formData.officer, inline: true }
            ],
            footer: { text: "Sistema Prisional CIVIL EUFORIA" },
            timestamp: new Date().toISOString()
          };
          
          await fetch(discordConfig.arrestsWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
          });
        } catch (err) {
          console.error("Erro ao enviar webhook Discord:", err);
        }
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
                required={!formData.broughtByOtherPolice}
                aspect={1}
                // forceAspect={true} // Removido para dar liberdade
              />
              <ImageUploadArea 
                id="bag" 
                label="Foto da Bolsa" 
                image={images.bag} 
                onUpload={handleImageUpload} 
                onRemove={handleImageRemove}
                required={!formData.broughtByOtherPolice}
              />
              <ImageUploadArea 
                id="tablet" 
                label="Foto do Tablet" 
                image={images.tablet} 
                onUpload={handleImageUpload} 
                onRemove={handleImageRemove}
                required={!formData.broughtByOtherPolice}
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

              {/* Conduzido por outra polícia */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-700 rounded-xl cursor-pointer hover:border-federal-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.broughtByOtherPolice}
                    onChange={(e) => setFormData(prev => ({ ...prev, broughtByOtherPolice: e.target.checked }))}
                    className="w-5 h-5 text-federal-600 rounded border-slate-600 focus:ring-federal-500"
                  />
                  <div>
                    <div className="text-slate-100 font-medium">Conduzido por outra polícia</div>
                    <div className="text-xs text-slate-500">Marque esta opção se o indivíduo foi trazido por uma força policial diferente da civil (fotos obrigatórias não são necessárias)</div>
                  </div>
                </label>
              </div>

              {/* Artigos */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Artigos Aplicados</label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsArticlesDropdownOpen(!isArticlesDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 transition-all hover:border-federal-500"
                  >
                    <span>
                      {formData.selectedArticles.length > 0
                        ? `${formData.selectedArticles.length} artigo(s) selecionado(s)`
                        : 'Selecione os artigos aplicados'}
                    </span>
                    {isArticlesDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {isArticlesDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {crimes.filter(crime => crime && crime.id).map(crime => ( // Filter out any invalid crimes
                          <label
                            key={crime.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedArticles.includes(crime.id)}
                              onChange={() => handleArticleChange(crime.id)}
                              className="w-5 h-5 text-federal-600 rounded border-slate-600 focus:ring-federal-500"
                            />
                            <div>
                              <div className="text-slate-100 font-medium">Art. {crime.article}</div>
                              <div className="text-xs text-slate-500">{crime.name}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      {formData.articles && (
                        <div className="p-3 border-t border-slate-800">
                          <div className="text-xs text-slate-500 mb-1">Selecionados:</div>
                          <div className="text-sm text-federal-400 font-mono">{formData.articles}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.articles && !isArticlesDropdownOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Selecionados:</div>
                    <div className="text-sm text-federal-400 font-mono">{formData.articles}</div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</label>
                  <button
                    type="button"
                    onClick={reformulateDescription}
                    disabled={reformulating || !formData.description.trim()}
                    className="flex items-center gap-2 text-xs font-bold text-federal-400 hover:text-federal-300 disabled:text-slate-600 transition-colors"
                  >
                    <RefreshCw size={14} className={clsx(reformulating && "animate-spin")} />
                    {reformulating ? 'Reformulando...' : 'Reformular Resposta'}
                  </button>
                </div>
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
                disabled={!isFormValid() || loading}
                className={clsx(
                  "px-8 py-3 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2",
                  (isFormValid() && !loading)
                    ? "bg-federal-600 hover:bg-federal-500 text-white shadow-federal-900/50 hover:shadow-federal-600/20 transform hover:-translate-y-0.5" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                )}
              >
                {loading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                {loading ? 'Registrando...' : 'Registrar Prisão'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterArrest;
