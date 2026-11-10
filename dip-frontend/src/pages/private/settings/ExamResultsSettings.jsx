import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Inbox, Search, CheckCircle2, Phone, Clock, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ExamResultsSettings = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('candidatos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setResults(data || []);
      } catch (error) {
        console.error('Erro ao buscar resultados de prova:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const filtered = results.filter((item) => {
    const term = searchTerm.toLowerCase();
    const combined = [
      item.nome,
      item.telefone,
      item.discord_user,
      item.cidade,
      item.codigo_identificacao,
      item.status,
      item.mensagem
    ].filter(Boolean).join(' ').toLowerCase();

    return combined.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-federal-500" />
            Resultados do recrutamento
          </h2>
          <p className="text-slate-400">
            Acompanhe o desempenho das 3 etapas e a situação final do candidato no processo de recrutamento.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, código ou Discord..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-federal-500 w-full md:w-72"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          Carregando resultados de prova...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
          <Inbox size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">Nenhum resultado registrado até o momento.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{item.nome}</h3>
                    {item.created_at && !Number.isNaN(new Date(item.created_at).getTime()) && (
                      <span className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 flex items-center gap-1">
                        <Clock size={12} />
                        {format(new Date(item.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-federal-500" />
                      <span>
                        Total: {item.pontuacao_total ?? item.pontuacao_quiz ?? 0}/15
                      </span>
                    </div>
                    {item.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-federal-500" />
                        <span>{item.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                  <span className="text-slate-400 block text-xs uppercase tracking-[0.15em]">Status</span>
                  <span className="font-bold text-white">{item.status || 'Pendente'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-slate-300">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-xs uppercase text-slate-500 block mb-1">Código</span>
                  <span className="font-semibold text-white">{item.codigo_identificacao || '—'}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-xs uppercase text-slate-500 block mb-1">Etapa 1</span>
                  <span className="font-semibold text-white">{item.pontuacao_etapa_1 ?? 0}/5</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-xs uppercase text-slate-500 block mb-1">Etapa 2</span>
                  <span className="font-semibold text-white">{item.pontuacao_etapa_2 ?? 0}/5</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-xs uppercase text-slate-500 block mb-1">Etapa 3</span>
                  <span className="font-semibold text-white">{item.pontuacao_etapa_3 ?? 0}/5</span>
                </div>
              </div>

              {item.mensagem && (
                <p className="text-xs text-slate-400 break-words">
                  {item.mensagem}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamResultsSettings;

