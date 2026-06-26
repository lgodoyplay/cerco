import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, Download, FileText, Shield, User, X } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { generateProfessionalPDF } from '../../utils/pdfGeneratorPro';
import NotificationBanner from '../../components/feedback/NotificationBanner';
import { buildArrestRecord } from '../../utils/arrestWantedMedia';

const getStatusColor = (status) => {
  switch (status) {
    case 'Preso': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'Aguardando Audiência': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'Liberado sob Fiança': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

const ArrestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { templates } = useSettings();

  const [arrest, setArrest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showLegalInfo, setShowLegalInfo] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchArrest = async () => {
      setLoading(true);
      try {
        const { data: arrestData, error: arrestError } = await supabase
          .from('prisoes')
          .select('*')
          .eq('id', id)
          .single();

        if (arrestError) throw arrestError;

        let linkedBo = null;
        if (arrestData.bo_id) {
          const { data: boData } = await supabase
            .from('boletins')
            .select('id, comunicante, descricao')
            .eq('id', arrestData.bo_id)
            .maybeSingle();
          linkedBo = boData || null;
        }

        setArrest(buildArrestRecord(arrestData, linkedBo));
      } catch (error) {
        console.error('Erro ao carregar prisão:', error);
        setNotification({
          type: 'error',
          message: error?.message || 'Nao foi possivel carregar os detalhes da prisao.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArrest();
  }, [id]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const additionalMedia = useMemo(
    () => (arrest?.mediaEntries || []).filter((entry) => entry.url !== arrest?.images?.face),
    [arrest]
  );

  const handleDownloadReport = async () => {
    if (!arrest) return;
    try {
      await generateProfessionalPDF(
        arrest,
        user,
        templates?.arrest,
        'arrest',
        templates?.__layoutConfig?.arrest,
        templates?.__pageHeaderConfig
      );
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel gerar o PDF da prisao.'
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
            onClick={() => navigate('/dashboard/arrests')}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para prisões
          </button>
          <h2 className="mt-3 text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-federal-500" size={26} />
            Detalhes da Prisão
          </h2>
          <p className="text-slate-400 mt-1">Visualização completa da prisão registrada, com fotos e dados operacionais.</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadReport}
          disabled={!arrest || loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-federal-600 hover:bg-federal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors"
        >
          <Download size={18} />
          Baixar Relatório
        </button>
      </div>

      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
          Carregando detalhes da prisão...
        </div>
      )}

      {!loading && !arrest && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
          Prisão não encontrada.
        </div>
      )}

      {!loading && arrest && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <button
                type="button"
                onClick={() => arrest.images?.face && setSelectedImage({ url: arrest.images.face, label: 'Foto Principal' })}
                className="w-full aspect-square bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center"
              >
                {arrest.images?.face ? (
                  <img src={arrest.images.face} alt={arrest.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                    <User size={48} />
                    <span className="text-xs uppercase mt-2">Sem Foto</span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-slate-900/85 py-2 text-center text-xs font-bold text-white uppercase">
                  Foto Principal
                </div>
              </button>
              {arrest.images?.face && (
                <p className="text-xs text-slate-500 mt-3 text-center">Clique na imagem para ampliar</p>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Outras Fotos</h3>
                <span className="text-xs text-slate-500">{additionalMedia.length} item(ns)</span>
              </div>
              {additionalMedia.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {additionalMedia.map((entry) => (
                    <button
                      key={entry.key}
                      type="button"
                      onClick={() => setSelectedImage({ url: entry.url, label: entry.label })}
                      className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-left"
                    >
                      <div className="aspect-square flex items-center justify-center bg-slate-950">
                        <img src={entry.url} alt={entry.label} className="w-full h-full object-contain" />
                      </div>
                      <div className="px-3 py-2 text-xs text-slate-300 border-t border-slate-800">{entry.label}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-sm text-slate-500 text-center">
                  Nenhuma foto adicional foi registrada.
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white">{arrest.name}</h3>
                  <p className="text-federal-400 font-mono text-sm mt-1">DOC: {arrest.passport || 'Nao informado'}</p>
                </div>
                <span className={clsx('px-3 py-1 rounded-lg text-sm font-bold border w-fit', getStatusColor(arrest.status))}>
                  {arrest.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Data da Ocorrência</span>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Calendar size={16} className="text-federal-500" />
                    {arrest.date && !isNaN(new Date(arrest.date).getTime())
                      ? format(new Date(arrest.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : 'Data não informada'}
                  </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Oficial Responsável</span>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Shield size={16} className="text-federal-500" />
                    {arrest.officer}
                  </div>
                </div>
              </div>

              {arrest.broughtByOtherPolice && (
                <div className="mt-4 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-amber-300 text-sm">
                  Esta prisão foi marcada como conduzida por outra polícia.
                </div>
              )}

              {arrest.linkedBo && (
                <div className="mt-4 bg-federal-500/10 p-4 rounded-xl border border-federal-500/20">
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">BO Responsável</span>
                  <div className="text-white font-medium">{arrest.linkedBo.comunicante}</div>
                  <p className="text-slate-400 text-sm mt-1">{arrest.linkedBo.descricao}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowLegalInfo((value) => !value)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Motivo e Artigos</p>
                  <h4 className="text-lg font-bold text-white mt-1">Clique para visualizar de forma organizada</h4>
                </div>
                {showLegalInfo ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
              </button>

              {showLegalInfo && (
                <div className="px-6 pb-6 space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 uppercase font-bold block mb-2">Motivo da Prisão</span>
                    <p className="text-slate-200 whitespace-pre-line">{arrest.reason || 'Não informado.'}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 uppercase font-bold block mb-2">Artigos Aplicados</span>
                    <p className="text-federal-400 font-medium whitespace-pre-line">{arrest.articles || 'Não informado.'}</p>
                  </div>
                </div>
              )}
            </div>

            {arrest.description && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <span className="text-xs text-slate-500 uppercase font-bold block mb-3">Observações / Relatório</span>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{arrest.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="relative w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <p className="text-sm font-bold text-white">{selectedImage.label}</p>
                <p className="text-xs text-slate-500">Visualização ampliada da foto da prisão</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="text-slate-400 hover:text-white" size={18} />
              </button>
            </div>
            <div className="max-h-[82vh] overflow-auto bg-slate-950 flex items-center justify-center p-4">
              <img src={selectedImage.url} alt={selectedImage.label} className="max-w-full max-h-[76vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArrestDetail;
