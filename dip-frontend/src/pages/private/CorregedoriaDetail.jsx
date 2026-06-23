import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, ArrowLeft, Calendar, ExternalLink, Image as ImageIcon, Video, FileText, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { parseCorregedoriaAttachment } from '../../utils/corregedoriaMedia';

const openExternalLink = (url) => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const renderAttachmentIcon = (attachment) => {
  if (attachment.isVideo) return <Video size={18} className="text-purple-400" />;
  if (attachment.isImage) return <ImageIcon size={18} className="text-sky-400" />;
  if (attachment.isLink) return <LinkIcon size={18} className="text-blue-400" />;
  return <FileText size={18} className="text-yellow-400" />;
};

const CorregedoriaDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [denuncia, setDenuncia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDenuncia = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('corregedoria')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setDenuncia(data);
      } catch (error) {
        console.error('Erro ao carregar denúncia:', error);
        setDenuncia(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDenuncia();
  }, [id]);

  const attachments = useMemo(
    () => (denuncia?.arquivos || []).map(parseCorregedoriaAttachment).filter((item) => item.url),
    [denuncia]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!denuncia) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard/corregedoria')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
          <p className="text-slate-400">Denúncia não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/corregedoria')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Voltar para Corregedoria
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield size={30} className="text-red-500" />
            Detalhes da Denúncia
          </h1>
          <p className="text-slate-400 mt-2">Visualize o relato completo, provas, imagens e vídeos.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Nome do envio</p>
              <p className="text-white text-lg font-semibold">{denuncia.nome || 'Denúncia Anônima'}</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Data e hora</p>
              <p className="text-white text-lg font-semibold flex items-center gap-2">
                <Calendar size={16} className="text-slate-500" />
                {format(new Date(denuncia.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Detalhes</p>
            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{denuncia.detalhes}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Arquivos e Provas</h2>
              <p className="text-sm text-slate-400">Links, imagens e vídeos anexados na denúncia.</p>
            </div>
            <span className="text-xs text-slate-500">{attachments.length} item(s)</span>
          </div>

          {attachments.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum anexo enviado.</p>
          ) : (
            <div className="grid gap-5">
              {attachments.map((attachment, index) => (
                <div key={`${attachment.url}-${index}`} className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {renderAttachmentIcon(attachment)}
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{attachment.displayName}</p>
                        <p className="text-xs text-slate-500 truncate">{attachment.url}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openExternalLink(attachment.url)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      <ExternalLink size={16} />
                      Abrir em nova aba
                    </button>
                  </div>

                  {attachment.isImage && (
                    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
                      <img src={attachment.url} alt={attachment.displayName} className="w-full max-h-[34rem] object-contain" />
                    </div>
                  )}

                  {attachment.youtubeEmbedUrl && (
                    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black aspect-video">
                      <iframe
                        src={attachment.youtubeEmbedUrl}
                        title={attachment.displayName}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {attachment.isVideoFile && (
                    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-black">
                      <video src={attachment.url} controls className="w-full max-h-[34rem]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CorregedoriaDetail;
