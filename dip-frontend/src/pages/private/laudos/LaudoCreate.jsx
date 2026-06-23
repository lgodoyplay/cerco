import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Stethoscope, 
  ArrowLeft,
  Save,
  File,
  X,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { useLaudos } from '../../../hooks/useLaudos';
import { useSettings } from '../../../hooks/useSettings';
import { useAuth } from '../../../context/AuthContext';
import ImageUploadArea from '../../../components/ImageUploadArea';
import { createBaseWebhookEmbed, formatWebhookAttachments, postWebhookEmbed, resolveWebhookActorName } from '../../../utils/discordWebhook';

const LaudoCreate = () => {
  const navigate = useNavigate();
  const { addLaudo, getLaudo } = useLaudos();
  const { discordConfig } = useSettings();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    paciente_nome: '',
    paciente_documento: '',
    tipo_laudo: '',
    conteudo: ''
  });
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (id, dataUrl, file) => {
    setArquivos(prev => [...prev, { id: Date.now(), dataUrl, file, descricao: '', tipo: 'imagem' }]);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      setArquivos(prev => [...prev, { id: Date.now() + Math.random(), file, descricao: '', tipo: file.type === 'application/pdf' ? 'pdf' : 'outro' }]);
    });
    e.target.value = '';
  };

  const handleRemoveArquivo = (id) => {
    setArquivos(prev => prev.filter(arquivo => arquivo.id !== id));
  };

  const handleDescricaoChange = (id, descricao) => {
    setArquivos(prev => prev.map(arquivo => arquivo.id === id ? { ...arquivo, descricao } : arquivo));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const laudoId = await addLaudo(formData, arquivos);

      if (discordConfig?.laudosWebhook && laudoId) {
        try {
          const laudo = await getLaudo(laudoId);
          const embed = createBaseWebhookEmbed({
            title: 'Laudo Medico - Novo Registro',
            description: formData.conteudo,
            color: 0x059669,
            actorName: resolveWebhookActorName(user),
            footerText: 'Sistema CIVIL EUFORIA - Laudos Medicos',
            fields: [
              { name: 'Paciente', value: formData.paciente_nome, inline: true },
              { name: 'Documento', value: formData.paciente_documento, inline: true },
              { name: 'Tipo do laudo', value: formData.tipo_laudo, inline: true },
              {
                name: 'Arquivos / Documentos',
                value: formatWebhookAttachments((laudo?.laudo_arquivos || []).map((arquivo) => ({
                  title: arquivo.descricao || arquivo.url,
                  url: arquivo.url
                }))),
                inline: false
              }
            ]
          });

          await postWebhookEmbed(discordConfig.laudosWebhook, embed);
        } catch (webhookError) {
          console.error('Erro ao enviar webhook de laudo:', webhookError);
        }
      }

      navigate('/dashboard/laudos');
    } catch (error) {
      console.error('Erro ao criar laudo:', error);
      alert('Erro ao criar laudo. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/dashboard/laudos" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Voltar para Laudos
        </Link>
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Stethoscope className="text-federal-500" size={32} />
          Novo Laudo Médico
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Paciente Nome */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Nome do Paciente *</label>
          <input
            type="text"
            required
            value={formData.paciente_nome}
            onChange={(e) => setFormData({...formData, paciente_nome: e.target.value})}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
            placeholder="Nome completo do paciente"
          />
        </div>

        {/* Documento */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Documento do Paciente *</label>
          <input
            type="text"
            required
            value={formData.paciente_documento}
            onChange={(e) => setFormData({...formData, paciente_documento: e.target.value})}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
            placeholder="Passaporte, RG, CPF, etc."
          />
        </div>

        {/* Tipo de Laudo */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Tipo de Laudo *</label>
          <select
            required
            value={formData.tipo_laudo}
            onChange={(e) => setFormData({...formData, tipo_laudo: e.target.value})}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
          >
            <option value="">Selecione um tipo</option>
            <option value="Psicológico">Psicológico</option>
            <option value="Médico Geral">Médico Geral</option>
            <option value="Psiquiátrico">Psiquiátrico</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        {/* Arquivos Upload */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Arquivos (Fotos e PDFs)</label>
          
          {/* Image Upload */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ImageUploadArea 
                id="laudo_foto_1"
                label="Foto 1"
                image={arquivos.find(a => a.id === 'laudo_foto_1')?.dataUrl}
                onUpload={handleImageUpload}
                onRemove={() => handleRemoveArquivo('laudo_foto_1')}
              />
              <ImageUploadArea 
                id="laudo_foto_2"
                label="Foto 2"
                image={arquivos.find(a => a.id === 'laudo_foto_2')?.dataUrl}
                onUpload={handleImageUpload}
                onRemove={() => handleRemoveArquivo('laudo_foto_2')}
              />
            </div>
          </div>

          {/* PDF Upload */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">PDFs e Outros Arquivos</label>
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={handleFileUpload}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
            />
          </div>

          {/* Lista de Arquivos */}
          {arquivos.length > 0 && (
            <div className="space-y-3">
              {arquivos.map(arquivo => (
                <div key={arquivo.id} className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  {arquivo.tipo === 'imagem' ? (
                    <ImageIcon className="text-federal-400" size={24} />
                  ) : arquivo.tipo === 'pdf' ? (
                    <FileText className="text-red-400" size={24} />
                  ) : (
                    <File className="text-slate-400" size={24} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{arquivo.file?.name}</p>
                    <input
                      type="text"
                      placeholder="Descrição do arquivo (opcional)"
                      value={arquivo.descricao}
                      onChange={(e) => handleDescricaoChange(arquivo.id, e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-slate-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveArquivo(arquivo.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Conteúdo do Laudo *</label>
          <textarea
            required
            rows={10}
            value={formData.conteudo}
            onChange={(e) => setFormData({...formData, conteudo: e.target.value})}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
            placeholder="Conteúdo completo do laudo médico..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-4 border-t border-slate-800">
          <Link
            to="/dashboard/laudos"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-federal-600 hover:bg-federal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <span className="animate-spin">⌛</span>
            ) : (
              <>
                <Save size={18} />
                Salvar Laudo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LaudoCreate;
