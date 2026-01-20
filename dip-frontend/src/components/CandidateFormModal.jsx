import React, { useState } from 'react';
import { ChevronRight, X, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CandidateFormModal = ({ isOpen, onClose }) => {
  // Candidate Form
  const [candidateForm, setCandidateForm] = useState({
    nome: '',
    telefone: '',
    mensagem: ''
  });
  const [formStatus, setFormStatus] = useState('idle'); // idle, submitting, success, error
  
  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizStatus, setQuizStatus] = useState('idle'); // idle, success, failed

  const quizQuestions = [
    {
      id: 1,
      question: 'Onde está localizada a Academia Nacional de Polícia (ANP), responsável pela formação de todos os Policiais Federais?',
      options: [
        { id: 'a', text: 'Rio de Janeiro/RJ' },
        { id: 'b', text: 'Brasília/DF' },
        { id: 'c', text: 'São Paulo/SP' }
      ],
      correct: 'b'
    },
    {
      id: 2,
      question: 'Qual é o requisito básico de escolaridade para ingresso em qualquer cargo da carreira policial federal (Agente, Escrivão, Papiloscopista, Delegado e Perito)?',
      options: [
        { id: 'a', text: 'Nível Médio' },
        { id: 'b', text: 'Nível Superior' },
        { id: 'c', text: 'Nível Fundamental' }
      ],
      correct: 'b'
    },
    {
      id: 3,
      question: 'O Teste de Aptidão Física (TAF) é uma etapa eliminatória do concurso. O que ele avalia?',
      options: [
        { id: 'a', text: 'Conhecimentos jurídicos' },
        { id: 'b', text: 'A capacidade física do candidato para desempenhar as atividades policiais' },
        { id: 'c', text: 'A saúde mental' }
      ],
      correct: 'b'
    },
    {
      id: 4,
      question: 'Durante o Curso de Formação Profissional na ANP, qual é o status do aluno?',
      options: [
        { id: 'a', text: 'Ele já é policial nomeado' },
        { id: 'b', text: 'Ele recebe uma bolsa de auxílio financeiro (50% do subsídio) e dedicação exclusiva' },
        { id: 'c', text: 'Ele trabalha voluntariamente' }
      ],
      correct: 'b'
    },
    {
      id: 5,
      question: 'Qual é o regime de trabalho exigido para o cargo de Policial Federal?',
      options: [
        { id: 'a', text: 'Regime de meio período' },
        { id: 'b', text: 'Dedicação integral e exclusiva (salvo magistério)' },
        { id: 'c', text: 'Trabalho remoto opcional' }
      ],
      correct: 'b'
    },
    {
      id: 6,
      question: 'Qual a idade mínima exigida para a matrícula no Curso de Formação Profissional?',
      options: [
        { id: 'a', text: '21 anos' },
        { id: 'b', text: '18 anos completos' },
        { id: 'c', text: '25 anos' }
      ],
      correct: 'b'
    },
    {
      id: 7,
      question: 'A Investigação Social é uma etapa do concurso que visa avaliar:',
      options: [
        { id: 'a', text: 'A conta bancária do candidato' },
        { id: 'b', text: 'A conduta irrepreensível e a idoneidade moral do candidato' },
        { id: 'c', text: 'As notas escolares do ensino fundamental' }
      ],
      correct: 'b'
    },
    {
      id: 8,
      question: 'Sobre o porte de arma de fogo do Policial Federal, é correto afirmar:',
      options: [
        { id: 'a', text: 'Só pode usar em serviço' },
        { id: 'b', text: 'É prerrogativa do cargo, com validade em todo o território nacional' },
        { id: 'c', text: 'Não tem direito a porte' }
      ],
      correct: 'b'
    },
    {
      id: 9,
      question: 'Conforme a Constituição Federal (Art. 144), a Polícia Federal é organizada e mantida pela União como órgão:',
      options: [
        { id: 'a', text: 'Temporário' },
        { id: 'b', text: 'Permanente' },
        { id: 'c', text: 'Terceirizado' }
      ],
      correct: 'b'
    },
    {
      id: 10,
      question: 'Qual é a principal lei que rege o regime disciplinar e o estatuto dos Policiais Federais?',
      options: [
        { id: 'a', text: 'CLT' },
        { id: 'b', text: 'Lei 4.878/65' },
        { id: 'c', text: 'Código Comercial' }
      ],
      correct: 'b'
    },
    {
      id: 11,
      question: 'Quais são os dois pilares fundamentais da função policial previstos em lei?',
      options: [
        { id: 'a', text: 'Força e Velocidade' },
        { id: 'b', text: 'Hierarquia e Disciplina' },
        { id: 'c', text: 'Armas e Distintivos' }
      ],
      correct: 'b'
    },
    {
      id: 12,
      question: 'Ao ser aprovado em todas as etapas e nomeado, em qual classe o Policial Federal ingressa na carreira?',
      options: [
        { id: 'a', text: 'Classe Especial' },
        { id: 'b', text: '3ª Classe (ou classe inicial da carreira)' },
        { id: 'c', text: 'Diretor' }
      ],
      correct: 'b'
    },
    {
      id: 13,
      question: 'Qual categoria de Carteira Nacional de Habilitação (CNH) é exigida no concurso da PF?',
      options: [
        { id: 'a', text: 'Categoria A apenas' },
        { id: 'b', text: 'Categoria B ou superior' },
        { id: 'c', text: 'Não precisa de CNH' }
      ],
      correct: 'b'
    },
    {
      id: 14,
      question: 'A primeira lotação do Policial Federal recém-formado ocorre preferencialmente em:',
      options: [
        { id: 'a', text: 'Sua cidade natal' },
        { id: 'b', text: 'Regiões de fronteira e na Amazônia Legal' },
        { id: 'c', text: 'Capitais do litoral' }
      ],
      correct: 'b'
    },
    {
      id: 15,
      question: 'O Exame Psicotécnico visa aferir:',
      options: [
        { id: 'a', text: 'Conhecimentos de matemática' },
        { id: 'b', text: 'Perfil psicológico compatível com o cargo e porte de arma' },
        { id: 'c', text: 'Capacidade de memorização' }
      ],
      correct: 'b'
    },
    {
      id: 16,
      question: 'Qual cargo da Polícia Federal exige bacharelado em Direito e 3 anos de atividade jurídica ou policial?',
      options: [
        { id: 'a', text: 'Agente' },
        { id: 'b', text: 'Delegado de Polícia Federal' },
        { id: 'c', text: 'Perito' }
      ],
      correct: 'b'
    },
    {
      id: 17,
      question: 'O que acontece com o candidato que é reprovado no Curso de Formação na ANP?',
      options: [
        { id: 'a', text: 'Tenta de novo no mês seguinte' },
        { id: 'b', text: 'É eliminado do concurso público' },
        { id: 'c', text: 'Paga uma multa e continua' }
      ],
      correct: 'b'
    },
    {
      id: 18,
      question: 'O combate ao crime organizado e à corrupção é uma prioridade da PF. Quem conduz o Inquérito Policial?',
      options: [
        { id: 'a', text: 'O Agente' },
        { id: 'b', text: 'O Delegado de Polícia Federal' },
        { id: 'c', text: 'O Juiz' }
      ],
      correct: 'b'
    },
    {
      id: 19,
      question: 'A Polícia Federal é subordinada administrativamente a qual órgão?',
      options: [
        { id: 'a', text: 'Ministério da Defesa' },
        { id: 'b', text: 'Ministério da Justiça e Segurança Pública' },
        { id: 'c', text: 'Gabinete de Segurança Institucional' }
      ],
      correct: 'b'
    },
    {
      id: 20,
      question: 'Qual é o lema não oficial frequentemente associado aos valores de integridade da PF?',
      options: [
        { id: 'a', text: 'Aos amigos tudo, aos inimigos a lei' },
        { id: 'b', text: 'Lealdade, Integridade e Eficiência (valores institucionais)' },
        { id: 'c', text: 'Salve-se quem puder' }
      ],
      correct: 'b'
    }
  ];

  const handleStartQuiz = (e) => {
    e.preventDefault();
    setShowQuiz(true);
  };

  const handleQuizAnswer = (questionId, optionId) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleQuizSubmit = async () => {
    let score = 0;
    quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correct) {
        score++;
      }
    });

    if (score >= 10) {
      setQuizStatus('success');
      await submitApplication(score);
    } else {
      setQuizStatus('failed');
    }
  };

  const handleRetryQuiz = () => {
    setQuizStatus('idle');
    setQuizAnswers({});
  };

  const sendDiscordNotification = async (formData, score) => {
    try {
      console.log('🔄 Tentando buscar configuração do Discord...');
      
      // Tentar buscar URL do webhook
      const { data: settingsData, error: dbError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'discord_config')
        .maybeSingle(); // Use maybeSingle to avoid error on no rows

      if (dbError) {
        console.error('❌ Erro de permissão/banco ao buscar Discord Config:', dbError);
        // Tentar fallback hardcoded ou alertar
        return;
      }

      if (!settingsData) {
        console.error('❌ Configuração discord_config não encontrada no banco (linhas = 0).');
        return;
      }

      let webhookUrl = settingsData?.value?.formsWebhook || settingsData?.value?.webhookUrl;

      // Fallback: Check if value is string (should be jsonb but safety first)
      if (!webhookUrl && typeof settingsData.value === 'string') {
        try {
            const parsed = JSON.parse(settingsData.value);
            webhookUrl = parsed.formsWebhook || parsed.webhookUrl;
        } catch (e) {
            console.warn('Erro ao fazer parse manual do JSON:', e);
        }
      }

      if (!webhookUrl) {
        console.warn('⚠️ Nenhuma URL de Webhook configurada no banco (formsWebhook ou webhookUrl vazios).');
        console.log('Dados recebidos:', settingsData.value);
        return;
      }

      console.log('✅ URL encontrada. Enviando notificação...');

      const embed = {
        title: "📝 Nova Candidatura Recebida",
        color: 0x1e293b, // Slate 800
        fields: [
          { name: "👤 Nome / Discord", value: formData.nome || 'N/A', inline: true },
          { name: "📱 Telefone", value: formData.telefone || 'N/A', inline: true },
          { name: "✅ Pontuação Quiz", value: `${score}/10` || 'N/A', inline: true },
          { name: "📄 Motivação", value: formData.mensagem || 'N/A' }
        ],
        footer: { text: "Sistema de Recrutamento Polícia Federal" },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (response.ok) {
        console.log('✅ Notificação enviada com sucesso para o Discord!');
      } else {
        console.error(`❌ Falha ao enviar para Discord: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Erro crítico ao enviar notificação Discord:', error);
    }
  };

  const submitApplication = async (score) => {
    setFormStatus('submitting');
    try {
      const { error } = await supabase
        .from('candidatos')
        .insert([{
          nome: candidateForm.nome,
          telefone: candidateForm.telefone,
          mensagem: candidateForm.mensagem,
          pontuacao_quiz: score
        }]);

      if (error) throw error;

      // Enviar notificação
      await sendDiscordNotification(candidateForm, score);

      setFormStatus('success');
      setCandidateForm({ nome: '', telefone: '', mensagem: '' });
      setTimeout(() => {
        setFormStatus('idle');
        setShowQuiz(false);
        setQuizStatus('idle');
        setQuizAnswers({});
        onClose(); // Close modal on success
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar candidatura:', error);
      setFormStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl animate-fade-in-up overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative p-8 md:p-12">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {!showQuiz ? (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-4">Candidatura à Polícia Federal</h2>
                <p className="text-slate-400">
                  Preencha o formulário e faça o teste de admissão para demonstrar seu interesse em fazer parte da 
                  nossa equipe de elite.
                </p>
              </div>

              <form onSubmit={handleStartQuiz} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Nome no Discord</label>
                    <input 
                      type="text" 
                      required
                      value={candidateForm.nome}
                      onChange={(e) => setCandidateForm({...candidateForm, nome: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors"
                      placeholder="Ex: usuario#1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Telefone / WhatsApp (In-Game)</label>
                    <input 
                      type="tel" 
                      required
                      value={candidateForm.telefone}
                      onChange={(e) => setCandidateForm({...candidateForm, telefone: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Por que você quer fazer parte da Polícia Federal?</label>
                  <textarea 
                    required
                    value={candidateForm.mensagem}
                    onChange={(e) => setCandidateForm({...candidateForm, mensagem: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors h-32 resize-none"
                    placeholder="Conte-nos sobre sua experiência e motivações..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all hover:-translate-y-1 shadow-lg shadow-federal-900/20 flex items-center justify-center gap-2"
                >
                  Iniciar Teste de Admissão
                  <ChevronRight size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-8 animate-fade-in-up">
              {quizStatus === 'idle' && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Teste de Admissão</h2>
                    <p className="text-slate-400">Responda corretamente a pelo menos 10 das 20 questões para enviar sua candidatura.</p>
                  </div>

                  <div className="space-y-6">
                    {quizQuestions.map((q, index) => (
                      <div key={q.id} className="bg-slate-950/50 p-6 rounded-xl border border-slate-800">
                        <p className="text-white font-bold mb-4 flex gap-3">
                          <span className="text-federal-500">#{index + 1}</span>
                          {q.question}
                        </p>
                        <div className="space-y-3">
                          {q.options.map((opt) => (
                            <label 
                              key={opt.id} 
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                                quizAnswers[q.id] === opt.id 
                                  ? 'bg-federal-500/20 border-federal-500 text-white' 
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name={`question-${q.id}`} 
                                value={opt.id}
                                checked={quizAnswers[q.id] === opt.id}
                                onChange={() => handleQuizAnswer(q.id, opt.id)}
                                className="hidden"
                              />
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                quizAnswers[q.id] === opt.id ? 'border-federal-500' : 'border-slate-600'
                              }`}>
                                {quizAnswers[q.id] === opt.id && <div className="w-2 h-2 rounded-full bg-federal-500" />}
                              </div>
                              <span className="text-sm">{opt.text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowQuiz(false)}
                      className="w-1/3 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                    >
                      Voltar
                    </button>
                    <button 
                      type="button"
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < 20}
                      className={`w-2/3 py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        Object.keys(quizAnswers).length < 20
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-federal-600 hover:bg-federal-500 text-white hover:-translate-y-1 shadow-lg shadow-federal-900/20'
                      }`}
                    >
                      Enviar Respostas
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </>
              )}

              {quizStatus === 'failed' && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-bounce">
                    <X size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Reprovado no Teste</h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Você não atingiu a pontuação mínima necessária (10/20). Estude o regulamento e tente novamente.
                  </p>
                  <button 
                    onClick={handleRetryQuiz}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all hover:-translate-y-1"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {quizStatus === 'success' && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 animate-bounce">
                    <Check size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Aprovado!</h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Parabéns! Sua candidatura foi enviada com sucesso para análise da corregedoria.
                  </p>
                  {formStatus === 'submitting' && (
                    <div className="flex items-center justify-center gap-2 text-federal-500">
                      <span className="w-2 h-2 rounded-full bg-federal-500 animate-pulse" />
                      Enviando dados...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateFormModal;
