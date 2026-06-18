
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { usePermissions } from '../../../hooks/usePermissions';
import { ArrowLeft, Edit3, Trash2, Home, Car, User, Building2 } from 'lucide-react';
import ImageUploadArea from '../../../components/ImageUploadArea';
import { supabase } from '../../../lib/supabase';

const SearchSeizureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInvestigation, deleteInvestigation, updateSearchSeizureData } = useInvestigations();
  const { can } = usePermissions();
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const canManage = can('investigations_manage');

  useEffect(() => {
    const fetchData = async () => {
      const data = await getInvestigation(id);
      if (data) {
        setInvestigation(data);
        setEditData({ ...data });
      } else {
        navigate('/dashboard/search-seizure');
      }
      setLoading(false);
    };
    fetchData();
  }, [id, getInvestigation, navigate]);

  const handleEditCasa = (index, campo, valor) => {
    // If we get 3 args (id, dataUrl, file) from ImageUploadArea, ignore the first and third
    const actualValor = arguments.length === 3 ? arguments[1] : valor;
    setEditData(prev => {
      const newCasas = [...prev.casas];
      newCasas[index] = { ...newCasas[index], [campo]: actualValor };
      return { ...prev, casas: newCasas };
    });
  };

  const handleEditCarro = (index, campo, valor) => {
    // If we get 3 args (id, dataUrl, file) from ImageUploadArea, ignore the first and third
    const actualValor = arguments.length === 3 ? arguments[1] : valor;
    setEditData(prev => {
      const newCarros = [...prev.carros];
      const newNomesCarros = [...(prev.nomesCarros || [])];
      if (campo === 'nome') {
        newNomesCarros[index] = actualValor;
        return { ...prev, nomesCarros: newNomesCarros };
      } else {
        newCarros[index] = { ...newCarros[index], [campo]: actualValor };
        return { ...prev, carros: newCarros };
      }
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      let finalFotoRosto = editData.fotoRosto;
      
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

      const finalCasas = await processarFotos(editData.casas, 'casa');
      const finalCarros = await processarFotos(editData.carros, 'carro');

      const payload = {
        ...editData,
        fotoRosto: finalFotoRosto,
        casas: finalCasas,
        carros: finalCarros
      };

      await updateSearchSeizureData(id, payload);
      setInvestigation(payload);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja deletar esta busca e apreensão?')) {
      await deleteInvestigation(id);
      navigate('/dashboard/search-seizure');
    }
  };

  if (loading && !investigation) {
    return (
      <div className="max-w-4xl mx-auto pb-10 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500" />
      </div>
    );
  }

  if (!investigation) {
    return null;
  }

  const data = isEditing ? editData : investigation;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/dashboard/search-seizure')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        
        {canManage && (
          <div className="flex gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Edit3 size={16} /> Editar
              </button>
            )}
            {isEditing && (
              <button
                onClick={() => {
                  setEditData({ ...investigation });
                  setIsEditing(false);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                Cancelar
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-federal-600 hover:bg-federal-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                Salvar
              </button>
            )}
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Trash2 size={16} /> Deletar
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-8">
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{data.title}</h1>
          <p className="text-slate-400">{data.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.tipoEntidade === 'pessoa' && data.fotoRosto && (
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Foto do Acusado</label>
              {isEditing ? (
                <ImageUploadArea
                  id="foto-rosto"
                  label="Foto do Rosto"
                  image={data.fotoRosto}
                  onUpload={(id, url) => setEditData(prev => ({ ...prev, fotoRosto: url }))}
                  onRemove={() => setEditData(prev => ({ ...prev, fotoRosto: null }))}
                  aspect={1}
                />
              ) : (
                <img 
                  src={data.fotoRosto} 
                  alt="Foto do acusado" 
                  className="w-48 h-48 object-cover rounded-xl border border-slate-700"
                />
              )}
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              {data.tipoEntidade === 'pessoa' ? <User size={24} className="text-federal-500" /> : <Building2 size={24} className="text-federal-500" />}
              <h3 className="text-lg font-bold text-white">
                {data.tipoEntidade === 'pessoa' ? 'Pessoa' : 'Organização'}
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Nome</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.nomeEntidade}
                    onChange={(e) => setEditData(prev => ({ ...prev, nomeEntidade: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                ) : (
                  <p className="text-slate-200">{data.nomeEntidade}</p>
                )}
              </div>
              {data.tipoEntidade === 'pessoa' && (
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Documento</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={data.documentoPessoa}
                      onChange={(e) => setEditData(prev => ({ ...prev, documentoPessoa: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  ) : (
                    <p className="text-slate-200">{data.documentoPessoa || 'Não informado'}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Resumo</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Home size={20} className="text-slate-500" />
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Casas</label>
                  <p className="text-slate-200 font-medium">{data.quantidadeCasas}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Car size={20} className="text-slate-500" />
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Carros</label>
                  <p className="text-slate-200 font-medium">{data.quantidadeCarros}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {data.quantidadeCasas > 0 && (
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Home size={24} className="text-federal-500" />
              Casas ({data.quantidadeCasas})
            </h3>
            {data.casas.map((casa, index) => (
              <div key={casa.id || index} className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                <h4 className="text-lg font-bold text-slate-200 mb-4">Casa {index + 1}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Objetos Apreendidos</label>
                    {isEditing ? (
                      <textarea
                        value={casa.objetos}
                        onChange={(e) => handleEditCasa(index, 'objetos', e.target.value)}
                        rows={3}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                      />
                    ) : (
                      <p className="text-slate-200 mt-1">{casa.objetos || 'Nenhum objeto registrado'}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Foto da Tranca</label>
                      {isEditing ? (
                        <ImageUploadArea
                          id={`casa-${index}-tranca`}
                          label="Foto da Tranca"
                          image={casa.fotoTranca}
                          onUpload={(id, url) => handleEditCasa(index, 'fotoTranca', url)}
                          onRemove={() => handleEditCasa(index, 'fotoTranca', null)}
                        />
                      ) : casa.fotoTranca ? (
                        <img src={casa.fotoTranca} alt="Tranca da casa" className="w-full h-48 object-cover rounded-lg border border-slate-700" />
                      ) : (
                        <div className="w-full h-48 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">
                          Sem foto
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Foto do Interior do Baú</label>
                      {isEditing ? (
                        <ImageUploadArea
                          id={`casa-${index}-interior`}
                          label="Foto do Interior"
                          image={casa.fotoInterior}
                          onUpload={(id, url) => handleEditCasa(index, 'fotoInterior', url)}
                          onRemove={() => handleEditCasa(index, 'fotoInterior', null)}
                        />
                      ) : casa.fotoInterior ? (
                        <img src={casa.fotoInterior} alt="Interior do baú" className="w-full h-48 object-cover rounded-lg border border-slate-700" />
                      ) : (
                        <div className="w-full h-48 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">
                          Sem foto
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.quantidadeCarros > 0 && (
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Car size={24} className="text-federal-500" />
              Carros ({data.quantidadeCarros})
            </h3>
            {data.carros.map((carro, index) => (
              <div key={carro.id || index} className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                <h4 className="text-lg font-bold text-slate-200 mb-4">Carro {index + 1}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nome/Modelo</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={data.nomesCarros?.[index] || ''}
                        onChange={(e) => handleEditCarro(index, 'nome', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    ) : (
                      <p className="text-slate-200 mt-1">{data.nomesCarros?.[index] || 'Não informado'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Objetos Apreendidos</label>
                    {isEditing ? (
                      <textarea
                        value={carro.objetos}
                        onChange={(e) => handleEditCarro(index, 'objetos', e.target.value)}
                        rows={3}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                      />
                    ) : (
                      <p className="text-slate-200 mt-1">{carro.objetos || 'Nenhum objeto registrado'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Foto do Porta-Malas</label>
                    {isEditing ? (
                      <ImageUploadArea
                        id={`carro-${index}-porta-malas`}
                        label="Foto do Porta-Malas"
                        image={carro.fotoPortaMala}
                        onUpload={(id, url) => handleEditCarro(index, 'fotoPortaMala', url)}
                        onRemove={() => handleEditCarro(index, 'fotoPortaMala', null)}
                      />
                    ) : carro.fotoPortaMala ? (
                      <img src={carro.fotoPortaMala} alt="Porta-malas" className="w-full h-48 object-cover rounded-lg border border-slate-700" />
                    ) : (
                      <div className="w-full h-48 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">
                        Sem foto
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchSeizureDetail;
