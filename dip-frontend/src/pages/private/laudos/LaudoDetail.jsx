import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  ArrowLeft,
  Calendar,
  User,
  Trash2,
  FileText,
  Download
} from 'lucide-react';
import { useLaudos } from '../../../hooks/useLaudos';
import { usePermissions } from '../../../hooks/usePermissions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LaudoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { laudos, loading, deleteLaudo, fetchLaudos, getLaudo } = useLaudos();
  const { can } = usePermissions();
  const [laudo, setLaudo] = useState(null);
  const canManage = can('laudos_manage');

  useEffect(() => {
    const fetchData = async () => {
      if (laudos.length > 0) {
        const found = laudos.find(l => l.id === parseInt(id));
        setLaudo(found);
      } else {
        const data = await getLaudo(parseInt(id));
        setLaudo(data);
      }
    };
    fetchData();
  }, [id, laudos, getLaudo]);

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja deletar este laudo?')) {
      try {
        await deleteLaudo(parseInt(id));
        navigate('/dashboard/laudos');
      } catch (error) {
        console.error('Erro ao deletar laudo:', error);
      }
    }
  };

  if (loading || !laudo) {
    return (
      <div className="max-w-4xl mx-auto py-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Carregando laudo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/dashboard/laudos" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          Voltar para Laudos
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Stethoscope className="text-federal-500" size={32} />
              {laudo.paciente_nome}
            </h2>
            <p className="text-slate-400 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-700">
                {laudo.tipo_laudo}
              </span>
            </p>
          </div>
          {canManage && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 text-red-400 hover:text-red-300 rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <Trash2 size={18} />
              Deletar Laudo
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Informações Básicas */}
        <div className="grid md:grid-cols-2 gap-6 pb-6 border-b border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Documento do Paciente</label>
            <p className="text-white font-medium">{laudo.paciente_documento}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Data de Criação</label>
            <p className="text-white font-medium flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" />
              {format(new Date(laudo.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          {laudo.officer && (
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Criado por</label>
              <p className="text-white font-medium flex items-center gap-2">
                <User size={16} className="text-slate-500" />
                {laudo.officer.full_name}
              </p>
            </div>
          )}
        </div>

        {/* Arquivos */}
        {laudo.laudo_arquivos && laudo.laudo_arquivos.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Arquivos</label>
            <div className="grid gap-3">
              {laudo.laudo_arquivos.map((arquivo, idx) => (
                <a 
                  key={idx}
                  href={arquivo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-federal-500/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    {arquivo.url?.toLowerCase().endsWith('.pdf') ? (
                      <FileText size={20} className="text-red-400" />
                    ) : (
                      <FileText size={20} className="text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">
                      {arquivo.descricao || 'Arquivo ' + (idx + 1)}
                    </p>
                    {arquivo.descricao && (
                      <p className="text-slate-500 text-xs mt-1">{arquivo.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={arquivo.url}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo do Laudo */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Conteúdo do Laudo</label>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-300 whitespace-pre-wrap">{laudo.conteudo}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaudoDetail;