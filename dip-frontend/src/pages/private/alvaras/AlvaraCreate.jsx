import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlvaras } from '../../../hooks/useAlvaras';
import { Save, ArrowLeft, Building2, Calendar } from 'lucide-react';
import ImageUploadArea from '../../../components/ImageUploadArea';

const AlvaraCreate = () => {
  const navigate = useNavigate();
  const { addAlvara } = useAlvaras();
  const [formData, setFormData] = useState({
    estabelecimento: '',
    endereco: '',
    fotoLocal: null,
    file: null,
    dataEmissao: new Date().toISOString().split('T')[0],
    dataValidade: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (id, dataUrl, file) => {
    setFormData(prev => ({ ...prev, fotoLocal: dataUrl, file: file }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, fotoLocal: null, file: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.estabelecimento || !formData.endereco || !formData.dataValidade) return;
    
    try {
      const id = await addAlvara(formData);
      navigate(`/dashboard/alvaras/${id}`);
    } catch (error) {
      console.error('Erro ao criar alvará:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <button 
        onClick={() => navigate('/dashboard/alvaras')}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar para Alvarás
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="text-federal-500" size={28} />
            Novo Alvará
          </h2>
          <p className="text-slate-400 mt-2">
            Registre um novo alvará de estabelecimento com foto do local.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Estabelecimento */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nome do Estabelecimento</label>
            <input
              type="text"
              name="estabelecimento"
              value={formData.estabelecimento}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              placeholder="Ex: Supermercado XYZ"
              required
            />
          </div>

          {/* Endereco */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Endereço</label>
            <input
              type="text"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              placeholder="Rua das Flores, 123, Bairro Centro, Cidade"
              required
            />
          </div>

          {/* Foto do Local */}
          <ImageUploadArea
            id="fotoLocal"
            label="Foto do Local"
            image={formData.fotoLocal}
            onUpload={handleImageUpload}
            onRemove={handleImageRemove}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data Emissao */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} /> Data de Emissão
              </label>
              <input
                type="date"
                name="dataEmissao"
                value={formData.dataEmissao}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                required
              />
            </div>

            {/* Data Validade */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} /> Data de Validade
              </label>
              <input
                type="date"
                name="dataValidade"
                value={formData.dataValidade}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="bg-federal-600 hover:bg-federal-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5"
            >
              <Save size={20} />
              Criar Alvará
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlvaraCreate;
