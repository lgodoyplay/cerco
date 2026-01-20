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
      question: "Qual é a principal função da Divisão de Homicídios (DH)?",
      options: [
        { id: 'a', text: "Aplicar multas de trânsito em alta velocidade" },
        { id: 'b', text: "Investigar crimes contra a vida e prender os autores" },
        { id: 'c', text: "Fazer patrulhamento ostensivo em áreas de risco" }
      ],
      correct: 'b'
    },
    {
      id: 2,
      question: "Ao chegar em uma cena de crime com um corpo, qual a primeira atitude correta?",
      options: [
        { id: 'a', text: "Revistar o corpo imediatamente em busca de documentos" },
        { id: 'b', text: "Isolar o local e acionar a Polícia Científica" },
        { id: 'c', text: "Remover o corpo para liberar o trânsito" }
      ],
      correct: 'b'
    },
    {
      id: 3,
      question: "O que é Cadeia de Custódia na Polícia Científica?",
      options: [
        { id: 'a', text: "Uma prisão especial para peritos" },
        { id: 'b', text: "O rastreamento documental da evidência desde a coleta até o descarte" },
        { id: 'c', text: "O conjunto de algemas usadas em suspeitos" }
      ],
      correct: 'b'
    },
    {
      id: 4,
      question: "Qual profissional é responsável pela autópsia e determinação da causa da morte?",
      options: [
        { id: 'a', text: "Médico Legista" },
        { id: 'b', text: "Investigador de Homicídios" },
        { id: 'c', text: "Delegado Titular" }
      ],
      correct: 'a'
    },
    {
      id: 5,
      question: "O que caracteriza um Homicídio Qualificado?",
      options: [
        { id: 'a', text: "Quando o crime é cometido por acidente de trânsito" },
        { id: 'b', text: "Quando há motivo fútil, meio cruel ou emboscada" },
        { id: 'c', text: "Quando o autor se entrega espontaneamente" }
      ],
      correct: 'b'
    },
    {
      id: 6,
      question: "Qual a função da Balística Forense?",
      options: [
        { id: 'a', text: "Analisar armas de fogo, projéteis e trajetórias de tiro" },
        { id: 'b', text: "Treinar policiais para atirar melhor" },
        { id: 'c', text: "Fabricar munições para a polícia" }
      ],
      correct: 'a'
    },
    {
      id: 7,
      question: "Durante um interrogatório na DH, o que é essencial garantir ao suspeito?",
      options: [
        { id: 'a', text: "Que ele confesse imediatamente sob pressão" },
        { id: 'b', text: "Seus direitos constitucionais, incluindo o de permanecer calado" },
        { id: 'c', text: "Uma refeição completa antes de falar" }
      ],
      correct: 'b'
    },
    {
      id: 8,
      question: "Como deve ser coletada uma arma de fogo encontrada na cena do crime?",
      options: [
        { id: 'a', text: "Pegando pelo cano com as mãos nuas" },
        { id: 'b', text: "Usando luvas e pegando por áreas texturizadas (grip)" },
        { id: 'c', text: "Não se deve coletar, apenas tirar foto" }
      ],
      correct: 'b'
    },
    {
      id: 9,
      question: "O que é o exame residuográfico?",
      options: [
        { id: 'a', text: "Teste para detectar presença de drogas no sangue" },
        { id: 'b', text: "Teste para detectar resíduos de pólvora nas mãos de um atirador" },
        { id: 'c', text: "Exame de DNA em bitucas de cigarro" }
      ],
      correct: 'b'
    },
    {
      id: 10,
      question: "Qual a importância do isolamento perimétrico em um local de homicídio?",
      options: [
        { id: 'a', text: "Preservar vestígios e impedir a contaminação da cena" },
        { id: 'b', text: "Apenas para afastar curiosos e a imprensa" },
        { id: 'c', text: "Para que os policiais possam descansar sem serem incomodados" }
      ],
      correct: 'a'
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

    if (score >= 7) {
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
        footer: { text: "Sistema de Recrutamento Policia Civil" },
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
                <h2 className="text-3xl font-bold text-white mb-4">Candidatura à Policia Civil</h2>
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
                    <p className="text-slate-400">Responda corretamente a pelo menos 7 das 10 questões para enviar sua candidatura.</p>
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
                      disabled={Object.keys(quizAnswers).length < 10}
                      className={`w-2/3 py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        Object.keys(quizAnswers).length < 10
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
                    Você não atingiu a pontuação mínima necessária (4/5). Estude o regulamento e tente novamente.
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
