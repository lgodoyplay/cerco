import React, { useState } from 'react';
import { Shield, Send, FileText, Upload, CheckCircle, AlertCircle, X, Link as LinkIcon, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import { createBaseWebhookEmbed, formatWebhookAttachments, postWebhookEmbed } from '../../utils/discordWebhook';

const normalizeExternalUrl = (value = '') => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const Corregedoria = () => {
  const { discordConfig } = useSettings();
  const [formData, setFormData] = useState({
    nome: '',
    detalhes: '',
  });
  const [items, setItems] = useState([]); // Array of { type: 'file' | 'link', ... }
  const [linkInput, setLinkInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [notification, setNotification] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newItems = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      type: 'file',
      file,
      preview: URL.createObjectURL(file),
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  const addLink = () => {
    if (!linkInput.trim()) return;
    const newItem = {
      id: Date.now() + Math.random(),
      type: 'link',
      url: linkInput.trim(),
    };
    setItems(prev => [...prev, newItem]);
    setLinkInput('');
  };

  const removeItem = (id) => {
    setItems(prev => {
      const itemToRemove = prev.find(item => item.id === id);
      if (itemToRemove?.type === 'file' && itemToRemove?.preview) {
        URL.revokeObjectURL(itemToRemove.preview);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const uploadFiles = async () => {
    const fileItems = items.filter(item => item.type === 'file');
    const uploadedItems = [];
    for (const f of fileItems) {
      const fileExt = f.file.name.split('.').pop();
      const fileName = `corregedoria/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('public').upload(fileName, f.file);
      if (error) {
        throw error;
      } else {
        const { data: publicUrlData } = supabase.storage.from('public').getPublicUrl(fileName);
        uploadedItems.push({
          title: f.file.name,
          url: publicUrlData.publicUrl
        });
      }
    }
    const linkItems = items
      .filter(item => item.type === 'link')
      .map(item => ({
        title: item.url.trim(),
        url: normalizeExternalUrl(item.url.trim())
      }))
      .filter(item => item.url);

    return [...uploadedItems, ...linkItems];
  };

  const sendCorregedoriaWebhook = async ({ nome, detalhes, anexos }) => {
    if (!discordConfig?.corregedoriaWebhook) return;

    try {
      const embed = createBaseWebhookEmbed({
        title: 'Corregedoria - Nova Denuncia',
        description: detalhes,
        color: 0xdc2626,
        actorName: nome,
        footerText: 'Sistema CIVIL EUFORIA - Corregedoria',
        fields: [
          { name: 'Origem', value: 'Formulario publico', inline: true },
          { name: 'Anexos / Provas', value: formatWebhookAttachments(anexos), inline: false }
        ]
      });

      await postWebhookEmbed(discordConfig.corregedoriaWebhook, embed);
    } catch (webhookError) {
      console.error('Erro ao enviar webhook da corregedoria:', webhookError);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nome = formData.nome.trim();
    const detalhes = formData.detalhes.trim();

    if (!nome) {
      setStatus('error');
      setNotification({ type: 'error', message: 'Informe o nome para enviar a denuncia.' });
      return;
    }

    if (!detalhes) {
      setStatus('error');
      setNotification({ type: 'error', message: 'Informe os detalhes da denuncia.' });
      return;
    }

    setStatus('submitting');

    try {
      const uploadedItems = await uploadFiles();
      const arquivos = uploadedItems
        .map((item) => item.url.trim())
      .filter(Boolean);

      const { error } = await supabase.from('corregedoria').insert([{
        nome,
        detalhes,
        arquivos,
      }]);
      if (error) throw error;

      await sendCorregedoriaWebhook({ nome, detalhes, anexos: uploadedItems });

      setStatus('success');
      setNotification({ type: 'success', message: 'Denúncia enviada com sucesso!' });
      setFormData({ nome: '', detalhes: '' });
      setItems([]);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Error submitting:', err);
      setStatus('error');
      setNotification({ type: 'error', message: 'Erro ao enviar denúncia. Tente novamente.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-red-700/20 border border-red-600/50 flex items-center justify-center">
              <Shield size={36} className="text-red-500" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Corregedoria
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Envie denúncias, provas e informações diretamente para a Corregedoria da CIVIL EUFORIA.
            Sua colaboração é fundamental para mantermos a integridade da instituição.
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={clsx(
            "fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3",
            notification.type === 'success' ? "bg-emerald-900/90 border-emerald-500 text-emerald-100" : "bg-red-900/90 border-red-500 text-red-100"
          )}>
            {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            <div>
              <h4 className="font-bold">{notification.type === 'success' ? 'Sucesso!' : 'Erro!'}</h4>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Seu Nome
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full px-6 py-4 bg-slate-950 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Detalhes da Denúncia
              </label>
              <textarea
                value={formData.detalhes}
                onChange={(e) => setFormData(prev => ({ ...prev, detalhes: e.target.value }))}
                rows={6}
                className="w-full px-6 py-4 bg-slate-950 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none"
                placeholder="Descreva detalhadamente o que aconteceu..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Add File */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Adicionar Arquivo
                </label>
                <label className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-red-600 transition-colors">
                  <Upload size={24} className="text-slate-500" />
                  <div className="text-center">
                    <p className="text-slate-300 font-medium">Selecionar arquivo</p>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,.pdf,.doc,.docx,.txt" />
                </label>
              </div>

              {/* Add Link */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Adicionar Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                    className="flex-1 px-4 py-4 bg-slate-950 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                    placeholder="Cole qualquer link"
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    disabled={!linkInput.trim()}
                    className="px-4 py-4 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div key={item.id} className="relative bg-slate-950 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                    {item.type === 'file' ? (
                      item.file.type.startsWith('image/') ? (
                        <img src={item.preview} alt={item.file.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                          <FileText size={20} className="text-slate-400" />
                        </div>
                      )
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                        <LinkIcon size={20} className="text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {item.type === 'file' ? (
                        <>
                          <p className="text-sm text-white truncate">{item.file.name}</p>
                          <p className="text-xs text-slate-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <a href={normalizeExternalUrl(item.url)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 truncate hover:underline">
                          {item.url}
                        </a>
                      )}
                    </div>
                    <button type="button" onClick={() => removeItem(item.id)} className="p-1 hover:bg-slate-800 rounded">
                      <X size={18} className="text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className={clsx(
                "w-full py-4 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3",
                status === 'success' ? "bg-emerald-600 text-white" : 
                status === 'error' ? "bg-red-700 text-white" :
                "bg-red-700 hover:bg-red-600 text-white"
              )}
            >
              {status === 'submitting' ? (
                <span className="animate-spin">⌛</span>
              ) : status === 'success' ? (
                <>
                  <CheckCircle size={22} />
                  Enviado com sucesso!
                </>
              ) : (
                <>
                  <Send size={22} />
                  Enviar para Corregedoria
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Corregedoria;
