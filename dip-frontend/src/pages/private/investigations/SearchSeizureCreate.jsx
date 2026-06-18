
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { useAuth } from '../../../context/AuthContext';
import { Save, ArrowLeft } from 'lucide-react';
import ImageUploadArea from '../../../components/ImageUploadArea';
import { supabase } from '../../../lib/supabase';

const SearchSeizureCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addInvestigation, getInvestigation, editInvestigation, updateSearchSeizureData } = useInvestigations();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!!id);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Média',
    tipoEntidade: 'pessoa', // 'pessoa' or 'organizacao'
    nomeEntidade: '',
    documentoPessoa: '',
    fotoRosto: null,
    quantidadeCasas: 0,
    quantidadeCarros: 0,
    nomesCarros: [],
    casas: [],
    carros: []
  });

  useEffect(() => {
    if (id) {
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
    }
  }, [id, getInvestigation, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleQuantidadeChange = (campo, valor) => {
    const num = parseInt(valor) || 0;
    setFormData(prev => {
      const newData = { ...prev, [campo]: num };
      // Ajustar arrays se a quantidade mudar
      if (campo === 'quantidadeCasas') {
        const newCasas = [...prev.casas];
        while (newCasas.length < num) {
          newCasas.push({ id: Date.now() + Math.random(), objetos: '', fotoTranca: null, fotoInterior: null });
        }
        while (newCasas.length > num) {
          newCasas.pop();
        }
        newData.casas = newCasas;
      } else if (campo === 'quantidadeCarros') {
        const newCarros = [...prev.carros];
        const newNomesCarros = [...(prev.nomesCarros || [])];
        while (newCarros.length < num) {
          newCarros.push({ id: Date.now() + Math.random(), objetos: '', fotoPortaMala: null });
          newNomesCarros.push('');
        }
        while (newCarros.length > num) {
          newCarros.pop();
          newNomesCarros.pop();
        }
        newData.carros = newCarros;
        newData.nomesCarros = newNomesCarros;
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

  const handleFotoRosto = (dataUrl) => {
    setFormData(prev => ({ ...prev, fotoRosto: dataUrl }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let finalFotoRosto = formData.fotoRosto;
      
      // Upload foto do rosto se for um dataUrl novo
      if (finalFotoRosto && finalFotoRosto.startsWith('data:')) {
        const response = await fetch(finalFotoRosto);
        const blob = await response.blob();
        const fileExt = blob.type.split('/')[1];
        const fileName = `busca_e_apreensao/${Date.now()}_rosto.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('busca_e_apreensao')
          .upload(fileName, blob);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('busca_e_apreensao').getPublicUrl(fileName);
        finalFotoRosto = urlData.publicUrl;
      }

      // Processar fotos das casas e carros
      const processarFotos = async (items, tipo) => {
        const result = [];
        for (let i = 0; i < items.length; i++) {
          const item = { ...items[i] };
          
          for (const campo of ['fotoTranca', 'fotoInterior', 'fotoPortaMala']) {
            if (item[campo] && item[campo].startsWith('data:')) {
              const response = await fetch(item[campo]);
              const blob = await response.blob();
              const fileExt = blob.type.split('/')[1];
              const fileName = `busca_e_apreensao/${Date.now()}_${tipo}_${i}_${campo}.${fileExt}`;
              
              const { error: uploadError } = await supabase.storage
                .from('busca_e_apreensao')
                .upload(fileName, blob);
              
              if (uploadError) throw uploadError;
              
              const { data: urlData } = supabase.storage.from('busca_e_apreensao').getPublicUrl(fileName);
              item[campo] = urlData.publicUrl;
            }
          }
          
          result.push(item);
        }
        return result;
      };

      const finalCasas = await processarFotos(formData.casas, 'casa');
      const finalCarros = await processarFotos(formData.carros, 'carro');

      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: 'search_and_seizure',
        tipoEntidade: formData.tipoEntidade,
        nomeEntidade: formData.nomeEntidade,
        documentoPessoa: formData.documentoPessoa,
        fotoRosto: finalFotoRosto,
        quantidadeCasas: formData.quantidadeCasas,
        quantidadeCarros: formData.quantidadeCarros,
        nomesCarros: formData.nomesCarros,
        casas: finalCasas,
        carros: finalCarros
      };

      if (id) {
        await editInvestigation(id, payload);
        await updateSearchSeizureData(id, payload);
      } else {
        await addInvestigation(payload);
      }

      navigate('/dashboard/search-seizure');
    } catch (error) {
      console.error('Erro ao salvar busca e apreensão:', error);
      alert('Erro ao salvar. Por favor, tente novamente.');
    } finally {
      setLoading(false);
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
      <button 
        onClick={() => navigate('/dashboard/search-seizure')}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h2 className="text-2xl font-bold text-white">
            {id ? 'Editar' : 'Nova'} Busca e Apreensão
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Título da Operação</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              placeholder="Ex: Operação XYZ"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Descrição</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
              placeholder="Descrição da operação..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Prioridade</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Tipo de Entidade</label>
              <select
                name="tipoEntidade"
                value={formData.tipoEntidade}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              >
                <option value="pessoa">Pessoa</option>
                <option value="organizacao">Organização</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                {formData.tipoEntidade === 'pessoa' ? 'Nome Completo' : 'Nome da Organização'}
              </label>
              <input
                type="text"
                name="nomeEntidade"
                value={formData.nomeEntidade}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                placeholder="Nome completo"
                required
              />
            </div>

            {formData.tipoEntidade === 'pessoa' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Documento / Identificação</label>
                <input
                  type="text"
                  name="documentoPessoa"
                  value={formData.documentoPessoa}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                  placeholder="Documento de identificação"
                />
              </div>
            )}
          </div>

          {formData.tipoEntidade === 'pessoa' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Foto do Rosto</label>
              <ImageUploadArea
                id="fotoRosto"
                label="Foto do Rosto"
                image={formData.fotoRosto}
                onUpload={handleFotoRosto}
                onRemove={() => setFormData(prev => ({ ...prev, fotoRosto: null }))}
                required
                aspect={1}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Quantidade de Casas</label>
              <input
                type="number"
                value={formData.quantidadeCasas}
                onChange={(e) => handleQuantidadeChange('quantidadeCasas', e.target.value)}
                min="0"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Quantidade de Carros</label>
              <input
                type="number"
                value={formData.quantidadeCarros}
                onChange={(e) => handleQuantidadeChange('quantidadeCarros', e.target.value)}
                min="0"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* Casas */}
          {formData.quantidadeCasas > 0 && (
            <div className="space-y-6 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-bold text-white">Casas ({formData.quantidadeCasas})</h3>
              {formData.casas.map((casa, index) => (
                <div key={casa.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                  <h4 className="text-md font-bold text-slate-200 mb-4">Casa {index + 1}</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Objetos Apreendidos</label>
                      <textarea
                        value={casa.objetos}
                        onChange={(e) => handleCasaChange(index, 'objetos', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
                        placeholder="Descreva os objetos apreendidos..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ImageUploadArea
                        id={`casa-${index}-tranca`}
                        label="Foto da Tranca"
                        image={casa.fotoTranca}
                        onUpload={(dataUrl) => handleCasaChange(index, 'fotoTranca', dataUrl)}
                        onRemove={() => handleCasaChange(index, 'fotoTranca', null)}
                      />
                      <ImageUploadArea
                        id={`casa-${index}-interior`}
                        label="Foto do Interior"
                        image={casa.fotoInterior}
                        onUpload={(dataUrl) => handleCasaChange(index, 'fotoInterior', dataUrl)}
                        onRemove={() => handleCasaChange(index, 'fotoInterior', null)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Carros */}
          {formData.quantidadeCarros > 0 && (
            <div className="space-y-6 pt-4 border-t border-slate-800">
              <h3 className="text-lg font-bold text-white">Carros ({formData.quantidadeCarros})</h3>
              {formData.carros.map((carro, index) => (
                <div key={carro.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                  <h4 className="text-md font-bold text-slate-200 mb-4">Carro {index + 1}</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nome/Modelo do Carro</label>
                      <input
                        type="text"
                        value={formData.nomesCarros[index] || ''}
                        onChange={(e) => handleCarroChange(index, 'nome', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                        placeholder="Nome ou modelo do carro"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Objetos Apreendidos</label>
                      <textarea
                        value={carro.objetos}
                        onChange={(e) => handleCarroChange(index, 'objetos', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none"
                        placeholder="Descreva os objetos apreendidos..."
                      />
                    </div>

                    <ImageUploadArea
                      id={`carro-${index}-porta-mala`}
                      label="Foto do Porta-Malas"
                      image={carro.fotoPortaMala}
                      onUpload={(dataUrl) => handleCarroChange(index, 'fotoPortaMala', dataUrl)}
                      onRemove={() => handleCarroChange(index, 'fotoPortaMala', null)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-federal-600 hover:bg-federal-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SearchSeizureCreate;
