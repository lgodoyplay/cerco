import React, { useState, useEffect } from 'react';
import { Save, Eraser, FileText, CheckCircle, AlertCircle, Shield, MapPin, Calendar, User, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../../lib/supabase';
import { useSettingsContext } from '../../context/SettingsContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import NotificationBanner from '../../components/feedback/NotificationBanner';

const RegisterBO = () => {
  const navigate = useNavigate();
  const { logAction, discordConfig } = useSettingsContext();
  const { can } = usePermissions();
  const [reformulating, setReformulating] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Protect route
  if (!can('bo_manage')) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <Shield size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
        <p>Você não tem permissão para registrar boletins.</p>
        <button 
          onClick={() => navigate('/dashboard/bo')}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  // Function to reformulate text with AI
  const reformulateDescription = async () => {
    if (!formData.description.trim()) return;
    try {
      setReformulating(true);
      const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
      if (!OPENAI_API_KEY) {
        setNotification({ type: 'warning', message: 'Chave da API OpenAI nao configurada.' });
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
              content: 'Você é um assistente de polícia que reformula descrições de ocorrências para serem mais adequadas a registros oficiais de boletim de ocorrência. Use linguagem formal, clara e detalhada.'
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
      setNotification({ type: 'error', message: 'Erro ao reformular a descricao. Tente novamente.' });
    } finally {
      setReformulating(false);
    }
  };

  const [formData, setFormData] = useState({
    complainant: '',
    description: '',
    location: '',
    date: '',
    officer: '',
    arrestOfficerName: '',
    arrestOfficerId: '',
  });

  // Auto-fill current date and time on component load
  useEffect(() => {
    const now = new Date();
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const formattedDate = now.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, date: formattedDate }));
  }, []);

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!notification) return undefined;

    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.complainant.trim()) {
      errors.complainant = 'Nome do comunicante é obrigatório';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Descrição da ocorrência é obrigatória';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Local da ocorrência é obrigatório';
    }
    
    if (!formData.date) {
      errors.date = 'Data e hora do fato são obrigatórios';
    } else {
      const factDate = new Date(formData.date);
      const now = new Date();
      if (factDate > now) {
        errors.date = 'Data e hora do fato não podem ser futuras';
      }
    }
    
    if (!formData.officer.trim()) {
      errors.officer = 'Nome do policial responsável é obrigatório';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Auto-fill policial_responsavel from user if possible, or keep what user typed
      const officerName = formData.officer || (user?.email || user?.id || '');

      const { data, error } = await supabase
        .from('boletins')
        .insert([{
          comunicante: formData.complainant,
          descricao: formData.description,
          localizacao: formData.location,
          data_fato: formData.date,
          policial_responsavel: officerName,
          nome_policial_prisao: formData.arrestOfficerName,
          id_policial_prisao: formData.arrestOfficerId,
          status: 'Registrado',
          created_by: user?.id
        }])
        .select('*');

      if (error) throw error;
      const newBO = data[0];

      // Log action
      logAction('CREATE_BO', 'boletins', newBO.id, null, newBO);

      // Send Discord Notification
      if (discordConfig?.bulletinsWebhook) {
        try {
          const embed = {
            title: "📄 Novo Boletim de Ocorrência",
            description: formData.description,
            color: 0x9333ea, // Purple
            fields: [
              { name: "Comunicante", value: formData.complainant, inline: true },
              { name: "Local", value: formData.location, inline: true },
              { name: "Data e Hora do Fato", value: formData.date, inline: true },
              { name: "Policial Responsável pelo BO", value: officerName, inline: true },
              ...(formData.arrestOfficerName ? [{ name: "Policial Responsável pela Prisão", value: `${formData.arrestOfficerName} (${formData.arrestOfficerId || 'ID não informado'})`, inline: true }] : [])
            ],
            footer: { text: "Sistema de Ocorrências CIVIL EUFORIA" },
            timestamp: new Date().toISOString()
          };
          
          await fetch(discordConfig.bulletinsWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
          });
        } catch (err) {
          console.error("Erro ao enviar webhook Discord:", err);
        }
      }

      // Success
      setNotification({
        type: 'success',
        message: 'Boletim de ocorrência registrado com sucesso'
      });
      
      // Clear form and reset date to current time
      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 16);
      setFormData({
        complainant: '',
        description: '',
        location: '',
        date: formattedDate,
        officer: '',
        arrestOfficerName: '',
        arrestOfficerId: '',
      });
      setFormErrors({});
    } catch (error) {
      console.error('Erro ao registrar BO:', error);
      setNotification({
        type: 'error',
        message: 'Erro ao registrar boletim: ' + error.message
      });
    } finally {
      setLoading(false);
    }
    
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

      <NotificationBanner
        notification={notification}
        onClose={() => setNotification(null)}
        className="mb-6"
      />

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
                className={clsx(
                  "w-full pl-12 pr-4 py-3 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all",
                  formErrors.complainant 
                    ? "border border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                    : "border border-slate-700 focus:border-federal-500 focus:ring-1 focus:ring-federal-500"
                )}
                placeholder="Quem está reportando o fato?"
              />
            </div>
            {formErrors.complainant && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {formErrors.complainant}
              </p>
            )}
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
                className={clsx(
                  "w-full pl-12 pr-4 py-3 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all",
                  formErrors.location 
                    ? "border border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                    : "border border-slate-700 focus:border-federal-500 focus:ring-1 focus:ring-federal-500"
                )}
                placeholder="Endereço ou Ponto de Referência"
              />
            </div>
            {formErrors.location && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {formErrors.location}
              </p>
            )}
          </div>

          {/* Data e Hora */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Data e Hora do Fato</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-3.5 text-slate-600" size={20} />
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={clsx(
                  "w-full pl-12 pr-4 py-3 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all",
                  formErrors.date 
                    ? "border border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                    : "border border-slate-700 focus:border-federal-500 focus:ring-1 focus:ring-federal-500"
                )}
              />
            </div>
            {formErrors.date && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {formErrors.date}
              </p>
            )}
          </div>

          {/* Nome do Policial Responsável pela Prisão em Flagrante */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Nome do Policial Responsável pela Prisão em Flagrante
              <span className="text-slate-500 ml-1">(Opcional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-600" size={20} />
              <input
                type="text"
                name="arrestOfficerName"
                value={formData.arrestOfficerName}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="Nome completo do policial"
              />
            </div>
          </div>

          {/* ID do Policial Responsável pela Prisão em Flagrante */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              ID/Distintivo do Policial Responsável pela Prisão em Flagrante
              <span className="text-slate-500 ml-1">(Opcional)</span>
            </label>
            <div className="relative">
              <Shield className="absolute left-4 top-3.5 text-slate-600" size={20} />
              <input
                type="text"
                name="arrestOfficerId"
                value={formData.arrestOfficerId}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="Distintivo ou ID"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição da Ocorrência</label>
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
              rows={6}
              className={clsx(
                "w-full px-4 py-3 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all resize-none",
                formErrors.description 
                  ? "border border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                  : "border border-slate-700 focus:border-federal-500 focus:ring-1 focus:ring-federal-500"
              )}
              placeholder="Descreva detalhadamente o que aconteceu..."
            />
            {formErrors.description && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {formErrors.description}
              </p>
            )}
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
                className={clsx(
                  "w-full pl-12 pr-4 py-3 bg-slate-950 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-all",
                  formErrors.officer 
                    ? "border border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                    : "border border-slate-700 focus:border-federal-500 focus:ring-1 focus:ring-federal-500"
                )}
                placeholder="Seu nome ou distintivo"
              />
            </div>
            {formErrors.officer && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {formErrors.officer}
              </p>
            )}
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const formattedDate = now.toISOString().slice(0, 16);
              setFormData({ 
                complainant: '', 
                description: '', 
                location: '', 
                date: formattedDate, 
                officer: '',
                arrestOfficerName: '',
                arrestOfficerId: '',
              });
              setFormErrors({});
            }}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Eraser size={18} />
            Limpar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className={clsx(
              "px-8 py-3 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2",
              !loading 
                ? "bg-federal-600 hover:bg-federal-500 text-white shadow-federal-900/50 hover:shadow-federal-600/20 transform hover:-translate-y-0.5" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
            )}
          >
            <FileText size={18} />
            {loading ? 'Registrando...' : 'Registrar BO'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default RegisterBO;
