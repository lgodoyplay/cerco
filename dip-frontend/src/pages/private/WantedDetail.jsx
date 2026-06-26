import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, FileText, Lock, Printer, ShieldAlert, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { usePermissions } from '../../hooks/usePermissions';
import { generateProfessionalPDF } from '../../utils/pdfGeneratorPro';
import NotificationBanner from '../../components/feedback/NotificationBanner';
import { buildWantedRecord } from '../../utils/arrestWantedMedia';

const WantedDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { templates } = useSettings();
  const { can } = usePermissions();

  const [wantedPerson, setWantedPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showCrimeInfo, setShowCrimeInfo] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const canManage = can('wanted_manage');

  useEffect(() => {
    const fetchWanted = async () => {
      setLoading(true);
      try {
        const { data: wantedData, error: wantedError } = await supabase
          .from('procurados')
          .select('*')
          .eq('id', id)
          .single();

        if (wantedError) throw wantedError;

        let linkedBo = null;
        if (wantedData.bo_id) {
          const { data: boData } = await supabase
            .from('boletins')
            .select('id, comunicante, descricao')
            .eq('id', wantedData.bo_id)
            .maybeSingle();
          linkedBo = boData || null;
        }

        setWantedPerson(buildWantedRecord(wantedData, linkedBo));
      } catch (error) {
        console.error('Erro ao carregar procurado:', error);
        setNotification({
          type: 'error',
          message: error?.message || 'Nao foi possivel carregar os detalhes do procurado.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWanted();
  }, [id]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const additionalMedia = useMemo(
    () => (wantedPerson?.mediaEntries || []).filter((entry) => entry.url !== wantedPerson?.image),
    [wantedPerson]
  );

  const handleGenerateFile = async () => {
    if (!wantedPerson) return;
    try {
      await generateProfessionalPDF(
        wantedPerson,
        user,
        templates?.wanted,
        'wanted',
        templates?.__layoutConfig?.wanted,
        templates?.__pageHeaderConfig
      );
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel gerar o PDF do procurado.'
      });
    }
  };

  const handleArrest = () => {
    if (!wantedPerson) return;

    navigate('/dashboard/arrest', {
      state: {
        wantedPerson: {
          id: wantedPerson.id,
          name: wantedPerson.name,
          document: wantedPerson.document,
          reason: wantedPerson.crime || wantedPerson.reason,
          image: wantedPerson.image
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <NotificationBanner notification={notification} onClose={() => setNotification(null)} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/wanted')}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para procurados
          </button>
          <h2 className="mt-3 text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={26} />
            Ficha do Procurado
          </h2>
          <p className="text-slate-400 mt-1">Visualização completa do procurado com fotos, recompensa e dados do mandado.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerateFile}
            disabled={!wantedPerson || loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors"
          >
            <Printer size={18} />
            Imprimir Ficha
          </button>
          {canManage && (
            <button
              type="button"
              onClick={handleArrest}
              disabled={!wantedPerson || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors"
            >
              <Lock size={18} />
              Confirmar Prisão
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
          Carregando ficha do procurado...
        </div>
      )}

      {!loading && !wantedPerson && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
          Procurado não encontrado.
        </div>
      )}

      {!loading && wantedPerson && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <button
                type="button"
                onClick={() => wantedPerson.image && setSelectedImage({ url: wantedPerson.image, label: 'Foto Principal' })}
                className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative flex items-center justify-center"
              >
                {wantedPerson.image ? (
                  <img src={wantedPerson.image} alt={wantedPerson.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-slate-600">
                    <AlertTriangle size={48} />
                    <span className="text-xs font-bold uppercase mt-2">Sem Foto</span>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-red-600 text-white text-center py-2 font-bold uppercase text-sm">
                  Procurado
                </div>
              </button>
              {wantedPerson.image && (
                <p className="text-xs text-slate-500 mt-3 text-center">Clique na imagem para ampliar</p>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Outras Evidências</h3>
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
                  Nenhuma evidência adicional foi registrada.
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white">{wantedPerson.name}</h3>
                  <p className="text-red-400 font-mono text-sm mt-1">DOC: {wantedPerson.document || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-bold">Recompensa</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {wantedPerson.reward === 'A definir' || !wantedPerson.reward ? 'A definir' : `R$ ${wantedPerson.reward}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Periculosidade</span>
                  <p className="text-white font-bold">{wantedPerson.dangerLevel || wantedPerson.status}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Status</span>
                  <p className="text-red-400 font-bold">{wantedPerson.status || 'Procurado'}</p>
                </div>
              </div>

              {wantedPerson.linkedBo && (
                <div className="mt-4 bg-federal-500/10 p-4 rounded-xl border border-federal-500/20">
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">BO Responsável</span>
                  <div className="text-white font-medium">{wantedPerson.linkedBo.comunicante}</div>
                  <p className="text-slate-400 text-sm mt-1">{wantedPerson.linkedBo.descricao}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCrimeInfo((value) => !value)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Motivo</p>
                  <h4 className="text-lg font-bold text-white mt-1">Clique para visualizar a justificativa</h4>
                </div>
                {showCrimeInfo ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
              </button>

              {showCrimeInfo && (
                <div className="px-6 pb-6">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 uppercase font-bold block mb-2">Crimes / Motivo</span>
                    <p className="text-slate-300 whitespace-pre-line">{wantedPerson.crime || wantedPerson.reason || 'Não informado.'}</p>
                  </div>
                </div>
              )}
            </div>

            {wantedPerson.observations && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <span className="text-xs text-slate-500 uppercase font-bold block mb-3">Observações</span>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{wantedPerson.observations}</p>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-slate-400">
                <FileText size={16} />
                <span className="text-sm">Ações rápidas da ficha</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerateFile}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors"
                >
                  <Printer size={18} />
                  Imprimir Ficha Completa
                </button>
                {canManage && (
                  <button
                    type="button"
                    onClick={handleArrest}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                  >
                    <Lock size={18} />
                    Transformar em Prisão
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="relative w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <p className="text-sm font-bold text-white">{selectedImage.label}</p>
                <p className="text-xs text-slate-500">Visualização ampliada da foto do procurado</p>
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

export default WantedDetail;
