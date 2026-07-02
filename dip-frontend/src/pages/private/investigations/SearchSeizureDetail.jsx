import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { usePermissions } from '../../../hooks/usePermissions';
import { ArrowLeft, Edit3, Trash2, Home, Car, User, Building2, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react';
import ImageUploadArea from '../../../components/ImageUploadArea';
import FileUploadArea from '../../../components/FileUploadArea';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { uploadSearchSeizureFiles } from '../../../utils/searchSeizureStorage';
import clsx from 'clsx';

const SearchSeizureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInvestigation, deleteInvestigation, updateSearchSeizureData } = useInvestigations();
  const { can } = usePermissions();
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

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

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(t);
  }, [notification]);

  const handleEditCasa = (index, campo, valor) => {
    setEditData(prev => {
      const newCasas = [...prev.casas];
      newCasas[index] = { ...newCasas[index], [campo]: valor };
      return { ...prev, casas: newCasas };
    });
  };

  const handleEditCarro = (index, campo, valor) => {
    setEditData(prev => {
      const newCarros = [...prev.carros];
      const newNomesCarros = [...(prev.nomesCarros || [])];
      if (campo === 'nome') {
        newNomesCarros[index] = valor;
        return { ...prev, nomesCarros: newNomesCarros };
      }
      newCarros[index] = { ...newCarros[index], [campo]: valor };
      return { ...prev, carros: newCarros };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = await uploadSearchSeizureFiles(editData);
      await updateSearchSeizureData(id, payload);
      setInvestigation(payload);
      setIsEditing(false);
      setNotification({ type: 'success', message: 'Dados salvos com sucesso.' });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setNotification({ type: 'error', message: error?.message || 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setConfirmAction({
      message: 'Tem certeza que deseja deletar esta busca e apreensão?',
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          await deleteInvestigation(id);
          navigate('/dashboard/search-seizure');
        } catch (error) {
          setNotification({ type: 'error', message: error?.message || 'Não foi possível deletar.' });
        }
      }
    });
  };

  if (loading && !investigation) {
    return (
      <div className="max-w-4xl mx-auto pb-10 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500" />
      </div>
    );
  }

  if (!investigation) return null;

  const data = isEditing ? editData : investigation;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

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

      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/dashboard/search-seizure')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
          <ArrowLeft size={16} /> Voltar
        </button>
        {canManage && (
          <div className="flex gap-2">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                <Edit3 size={16} /> Editar
              </button>
            ) : (
              <>
                <button onClick={() => { setEditData({ ...investigation }); setIsEditing(false); }} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="bg-federal-600 hover:bg-federal-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            )}
            <button onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
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
                <ImageUploadArea id="foto-rosto" label="Foto do Rosto" image={data.fotoRosto}
                  onUpload={(_, url) => setEditData(prev => ({ ...prev, fotoRosto: url }))}
                  onRemove={() => setEditData(prev => ({ ...prev, fotoRosto: null }))} aspect={1} />
              ) : (
                <img src={data.fotoRosto} alt="Foto do acusado" className="w-48 h-48 object-cover rounded-xl border border-slate-700" />
              )}
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Documento de Ordem</label>
            {isEditing ? (
              <FileUploadArea id="documento-ordem" label="Documento de Ordem" fileUrl={data.documentoOrdem}
                onUpload={(_, url) => setEditData(prev => ({ ...prev, documentoOrdem: url }))}
                onRemove={() => setEditData(prev => ({ ...prev, documentoOrdem: null }))} />
            ) : data.documentoOrdem ? (
              <a href={data.documentoOrdem} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-700 rounded-xl hover:border-federal-500 transition-colors">
                <FileText size={32} className="text-federal-500" />
                <div>
                  <p className="text-white font-medium">Abrir documento de ordem</p>
                  <p className="text-slate-500 text-sm">Clique para visualizar</p>
                </div>
              </a>
            ) : (
              <div className="p-4 bg-slate-950 border border-slate-700 rounded-xl flex items-center justify-center text-slate-500">Sem documento</div>
            )}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              {data.tipoEntidade === 'pessoa' ? <User size={24} className="text-federal-500" /> : <Building2 size={24} className="text-federal-500" />}
              <h3 className="text-lg font-bold text-white">{data.tipoEntidade === 'pessoa' ? 'Pessoa' : 'Organização'}</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Nome</label>
                {isEditing ? (
                  <input type="text" value={data.nomeEntidade} onChange={(e) => setEditData(prev => ({ ...prev, nomeEntidade: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-federal-500" />
                ) : <p className="text-slate-200">{data.nomeEntidade}</p>}
              </div>
              {data.tipoEntidade === 'pessoa' && (
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Documento</label>
                  {isEditing ? (
                    <input type="text" value={data.documentoPessoa} onChange={(e) => setEditData(prev => ({ ...prev, documentoPessoa: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-federal-500" />
                  ) : <p className="text-slate-200">{data.documentoPessoa || 'Não informado'}</p>}
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
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Home size={24} className="text-federal-500" /> Casas ({data.quantidadeCasas})</h3>
            {data.casas.map((casa, index) => (
              <div key={casa.id || index} className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                <h4 className="text-lg font-bold text-slate-200 mb-4">Casa {index + 1}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider block">Objetos Apreendidos</label>
                    {isEditing ? (
                      <textarea value={casa.objetos} onChange={(e) => handleEditCasa(index, 'objetos', e.target.value)} rows={3}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none outline-none focus:border-federal-500" />
                    ) : <p className="text-slate-200 mt-1">{casa.objetos || 'Nenhum objeto registrado'}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['fotoTranca', 'fotoInterior'].map((campo) => (
                      <div key={campo}>
                        <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider block">
                          {campo === 'fotoTranca' ? 'Foto da Tranca' : 'Foto do Interior do Baú'}
                        </label>
                        {isEditing ? (
                          <ImageUploadArea id={`casa-${index}-${campo}`} label={campo === 'fotoTranca' ? 'Foto da Tranca' : 'Foto do Interior'}
                            image={casa[campo]}
                            onUpload={(_, url) => handleEditCasa(index, campo, url)}
                            onRemove={() => handleEditCasa(index, campo, null)} />
                        ) : casa[campo] ? (
                          <img src={casa[campo]} alt={campo} className="w-full h-48 object-cover rounded-lg border border-slate-700" />
                        ) : (
                          <div className="w-full h-48 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">Sem foto</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.quantidadeCarros > 0 && (
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Car size={24} className="text-federal-500" /> Carros ({data.quantidadeCarros})</h3>
            {data.carros.map((carro, index) => (
              <div key={carro.id || index} className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                <h4 className="text-lg font-bold text-slate-200 mb-4">Carro {index + 1}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider block">Nome/Modelo</label>
                    {isEditing ? (
                      <input type="text" value={data.nomesCarros?.[index] || ''} onChange={(e) => handleEditCarro(index, 'nome', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-federal-500" />
                    ) : <p className="text-slate-200 mt-1">{data.nomesCarros?.[index] || 'Não informado'}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider block">Objetos Apreendidos</label>
                    {isEditing ? (
                      <textarea value={carro.objetos} onChange={(e) => handleEditCarro(index, 'objetos', e.target.value)} rows={3}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none outline-none focus:border-federal-500" />
                    ) : <p className="text-slate-200 mt-1">{carro.objetos || 'Nenhum objeto registrado'}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider block">Foto do Porta-Malas</label>
                    {isEditing ? (
                      <ImageUploadArea id={`carro-${index}-porta-malas`} label="Foto do Porta-Malas" image={carro.fotoPortaMala}
                        onUpload={(_, url) => handleEditCarro(index, 'fotoPortaMala', url)}
                        onRemove={() => handleEditCarro(index, 'fotoPortaMala', null)} />
                    ) : carro.fotoPortaMala ? (
                      <img src={carro.fotoPortaMala} alt="Porta-malas" className="w-full h-48 object-cover rounded-lg border border-slate-700" />
                    ) : (
                      <div className="w-full h-48 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 border border-slate-700">Sem foto</div>
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
