import React, { useState } from 'react';
import { Shield, Send, FileText, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '../../lib/supabase';

const Corregedoria = () => {
  const [formData, setFormData] = useState({
    nome: '',
    detalhes: '',
  });
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [notification, setNotification] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    const uploadedUrls = [];
    for (const f of files) {
      const fileExt = f.file.name.split('.').pop();
      const fileName = `corregedoria/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('public').upload(fileName, f.file);
      if (error) {
        console.error('Upload error:', error);
      } else {
        const { data: publicUrlData } = supabase.storage.from('public').getPublicUrl(fileName);
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const fileUrls = await uploadFiles();
      const { error } = await supabase.from('corregedoria').insert([{
        nome: formData.nome,
        detalhes: formData.detalhes,
        arquivos: fileUrls,
      }]);
      if (error) throw error;

      setStatus('success');
      setNotification({ type: 'success', message: 'Denúncia enviada com sucesso!' });
      setFormData({ nome: '', detalhes: '' });
      setFiles([]);
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
                placeholder="Seu nome completo (opcional)"
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

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Provas (Imagens, Vídeos, Documentos - Múltiplos arquivos permitidos)
              </label>
              <label className="flex items-center justify-center gap-3 px-6 py-8 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-red-600 transition-colors">
                <Upload size={28} className="text-slate-500" />
                <div className="text-center">
                  <p className="text-slate-300 font-medium">Clique para selecionar arquivos</p>
                  <p className="text-xs text-slate-500">Arraste e solte arquivos aqui</p>
                </div>
                <input type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*,video/*,.pdf,.doc,.docx,.txt" />
              </label>

              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((fileObj) => (
                    <div key={fileObj.id} className="relative bg-slate-950 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                      {fileObj.file.type.startsWith('image/') ? (
                        <img src={fileObj.preview} alt={fileObj.file.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                          <FileText size={20} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{fileObj.file.name}</p>
                        <p className="text-xs text-slate-500">{(fileObj.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button type="button" onClick={() => removeFile(fileObj.id)} className="p-1 hover:bg-slate-800 rounded">
                        <X size={18} className="text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
