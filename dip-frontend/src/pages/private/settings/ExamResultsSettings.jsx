import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Inbox, Search, CheckCircle2, Phone, Clock } from 'lucide-react';
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
          .eq('status', 'PROVA_DPF')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

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
    const nome = (item.nome || '').toLowerCase();
    const mensagem = (item.mensagem || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return nome.includes(term) || mensagem.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Inbox className="text-federal-500" />
            Resultados da Prova – Curso DPF
          </h2>
          <p className="text-slate-400">
            Acompanhe quem realizou a prova do curso e quantos acertos obteve.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou unidade..."
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
          <p className="text-slate-400">Nenhuma prova registrada até o momento.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
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
                      Acertos: {item.pontuacao_quiz || 0}
                      /20
                    </span>
                  </div>
                  {item.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-federal-500" />
                      <span>{item.telefone}</span>
                    </div>
                  )}
                </div>
                {item.mensagem && (
                  <p className="text-xs text-slate-400 break-words">
                    {item.mensagem}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamResultsSettings;

