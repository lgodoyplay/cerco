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
      question: 'Qual é a principal missão de um Policial Federal?',
      options: [
        { id: 'a', text: 'Ganhar muito dinheiro e ter poder' },
        { id: 'b', text: 'Servir e proteger a sociedade, cumprindo a lei' },
        { id: 'c', text: 'Mandar na cidade' }
      ],
      correct: 'b'
    },
    {
      id: 2,
      question: 'O que significa Hierarquia na Polícia?',
      options: [
        { id: 'a', text: 'Que todos são iguais e ninguém manda em ninguém' },
        { id: 'b', text: 'Respeito aos níveis de comando e subordinação funcional' },
        { id: 'c', text: 'Que o mais velho de idade manda mais' }
      ],
      correct: 'b'
    },
    {
      id: 3,
      question: 'O que é Disciplina?',
      options: [
        { id: 'a', text: 'Fazer o que quiser quando ninguém está olhando' },
        { id: 'b', text: 'Obediência às regras, normas e ordens superiores' },
        { id: 'c', text: 'Castigar as pessoas' }
      ],
      correct: 'b'
    },
    {
      id: 4,
      question: 'Como deve ser o tratamento do policial com o cidadão?',
      options: [
        { id: 'a', text: 'Agressivo e intimidaddor sempre' },
        { id: 'b', text: 'Respeitoso, firme e profissional' },
        { id: 'c', text: 'Debochado e irônico' }
      ],
      correct: 'b'
    },
    {
      id: 5,
      question: 'Em caso de ordem manifestamente ilegal de um superior, o que fazer?',
      options: [
        { id: 'a', text: 'Cumprir sem questionar' },
        { id: 'b', text: 'Não cumprir e reportar à autoridade competente' },
        { id: 'c', text: 'Fazer de conta que não ouviu' }
      ],
      correct: 'b'
    },
    {
      id: 6,
      question: 'O que caracteriza o crime de Corrupção Passiva?',
      options: [
        { id: 'a', text: 'Solicitar ou receber vantagem indevida em razão da função' },
        { id: 'b', text: 'Prender alguém por engano' },
        { id: 'c', text: 'Chegar atrasado no plantão' }
      ],
      correct: 'a'
    },
    {
      id: 7,
      question: 'Quando o policial deve utilizar a sirene e o giroflex?',
      options: [
        { id: 'a', text: 'Para furar o sinal vermelho e chegar cedo em casa' },
        { id: 'b', text: 'Apenas em situações de emergência ou perseguição' },
        { id: 'c', text: 'Para passear na cidade' }
      ],
      correct: 'b'
    },
    {
      id: 8,
      question: 'Qual é o procedimento correto ao realizar uma abordagem?',
      options: [
        { id: 'a', text: 'Chegar atirando para garantir a segurança' },
        { id: 'b', text: 'Verbalizar, identificar-se e garantir a segurança de todos' },
        { id: 'c', text: 'Pedir o dinheiro do suspeito' }
      ],
      correct: 'b'
    },
    {
      id: 9,
      question: 'O que é "Metagaming" (em contexto de RP/Simulação)?',
      options: [
        { id: 'a', text: 'Usar informações externas ao personagem para obter vantagem' },
        { id: 'b', text: 'Jogar muito bem' },
        { id: 'c', text: 'Ser o chefe da polícia' }
      ],
      correct: 'a'
    },
    {
      id: 10,
      question: 'O policial pode usar a viatura para fins pessoais?',
      options: [
        { id: 'a', text: 'Sim, se colocar gasolina do próprio bolso' },
        { id: 'b', text: 'Não, a viatura é para uso exclusivo em serviço' },
        { id: 'c', text: 'Sim, para buscar o filho na escola' }
      ],
      correct: 'b'
    },
    {
      id: 11,
      question: 'O que significa a sigla QTH no código Q?',
      options: [
        { id: 'a', text: 'Qual o seu nome?' },
        { id: 'b', text: 'Qual a sua localização?' },
        { id: 'c', text: 'Estou com fome' }
      ],
      correct: 'b'
    },
    {
      id: 12,
      question: 'O que significa a sigla QRU no código Q?',
      options: [
        { id: 'a', text: 'Ocorrência / Problema' },
        { id: 'b', text: 'Estou indo almoçar' },
        { id: 'c', text: 'Obrigado' }
      ],
      correct: 'a'
    },
    {
      id: 13,
      question: 'O uso da força policial deve ser:',
      options: [
        { id: 'a', text: 'Máximo e letal desde o início' },
        { id: 'b', text: 'Progressivo, moderado e proporcional à ameaça' },
        { id: 'c', text: 'Aleatório' }
      ],
      correct: 'b'
    },
    {
      id: 14,
      question: 'Um cidadão desacata o policial. Qual a conduta correta?',
      options: [
        { id: 'a', text: 'Agredir o cidadão imediatamente' },
        { id: 'b', text: 'Dar voz de prisão por desacato e conduzir à delegacia' },
        { id: 'c', text: 'Xingar de volta' }
      ],
      correct: 'b'
    },
    {
      id: 15,
      question: 'Qual é o dever do policial ao presenciar um crime fora de serviço?',
      options: [
        { id: 'a', text: 'Fingir que não viu' },
        { id: 'b', text: 'Agir (se possível e seguro) ou acionar o apoio imediatamente' },
        { id: 'c', text: 'Filmar e postar na internet' }
      ],
      correct: 'b'
    },
    {
      id: 16,
      question: 'O que é Prevaricação?',
      options: [
        { id: 'a', text: 'Roubar dinheiro' },
        { id: 'b', text: 'Deixar de praticar ato de ofício por interesse pessoal' },
        { id: 'c', text: 'Faltar ao serviço' }
      ],
      correct: 'b'
    },
    {
      id: 17,
      question: 'A quem a Polícia Federal se subordina?',
      options: [
        { id: 'a', text: 'Ao Exército' },
        { id: 'b', text: 'Ao Ministério da Justiça e Segurança Pública' },
        { id: 'c', text: 'Ao Prefeito' }
      ],
      correct: 'b'
    },
    {
      id: 18,
      question: 'É permitido ao policial divulgar informações sigilosas de investigações?',
      options: [
        { id: 'a', text: 'Sim, para ficar famoso' },
        { id: 'b', text: 'Não, é crime de violação de sigilo funcional' },
        { id: 'c', text: 'Sim, se for para amigos' }
      ],
      correct: 'b'
    },
    {
      id: 19,
      question: 'Qual a importância do Relatório de Ocorrência?',
      options: [
        { id: 'a', text: 'Nenhuma, é burocracia inútil' },
        { id: 'b', text: 'Registrar oficialmente os fatos para futuras investigações e processos' },
        { id: 'c', text: 'Gastarr papel' }
      ],
      correct: 'b'
    },
    {
      id: 20,
      question: 'Por que você deseja entrar para a Polícia Federal?',
      options: [
        { id: 'a', text: 'Para ter arma e distintivo' },
        { id: 'b', text: 'Para contribuir com a segurança e justiça da sociedade' },
        { id: 'c', text: 'Porque o salário é bom' }
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
