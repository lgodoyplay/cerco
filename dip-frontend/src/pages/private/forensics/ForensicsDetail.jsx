import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSearch, Calendar, MapPin, User, Car, Youtube, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ForensicsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [forensic, setForensic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pericias')
          .select(`
            *,
            pericia_fotos (*),
            profiles:created_by (id, full_name, badge, role)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          navigate('/dashboard/forensics');
          return;
        }

        const mapped = {
          ...data,
          officer: data.profiles || null,
        };

        setForensic(mapped);
      } catch (error) {
        console.error('Erro ao buscar detalhes da perícia:', error);
        navigate('/dashboard/forensics');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto pb-10">
        <button
          onClick={() => navigate('/dashboard/forensics')}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-federal-500 mb-4" />
          <p className="text-slate-400">Carregando perícia...</p>
        </div>
      </div>
    );
  }

  if (!forensic) return null;

  const getTypeIcon = type => {
    if (type === 'Pessoa') return <User size={18} className="text-blue-400" />;
    if (type === 'Local') return <MapPin size={18} className="text-emerald-400" />;
    if (type === 'Veículo') return <Car size={18} className="text-orange-400" />;
    return <FileSearch size={18} className="text-slate-400" />;
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <button
        onClick={() => navigate('/dashboard/forensics')}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Voltar para Perícias
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-federal-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-700">
                  {getTypeIcon(forensic.type)}
                  {forensic.type}
                </span>
                <span className="text-slate-500 text-xs flex items-center gap-1">
                  <Calendar size={12} />
                  {forensic.created_at &&
                    format(new Date(forensic.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {forensic.title || 'Perícia sem título'}
              </h1>
              {forensic.officer && (
                <p className="text-slate-400 text-sm flex items-center gap-2">
                  <User size={14} className="text-slate-500" />
                  Responsável: {forensic.officer.full_name}
                  {forensic.officer.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] border border-slate-700">
                      {forensic.officer.badge}
                    </span>
                  )}
                </p>
              )}
            </div>

            {forensic.youtube_link && (
              <a
                href={forensic.youtube_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/10 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-600/20 transition-colors"
              >
                <Youtube size={16} />
                Ver Vídeo no YouTube
              </a>
            )}
          </div>

          {forensic.description && (
            <div className="mt-2">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
                Descrição Geral
              </h2>
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                {forensic.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="text-federal-500" size={22} />
            Evidências Fotográficas Arquivadas
          </h2>
          <span className="text-xs text-slate-400">
            {forensic.pericia_fotos?.length || 0} arquivo(s) anexado(s)
          </span>
        </div>

        {forensic.pericia_fotos && forensic.pericia_fotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {forensic.pericia_fotos
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
              .map(photo => (
                <div
                  key={photo.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-video bg-slate-950">
                    <img
                      src={photo.url}
                      alt={photo.description || 'Evidência da perícia'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 border-t border-slate-800">
                    <p className="text-slate-200 text-sm">
                      {photo.description || 'Sem descrição da evidência.'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Arquivada em{' '}
                      {photo.created_at
                        ? format(new Date(photo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : 'Data desconhecida'}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="py-12 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
            <ImageIcon size={40} className="mb-4 opacity-30" />
            <p className="font-medium">Nenhuma evidência fotográfica arquivada para esta perícia.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForensicsDetail;

