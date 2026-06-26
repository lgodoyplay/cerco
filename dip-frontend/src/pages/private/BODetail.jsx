import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, Edit3, FileText, MapPin, Printer, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSettingsContext } from '../../context/SettingsContext';
import { usePermissions } from '../../hooks/usePermissions';
import { generateProfessionalPDF } from '../../utils/pdfGeneratorPro';
import NotificationBanner from '../../components/feedback/NotificationBanner';
import { getPeopleList } from '../../utils/boHelpers';

const BODetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { templates } = useSettingsContext();
  const { can } = usePermissions();

  const [bo, setBo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showDescription, setShowDescription] = useState(true);

  const canManage = can('bo_manage');

  useEffect(() => {
    const fetchBo = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('boletins')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setBo(data);
      } catch (error) {
        console.error('Erro ao carregar BO:', error);
        setNotification({
          type: 'error',
          message: error?.message || 'Nao foi possivel carregar os detalhes do BO.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBo();
  }, [id]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const complainants = useMemo(
    () => getPeopleList(bo?.comunicantes_json, bo?.comunicante),
    [bo]
  );

  const reportedPeople = useMemo(
    () => getPeopleList(bo?.denunciados_json),
    [bo]
  );

  const handlePrint = async () => {
    if (!bo) return;
    try {
      await generateProfessionalPDF(
        bo,
        user,
        templates?.bo,
        'bo',
        templates?.__layoutConfig?.bo,
        templates?.__pageHeaderConfig
      );
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel gerar o PDF do BO.'
      });
    }
  };

  return (
    <div className="space-y-6">
      <NotificationBanner notification={notification} onClose={() => setNotification(null)} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/bo-list')}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para BOs
          </button>
          <h2 className="mt-3 text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-federal-500" size={26} />
            Detalhes do BO
          </h2>
          <p className="text-slate-400 mt-1">Visualização completa do boletim de ocorrência em página própria.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePrint}
            disabled={!bo || loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-federal-600 hover:bg-federal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors"
          >
            <Printer size={18} />
            Imprimir BO
          </button>
          {canManage && bo && (
            <button
              type="button"
              onClick={() => navigate(`/dashboard/bo/${bo.id}/edit`)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors"
            >
              <Edit3 size={18} />
              Editar BO
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
          Carregando detalhes do BO...
        </div>
      )}

      {!loading && !bo && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
          BO não encontrado.
        </div>
      )}

      {!loading && bo && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">ID do Registro</p>
              <p className="text-white font-mono text-sm break-all">{bo.id}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Data e Hora do Fato</p>
              <div className="flex items-center gap-2 text-slate-200">
                <Calendar size={16} className="text-federal-500" />
                {bo.data_fato && !isNaN(new Date(bo.data_fato).getTime())
                  ? format(new Date(bo.data_fato), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                  : 'Data inválida'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Status</p>
              <span className="px-3 py-1 rounded-lg text-sm font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {bo.status}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Local da Ocorrência</p>
              <p className="text-slate-300 flex items-center gap-2">
                <MapPin size={16} className="text-federal-500 shrink-0" />
                <span>{bo.localizacao || 'Nao informado'}</span>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <Shield size={20} className="text-federal-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Policial Responsável</p>
                  <p className="text-xs text-slate-400">{bo.policial_responsavel || 'Nao informado'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Comunicantes</h3>
              <div className="space-y-3">
                {complainants.map((person, index) => (
                  <div key={`complainant-${index}`} className="bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3">
                    <div className="flex items-start gap-3">
                      <User size={18} className="text-slate-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-white font-medium">{person.name || 'Nao informado'}</p>
                        {person.passport && (
                          <p className="text-xs text-slate-400 mt-1">Passaporte: {person.passport}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Pessoas Denunciadas</h3>
              <div className="space-y-3">
                {reportedPeople.length > 0 ? reportedPeople.map((person, index) => (
                  <div key={`reported-${index}`} className="bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                    <p className="text-white font-medium">{person.name || 'Nao informado'}</p>
                    {person.passport && (
                      <p className="text-xs text-red-200/80 mt-1">Passaporte: {person.passport}</p>
                    )}
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">Nenhuma pessoa denunciada informada.</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDescription((value) => !value)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Descrição</p>
                  <h4 className="text-lg font-bold text-white mt-1">Clique para visualizar os fatos</h4>
                </div>
                {showDescription ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
              </button>

              {showDescription && (
                <div className="px-6 pb-6">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 uppercase font-bold block mb-2">Descrição dos Fatos</span>
                    <p className="text-slate-300 whitespace-pre-wrap">{bo.descricao || 'Nao informado.'}</p>
                  </div>
                </div>
              )}
            </div>

            {bo.nome_policial_prisao && (
              <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                <span className="text-xs text-amber-400 uppercase font-bold block mb-1">Policial Responsável pela Prisão em Flagrante</span>
                <div className="text-white font-medium">{bo.nome_policial_prisao}</div>
                {bo.id_policial_prisao && (
                  <div className="text-amber-300 text-sm mt-1">ID/Distintivo: {bo.id_policial_prisao}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BODetail;
