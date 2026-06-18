import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlvaras } from '../../../hooks/useAlvaras';
import { ArrowLeft, Building2, Clock, Calendar, RefreshCw, AlertTriangle, Save, Eye } from 'lucide-react';

const AlvaraDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAlvara, renovarAlvara, averiguarAlvara } = useAlvaras();
  const [alvara, setAlvara] = useState(null);
  const [renovarModalOpen, setRenovarModalOpen] = useState(false);
  const [novaValidade, setNovaValidade] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getAlvara(id);
      if (data) {
        setAlvara(data);
      } else {
        navigate('/dashboard/alvaras');
      }
      setIsLoading(false);
    };
    fetchData();
  }, [id, getAlvara, navigate]);

  const isExpiringSoon = () => {
    if (!alvara) return false;
    const hoje = new Date();
    const validade = new Date(alvara.dataValidade);
    const diffMs = validade - hoje;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays <= 15 && diffDays > 0;
  };

  const isExpired = () => {
    if (!alvara) return false;
    return new Date(alvara.dataValidade) < new Date();
  };

  const handleRenovar = async () => {
    if (!novaValidade) return;
    try {
      await renovarAlvara(id, novaValidade);
      const updated = await getAlvara(id);
      setAlvara(updated);
      setRenovarModalOpen(false);
      setNovaValidade('');
    } catch (error) {
      console.error('Erro ao renovar alvará:', error);
    }
  };

  const handleAveriguar = async () => {
    if (window.confirm('Deseja marcar este alvará como averiguado?')) {
      try {
        await averiguarAlvara(id);
        const updated = await getAlvara(id);
        setAlvara(updated);
      } catch (error) {
        console.error('Erro ao averiguar alvará:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex justify-center py-20 text-slate-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500" />
      </div>
    );
  }

  if (!alvara) return null;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <button 
        onClick={() => navigate('/dashboard/alvaras')}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar para Alvarás
      </button>

      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{alvara.estabelecimento}</h1>
            <p className="text-slate-400">{alvara.endereco}</p>
          </div>
          <div className="flex gap-3">
            {!isExpired() && alvara.status !== 'Averiguado' && (
              <button
                onClick={() => setRenovarModalOpen(true)}
                className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all hover:-translate-y-0.5"
              >
                <RefreshCw size={20} />
                Renovar
              </button>
            )}
            {isExpired() && alvara.status !== 'Averiguado' && (
              <button
                onClick={handleAveriguar}
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-900/50 transition-all hover:-translate-y-0.5"
              >
                <AlertTriangle size={20} />
                Averiguar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Foto do Local */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Eye size={18} /> Foto do Local
            </h3>
          </div>
          <div className="p-4">
            {alvara.fotoLocal ? (
              <img
                src={alvara.fotoLocal}
                alt="Local"
                className="w-full h-auto rounded-xl object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-slate-800 rounded-xl text-slate-500">
                Sem foto
              </div>
            )}
          </div>
        </div>

        {/* Informações do Alvará */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
              <Building2 size={20} /> Dados do Alvará
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-slate-400 text-sm">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isExpired() ? 'text-red-400 bg-red-400/10 border-red-400/20' : 
                  isExpiringSoon() ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' : 
                  alvara.status === 'Averiguado' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20' : 
                  'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                }`}>
                  {alvara.status === 'Averiguado' ? 'Averiguado' : 
                   isExpired() ? 'Vencido' : 
                   isExpiringSoon() ? 'Vencendo em Breve' : 'Ativo'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <Calendar size={14} /> Data de Emissão
                </span>
                <span className="text-white font-medium">{new Date(alvara.dataEmissao).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <Clock size={14} /> Data de Validade
                </span>
                <span className={`font-medium ${isExpired() ? 'text-red-400' : isExpiringSoon() ? 'text-yellow-400' : 'text-white'}`}>
                  {new Date(alvara.dataValidade).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Renovar */}
      {renovarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Renovar Alvará</h3>
              <button
                onClick={() => {
                  setRenovarModalOpen(false);
                  setNovaValidade('');
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Nova Data de Validade
                </label>
                <input
                  type="date"
                  value={novaValidade}
                  onChange={(e) => setNovaValidade(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setRenovarModalOpen(false);
                    setNovaValidade('');
                  }}
                  className="px-6 py-2 rounded-xl text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRenovar}
                  className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-federal-900/50 transition-all"
                >
                  <Save size={18} />
                  Confirmar Renovação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlvaraDetail;
