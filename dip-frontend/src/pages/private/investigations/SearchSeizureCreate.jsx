import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { useAuth } from '../../../context/AuthContext';
import { Save, ArrowLeft, AlertTriangle, CheckCircle, X } from 'lucide-react';
import ImageUploadArea from '../../../components/ImageUploadArea';
import FileUploadArea from '../../../components/FileUploadArea';
import { useSettings } from '../../../hooks/useSettings';
import { createBaseWebhookEmbed, formatWebhookAttachments, postWebhookEmbed, resolveWebhookActorName } from '../../../utils/discordWebhook';
import { uploadSearchSeizureFiles } from '../../../utils/searchSeizureStorage';
import clsx from 'clsx';

const SearchSeizureCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addInvestigation, getInvestigation, editInvestigation, updateSearchSeizureData } = useInvestigations();
  const { user } = useAuth();
  const { discordConfig } = useSettings();
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Média',
    tipoEntidade: 'pessoa',
    nomeEntidade: '',
    documentoPessoa: '',
    fotoRosto: null,
    documentoOrdem: null,
    quantidadeCasas: 0,
    quantidadeCarros: 0,
    nomesCarros: [],
    casas: [],
    carros: []
  });

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const inv = await getInvestigation(id);
      if (inv) {
        setFormData({
          title: inv.title,
          description: inv.description,
          priority: inv.priority,
          tipoEntidade: inv.tipoEntidade || 'pessoa',
          nomeEntidade: inv.nomeEntidade || '',
          documentoPessoa: inv.documentoPessoa || '',
          fotoRosto: inv.fotoRosto || null,
          documentoOrdem: inv.documentoOrdem || null,
          quantidadeCasas: inv.quantidadeCasas || 0,
          quantidadeCarros: inv.quantidadeCarros || 0,
          nomesCarros: inv.nomesCarros || [],
          casas: inv.casas || [],
          carros: inv.carros || []
        });
      } else {
        navigate('/dashboard/search-seizure');
      }
      setLoading(false);
    };
    fetchData();
  }, [id, getInvestigation, navigate]);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(t);
  }, [notification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuantidadeChange = (campo, valor) => {
    const num = parseInt(valor) || 0;
    setFormData(prev => {
      const newData = { ...prev, [campo]: num };
      if (campo === 'quantidadeCasas') {
        const newCasas = [...prev.casas];
        while (newCasas.length < num) newCasas.push({ id: Date.now() + Math.random(), objetos: '', fotoTranca: null, fotoInterior: null });
        newData.casas = newCasas.slice(0, num);
      } else if (campo === 'quantidadeCarros') {
        const newCarros = [...prev.carros];
        const newNomesCarros = [...(prev.nomesCarros || [])];
        while (newCarros.length < num) { newCarros.push({ id: Date.now() + Math.random(), objetos: '', fotoPortaMala: null }); newNomesCarros.push(''); }
        newData.carros = newCarros.slice(0, num);
        newData.nomesCarros = newNomesCarros.slice(0, num);
      }
      return newData;
    });
  };

  const handleCasaChange = (index, campo, valor) => {
    setFormData(prev => {
      const newCasas = [...prev.casas];
      newCasas[index] = { ...newCasas[index], [campo]: valor };
      return { ...prev, casas: newCasas };
    });
  };

  const handleCarroChange = (index, campo, valor) => {
    setFormData(prev => {
      const newCarros = [...prev.carros];
      const newNomesCarros = [...(prev.nomesCarros || [])];
      if (campo === 'nome') {
        newNomesCarros[index] = valor;
      } else {
        newCarros[index] = { ...newCarros[index], [campo]: valor };
      }
      return { ...prev, carros: newCarros, nomesCarros: newNomesCarros };
    });
  };

  const buildAttachments = (payload) => {
    const attachments = [];
    if (payload.documentoOrdem) attachments.push({ title: 'Documento da ordem', url: payload.documentoOrdem });
    if (payload.fotoRosto) attachments.push({ title: 'Foto do alvo', url: payload.fotoRosto });
    (payload.casas || []).forEach((casa, i) => {
      if (casa.fotoTranca) attachments.push({ title: `Casa ${i + 1} - Tranca`, url: casa.fotoTranca });
      if (casa.fotoInterior) attachments.push({ title: `Casa ${i + 1} - Interior`, url: casa.fotoInterior });
    });
    (payload.carros || []).forEach((carro, i) => {
      if (carro.fotoPortaMala) attachments.push({ title: `Carro ${i + 1} - Porta-malas`, url: carro.fotoPortaMala });
    });
    return attachments;
  };

  const sendWebhook = async (savedInvestigation, payload, isEditing) => {
    if (!discordConfig?.searchSeizureWebhook) return;
    try {
      const embed = createBaseWebhookEmbed({
        title: `Busca e Apreensão - ${isEditing ? 'Atualizada' : 'Nova Operação'}`,
        description: payload.description,
        color: 0x2563eb,
        actorName: resolveWebhookActorName(user),
        footerText: 'Sistema - Busca e Apreensão',
        fields: [
          { name: 'Título', value: payload.title, inline: true },
          { name: 'Tipo', value: payload.tipoEntidade === 'organizacao' ? 'Organização' : 'Pessoa', inline: true },
          { name: 'Nome', value: payload.nomeEntidade || 'Não informado', inline: true },
          { name: 'Prioridade', value: payload.priority, inline: true },
          { name: 'Casas', value: String(payload.quantidadeCasas || 0), inline: true },
          { name: 'Carros', value: String(payload.quantidadeCarros || 0), inline: true },
          { name: 'Documentos', value: formatWebhookAttachments(buildAttachments(savedInvestigation || payload)), inline: false }
        ]
      });
      await postWebhookEmbed(discordConfig.searchSeizureWebhook, embed);
    } catch (err) {
      console.error('Erro ao enviar webhook:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const uploaded = await uploadSearchSeizureFiles(formData);
      const payload = { ...uploaded, category: 'search_and_seizure' };

      let savedId = id;
      if (id) {
        await editInvestigation(id, payload);
        await updateSearchSeizureData(id, payload);
      } else {
        savedId = await addInvestigation(payload);
      }

      const savedInvestigation = savedId ? await getInvestigation(savedId) : null;
      await sendWebhook(savedInvestigation, payload, Boolean(id));
      navigate('/dashboard/search-seizure');
    } catch (error) {
      console.error('Erro ao salvar busca e apreensão:', error);
      setNotification({ type: 'error', message: error?.message || 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && id) {
    return (
      <div className="max-w-3xl mx-auto pb-10 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {notification && (
        <div className={clsx(
          "mb-6 rounded-2xl border px-4 py-3 flex items-start gap-3 shadow-lg",
          notification.type === 'success' ? "bg-emerald-950/70 border-emerald-500/30 text-emerald-100" : "bg-red-950/70 border-red-500/30 text-red-100"
        )}>
          {notification.type === 'success' ? <CheckCircle size={20} className="mt-0.5 shrink-0" /> : <AlertTriangle size={20} className="mt-0.5 shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold">{notification.type === 'success' ? 'Sucesso' : 'Erro'}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-current/80 hover:text-current transition-colors"><X size={18} /></button>
        </div>
      )}

      <button onClick={() => navigate('/dashboard/search-seizure')}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h2 className="text-2xl font-bold text-white">{id ? 'Editar' : 'Nova'} Busca e Apreensão</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Título da Operação</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              placeholder="Ex: Operação XYZ" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Descrição</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
              placeholder="Descrição da operação..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Prioridade</label>
              <select name="priority" value={formData.priority} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none">
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Tipo de Entidade</label>
              <select name="tipoEntidade" value={formData.tipoEntidade} onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none">
                <option value="pessoa">Pessoa</option>
                <option value="organizacao">Organização</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                {formData.tipoEntidade === 'pessoa' ? 'Nome Completo' : 'Nome da Organização'}
              </label>
              <input type="text" name="nomeEntidade" value={formData.nomeEntidade} onChange={handleChange} required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="Nome completo" />
            </div>
            {formData.tipoEntidade === 'pessoa' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Documento / Identificação</label>
                <input type="text" name="documentoPessoa" value={formData.documentoPessoa} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Documento de identificação" />
              </div>
            )}
          </div>

          {formData.tipoEntidade === 'pessoa' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Foto do Rosto</label>
              <ImageUploadArea id="fotoRosto" label="Foto do Rosto" image={formData.fotoRosto}
                onUpload={(_, url) => setFormData(prev => ({ ...prev, fotoRosto: url }))}
                onRemove={() => setFormData(prev => ({ ...prev, fotoRosto: null }))} aspect={1} />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Documento de Ordem (PDF/PNG)</label>
            <FileUploadArea id="documentoOrdem" label="Documento de Ordem" fileUrl={formData.documentoOrdem}
              onUpload={(_, url) => setFormData(prev => ({ ...prev, documentoOrdem: url }))}
              onRemove={() => setFormData(prev => ({ ...prev, documentoOrdem: null }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Quantidade de Casas</label>
              <input type="number" value={formData.quantidadeCasas} min="0"
                onChange={(e) => handleQuantidadeChange('quantidadeCasas', e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Quantidade de Carros</label>
              <input type="number" value={formData.quantidadeCarros} min="0"
                onChange={(e) => handleQuantidadeChange('quantidadeCarros', e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none" />
            </div>
          </div>

          {formData.quantidadeCasas > 0 && (
            <div className="space-y-6 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-bold text-white">Casas ({formData.quantidadeCasas})</h3>
              {formData.casas.map((casa, index) => (
                <div key={casa.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                  <h4 className="text-md font-bold text-slate-200 mb-4">Casa {index + 1}</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Objetos Apreendidos</label>
                      <textarea value={casa.objetos} onChange={(e) => handleCasaChange(index, 'objetos', e.target.value)} rows={3}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
                        placeholder="Descreva os objetos apreendidos..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ImageUploadArea id={`casa-${index}-tranca`} label="Foto da Tranca" image={casa.fotoTranca}
                        onUpload={(_, url) => handleCasaChange(index, 'fotoTranca', url)}
                        onRemove={() => handleCasaChange(index, 'fotoTranca', null)} />
                      <ImageUploadArea id={`casa-${index}-interior`} label="Foto do Interior" image={casa.fotoInterior}
                        onUpload={(_, url) => handleCasaChange(index, 'fotoInterior', url)}
                        onRemove={() => handleCasaChange(index, 'fotoInterior', null)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {formData.quantidadeCarros > 0 && (
            <div className="space-y-6 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-bold text-white">Carros ({formData.quantidadeCarros})</h3>
              {formData.carros.map((carro, index) => (
                <div key={carro.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                  <h4 className="text-md font-bold text-slate-200 mb-4">Carro {index + 1}</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nome/Modelo do Carro</label>
                      <input type="text" value={formData.nomesCarros[index] || ''} onChange={(e) => handleCarroChange(index, 'nome', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                        placeholder="Nome ou modelo do carro" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Objetos Apreendidos</label>
                      <textarea value={carro.objetos} onChange={(e) => handleCarroChange(index, 'objetos', e.target.value)} rows={3}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
                        placeholder="Descreva os objetos apreendidos..." />
                    </div>
                    <ImageUploadArea id={`carro-${index}-porta-mala`} label="Foto do Porta-Malas" image={carro.fotoPortaMala}
                      onUpload={(_, url) => handleCarroChange(index, 'fotoPortaMala', url)}
                      onRemove={() => handleCarroChange(index, 'fotoPortaMala', null)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button type="submit" disabled={submitting}
              className="bg-federal-600 hover:bg-federal-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
              <Save size={20} />
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchSeizureCreate;
