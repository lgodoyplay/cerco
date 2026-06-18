import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Stethoscope, 
  ArrowLeft,
  Save
} from 'lucide-react';
import { useLaudos } from '../../../hooks/useLaudos';

const LaudoCreate = () => {
  const navigate = useNavigate();
  const { addLaudo } = useLaudos();
  const [formData, setFormData] = useState({
    paciente_nome: '',
    paciente_documento: '',
    tipo_laudo: '',
    conteudo: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addLaudo(formData);
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
          <label className="block text-sm font-semibold text-slate-300 mb-2">Nome do Paciente *</label>
          <input
            type="text"
            required
            value={formData.paciente_nome}
            onChange={(e) => setFormData({...formData, paciente_nome: e.target.value})}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
            placeholder="Nome completo do paciente"
          />
        </div>

        {/* Documento */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Documento do Paciente *</label>
          <input
            type="text"
            required
            value={formData.paciente_documento}
            onChange={(e) => setFormData({...formData, paciente_documento: e.target.value})}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
            placeholder="Passaporte, RG, CPF, etc."
          />
        </div>

        {/* Tipo de Laudo */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Tipo de Laudo *</label>
          <select
            required
            value={formData.tipo_laudo}
            onChange={(e) => setFormData({...formData, tipo_laudo: e.target.value})}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
          >
            <option value="">Selecione um tipo</option>
            <option value="Psicológico">Psicológico</option>
            <option value="Médico Geral">Médico Geral</option>
            <option value="Psiquiátrico">Psiquiátrico</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        {/* Conteúdo */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Conteúdo do Laudo *</label>
          <textarea
            required
            rows={10}
            value={formData.conteudo}
            onChange={(e) => setFormData({...formData, conteudo: e.target.value})}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
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
