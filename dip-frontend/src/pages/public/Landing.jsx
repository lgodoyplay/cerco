import React, { useState } from 'react';
import { Shield, AlertTriangle, Megaphone, MapPin, Phone, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';

const Landing = () => {
  const { discordConfig } = useSettings();
  const [reportForm, setReportForm] = useState({
    descricao: '',
    localizacao: '',
    contato: ''
  });
  const [reportStatus, setReportStatus] = useState('idle');
  const [reportError, setReportError] = useState('');

  const isReportValid = () => {
    return reportForm.descricao.trim().length > 0;
  };

  const handleReportChange = (e) => {
    const { name, value } = e.target;
    setReportForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!isReportValid() || reportStatus === 'loading') return;

    setReportStatus('loading');
    setReportError('');

    try {
      const { error } = await supabase.from('denuncias').insert([
        {
          descricao: reportForm.descricao,
          localizacao: reportForm.localizacao || null,
          contato: reportForm.contato || null
        }
      ]);

      if (error) throw error;

      // Enviar notificação para o Discord se configurado
      if (discordConfig?.reportsWebhook) {
        try {
          const embed = {
            title: "📢 Nova Denúncia Anônima",
            description: reportForm.descricao,
            color: 0xeab308, // Yellow
            fields: [
              { name: "Localização", value: reportForm.localizacao || "Não informada", inline: true },
              { name: "Contato", value: reportForm.contato || "Anônimo", inline: true },
              { name: "Status", value: "Pendente", inline: true }
            ],
            footer: { text: "Sistema de Denúncias" },
            timestamp: new Date().toISOString()
          };

          await fetch(discordConfig.reportsWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
          });
        } catch (webhookError) {
          console.error('Erro ao enviar webhook:', webhookError);
          // Não falhar o envio da denúncia se o webhook falhar
        }
      }

      setReportStatus('success');
      setReportForm({ descricao: '', localizacao: '', contato: '' });
    } catch (err) {
      setReportStatus('error');
      setReportError('Ocorreu um erro ao registrar sua denúncia. Tente novamente em instantes.');
    }
  };

  return (
    <div className="bg-slate-950">
      <section className="relative overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-x-0 -top-32 h-64 bg-gradient-to-b from-federal-600/20 to-transparent blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700 text-federal-200 text-xs font-semibold uppercase tracking-[0.18em]">
              <Shield size={16} className="text-federal-400" />
              <span>Polícia Federal - DPF</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
              Sistema Operacional da Polícia Federal.
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl">
              Painel integrado para prisões, procurados, investigações, perícias e inteligência,
              construído para uso em ambiente de roleplay com foco em realismo operacional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-federal-600 hover:bg-federal-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-federal-900/40 transition-transform hover:-translate-y-0.5"
              >
                Acessar Painel Restrito
              </a>
              <a
                href="/curso-dpf"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-100 font-semibold text-sm tracking-wide transition-colors"
              >
                Conhecer Curso DPF
              </a>
            </div>
          </div>
          <div className="flex-1 w-full max-w-md lg:max-w-lg">
            <div className="relative rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.4),transparent_55%)]" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-federal-700 flex items-center justify-center">
                      <Shield className="text-federal-300" size={26} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                        Ambiente Restrito
                      </p>
                      <p className="text-sm font-medium text-slate-100">
                        Operações, prisões e investigações
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                    Monitorado
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>
                    Todos os acessos são registrados para fins de auditoria. Utilize seus dados de login
                    apenas em ambiente autorizado pela chefia.
                  </p>
                  <p>
                    Este sistema é projetado para uso em simulações e roleplay, sem vínculo com a instituição
                    real, mas com linguagem e estrutura inspiradas na rotina policial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
              Operações
            </p>
            <h2 className="text-lg font-bold text-white">
              Prisões, procurados e investigações
            </h2>
            <p className="text-sm text-slate-300">
              Registro completo de prisões, controle de alvos procurados e acompanhamento de
              investigações em andamento, tudo em um só lugar.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
              Inteligência
            </p>
            <h2 className="text-lg font-bold text-white">
              Perícias e provas digitais
            </h2>
            <p className="text-sm text-slate-300">
              Módulo de perícia com fotos, descrições técnicas e integração com investigações, para
              reconstruir cada ocorrência com precisão.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
              Formação
            </p>
            <h2 className="text-lg font-bold text-white">
              Treinamentos e cursos internos
            </h2>
            <p className="text-sm text-slate-300">
              Acesso a conteúdos como o Curso de Formação Institucional DPF, reforçando a
                doutrina e os valores da corporação.
              </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-federal-600/20 border border-federal-500/60 flex items-center justify-center">
                <Megaphone className="text-federal-200" size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-federal-200">
                  Denúncia Anônima
                </p>
                <p className="text-sm text-slate-100">
                  Registre informações importantes sem se identificar.
                </p>
              </div>
            </div>
            <form onSubmit={handleReportSubmit} className="px-6 sm:px-8 py-6 space-y-4">
              {reportStatus === 'success' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-900/40 border border-emerald-500/40 text-emerald-100 text-sm">
                  <CheckCircle size={18} />
                  <span>Denúncia registrada com sucesso. Ela será encaminhada para análise.</span>
                </div>
              )}
              {reportStatus === 'error' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/40 border border-red-500/40 text-red-100 text-sm">
                  <AlertTriangle size={18} />
                  <span>{reportError}</span>
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-[0.18em]">
                  Descrição da Denúncia
                </label>
                <textarea
                  name="descricao"
                  value={reportForm.descricao}
                  onChange={handleReportChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none resize-none text-sm"
                  placeholder="Conte o que está acontecendo, quem está envolvido, horários, veículos, locais próximos..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-[0.18em]">
                  Local aproximado
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-slate-600" size={18} />
                  <input
                    type="text"
                    name="localizacao"
                    value={reportForm.localizacao}
                    onChange={handleReportChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none text-sm"
                    placeholder="Bairro, rua ou ponto de referência (opcional)"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-[0.18em]">
                  Contato para retorno
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 text-slate-600" size={18} />
                  <input
                    type="text"
                    name="contato"
                    value={reportForm.contato}
                    onChange={handleReportChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none text-sm"
                    placeholder="Telefone ou outro contato (opcional)"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Informe um contato apenas se desejar que a equipe possa retornar para tirar dúvidas.
                </p>
              </div>
              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={!isReportValid() || reportStatus === 'loading'}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isReportValid() && reportStatus !== 'loading'
                      ? 'bg-federal-600 hover:bg-federal-500 text-white shadow-lg shadow-federal-900/50 hover:-translate-y-0.5'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  {reportStatus === 'loading' ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  <span>
                    {reportStatus === 'loading' ? 'Enviando...' : 'Enviar Denúncia'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-red-500/40 bg-gradient-to-br from-red-900/30 via-slate-950 to-slate-950 shadow-xl overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-red-500/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/60 flex items-center justify-center">
                <AlertTriangle className="text-red-300" size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                  Aviso Importante
                </p>
                <p className="text-sm text-red-100">
                  Use este canal apenas para denúncias responsáveis.
                </p>
              </div>
            </div>
            <div className="px-6 sm:px-8 py-6 space-y-3 text-sm text-slate-200">
              <p>
                Descreva fatos reais, evitando acusações infundadas ou de cunho pessoal. Toda denúncia
                pode gerar deslocamento de equipes e abertura de investigações.
              </p>
              <p>
                Sempre que houver risco imediato à vida, acione também os canais de emergência do servidor
                ou plataforma em que você está jogando.
              </p>
              <p className="text-slate-400 text-xs">
                Mesmo sendo um ambiente de jogo (RP), buscamos simular com respeito a rotina policial.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-red-500/40 bg-gradient-to-br from-red-900/30 via-slate-950 to-slate-950 shadow-xl overflow-hidden">
          <div className="px-6 sm:px-8 py-6 border-b border-red-500/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/60 flex items-center justify-center">
              <AlertTriangle className="text-red-300" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                Aviso Importante
              </p>
              <p className="text-sm text-red-100">
                Ambiente de roleplay com simulação de rotinas policiais.
              </p>
            </div>
          </div>
          <div className="px-6 sm:px-8 py-6 space-y-3 text-sm text-slate-200">
            <p>
              Este sistema não representa, não substitui e não fala em nome de nenhuma Polícia Federal
              real. Toda a ambientação é ficcional, voltada para entretenimento e treinamento em
              servidores de roleplay.
            </p>
            <p className="text-slate-400 text-xs">
              Ao continuar navegando, você declara ciência de que está em um ambiente de jogo
              (RP) e se compromete a utilizar o sistema de forma responsável e respeitosa.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
