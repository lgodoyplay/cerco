import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Image as ImageIcon, Link as LinkIcon, User, Video } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import ProofVideoPlayer from '../../../components/investigations/ProofVideoPlayer';
import { normalizeInvestigationProofUrl, getInvestigationVideoMedia } from '../../../utils/investigationProofMedia';

const TYPE_ICONS = { image: ImageIcon, video: Video, link: LinkIcon };

const normalizeProofType = (type, url = '') => {
  const t = String(type || '').trim().toLowerCase();
  const u = String(url || '').toLowerCase();
  if (t === 'image' || t === 'imagem' || t === 'foto' || /\.(png|jpe?g|gif|webp)(\\?|$)/.test(u)) return 'image';
  if (t === 'vídeo' || t === 'video') return 'video';
  if (t === 'link') return 'link';
  if (t === 'texto') return 'text';
  return t || 'file';
};

const InvestigationProofDetail = () => {
  const { id, proofId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [proof, setProof] = useState(null);
  const [investigationTitle, setInvestigationTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const isRevenueRoute = location.pathname.includes('/revenue/');
  const backToInvestigation = isRevenueRoute
    ? `/dashboard/revenue/investigations/${id}`
    : `/dashboard/investigations/${id}`;

  useEffect(() => {
    const fetchProof = async () => {
      setLoading(true);
      try {
        const [proofRes, invRes] = await Promise.all([
          supabase
            .from('provas')
            .select('*, uploader:profiles!uploaded_by(full_name)')
            .eq('id', proofId)
            .single(),
          supabase
            .from('investigacoes')
            .select('titulo')
            .eq('id', id)
            .single()
        ]);

        if (proofRes.error || !proofRes.data) {
          navigate(backToInvestigation, { replace: true });
          return;
        }

        const ev = proofRes.data;
        const type = normalizeProofType(ev.tipo, ev.url);
        const rawTitle = ev.descricao ? ev.descricao.split(' - ')[0] : 'Evidência';
        const rawDesc = ev.descricao
          ? (ev.descricao.includes(' - ') ? ev.descricao.split(' - ').slice(1).join(' - ') : ev.descricao)
          : '';

        setProof({
          id: ev.id,
          type,
          title: rawTitle,
          description: rawDesc,
          content: ev.url,
          author: ev.uploader?.full_name || 'Agente',
          createdAt: ev.created_at
        });

        if (!invRes.error && invRes.data) {
          setInvestigationTitle(invRes.data.titulo);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProof();
  }, [id, proofId, navigate, backToInvestigation]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto pb-20 flex justify-center items-center min-h-[420px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500" />
      </div>
    );
  }

  if (!proof) return null;

  const normalizedUrl = normalizeInvestigationProofUrl(proof.content);
  const Icon = TYPE_ICONS[proof.type] || FileText;

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      <button type="button" onClick={() => navigate(backToInvestigation)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
        <ArrowLeft size={16} /> Voltar para Investigação
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Detalhe da Prova</p>
            <h1 className="text-3xl font-bold text-white">{proof.title}</h1>
            <p className="text-slate-400 mt-2">{proof.description}</p>
          </div>
          <div className="text-sm text-slate-400 shrink-0">
            {investigationTitle && <p>Investigação: <span className="text-white font-medium">{investigationTitle}</span></p>}
            <p className="mt-1">Autor: <span className="text-white font-medium">{proof.author}</span></p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
          {proof.type === 'image' && (
            <img src={proof.content} alt={proof.title} className="w-full max-h-[42rem] object-contain rounded-xl" />
          )}
          {proof.type === 'video' && (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
              <ProofVideoPlayer url={proof.content} title={proof.title} />
            </div>
          )}
          {proof.type === 'link' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-blue-400">
                <LinkIcon size={20} />
                <span className="break-all">{normalizedUrl}</span>
              </div>
              <button type="button" onClick={() => window.open(normalizedUrl, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors">
                <ExternalLink size={16} /> Abrir link
              </button>
            </div>
          )}
          {(proof.type === 'text' || proof.type === 'file') && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 whitespace-pre-wrap break-words">
                {proof.content}
              </div>
              {/^https?:\/\//i.test(normalizedUrl) && (
                <button type="button" onClick={() => window.open(normalizedUrl, '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                  <ExternalLink size={16} /> Abrir arquivo externo
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <Icon size={18} className="text-federal-400" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Tipo</p>
              <p className="text-white font-medium capitalize">{proof.type}</p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <User size={18} className="text-federal-400" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Autor</p>
              <p className="text-white font-medium">{proof.author}</p>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Data</p>
            <p className="text-white font-medium">{new Date(proof.createdAt).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigationProofDetail;
