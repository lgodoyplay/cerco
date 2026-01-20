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
      question: 'Qual é a principal função da Academia Nacional de Polícia (ANP)?',
      options: [
        { id: 'a', text: 'Vender cursos online' },
        { id: 'b', text: 'Formar e treinar os novos Policiais Federais' },
        { id: 'c', text: 'Organizar festas para a polícia' }
      ],
      correct: 'b'
    },
    {
      id: 2,
      question: 'O que é necessário para se tornar um Policial Federal na cidade?',
      options: [
        { id: 'a', text: 'Ser amigo do dono da cidade' },
        { id: 'b', text: 'Passar no recrutamento e ter ficha limpa' },
        { id: 'c', text: 'Pagar uma taxa em dinheiro' }
      ],
      correct: 'b'
    },
    {
      id: 3,
      question: 'O Teste de Aptidão Física (TAF) serve para avaliar:',
      options: [
        { id: 'a', text: 'Se você sabe atirar' },
        { id: 'b', text: 'Sua resistência física e saúde para o trabalho policial' },
        { id: 'c', text: 'Se você sabe dirigir bem' }
      ],
      correct: 'b'
    },
    {
      id: 4,
      question: 'Durante o curso de formação, como você deve se comportar?',
      options: [
        { id: 'a', text: 'Como se já fosse o chefe de tudo' },
        { id: 'b', text: 'Com disciplina, respeitando os instrutores como Aluno' },
        { id: 'c', text: 'Fazendo piadas o tempo todo' }
      ],
      correct: 'b'
    },
    {
      id: 5,
      question: 'O policial federal pode ter outro emprego formal (como mecânico ou taxista)?',
      options: [
        { id: 'a', text: 'Sim, para complementar renda' },
        { id: 'b', text: 'Não, o cargo exige dedicação exclusiva (exceto professor)' },
        { id: 'c', text: 'Sim, se ninguém descobrir' }
      ],
      correct: 'b'
    },
    {
      id: 6,
      question: 'Qual a idade mínima para entrar na polícia?',
      options: [
        { id: 'a', text: '16 anos' },
        { id: 'b', text: '18 anos (Maioridade)' },
        { id: 'c', text: '50 anos' }
      ],
      correct: 'b'
    },
    {
      id: 7,
      question: 'Se você tiver passagens pela polícia (ficha suja), o que acontece?',
      options: [
        { id: 'a', text: 'Nada, o passado não importa' },
        { id: 'b', text: 'Você é reprovado na Investigação Social' },
        { id: 'c', text: 'Ganha pontos por experiência' }
      ],
      correct: 'b'
    },
    {
      id: 8,
      question: 'Quando o policial pode usar sua arma de fogo?',
      options: [
        { id: 'a', text: 'Para assustar pessoas na rua' },
        { id: 'b', text: 'Em legítima defesa ou estrito cumprimento do dever legal' },
        { id: 'c', text: 'Sempre que alguém xingar ele' }
      ],
      correct: 'b'
    },
    {
      id: 9,
      question: 'A Polícia Federal é uma instituição:',
      options: [
        { id: 'a', text: 'Privada de segurança' },
        { id: 'b', text: 'Permanente de Estado, mantida pela União' },
        { id: 'c', text: 'Temporária, só funciona no verão' }
      ],
      correct: 'b'
    },
    {
      id: 10,
      question: 'Qual é o guia de conduta do policial?',
      options: [
        { id: 'a', text: 'Fazer o que bem entender' },
        { id: 'b', text: 'O Código de Ética e a Hierarquia' },
        { id: 'c', text: 'As regras da gangue' }
      ],
      correct: 'b'
    },
    {
      id: 11,
      question: 'Quais são os pilares da Polícia?',
      options: [
        { id: 'a', text: 'Dinheiro e Fama' },
        { id: 'b', text: 'Hierarquia e Disciplina' },
        { id: 'c', text: 'Velocidade e Furor' }
      ],
      correct: 'b'
    },
    {
      id: 12,
      question: 'Ao entrar na polícia, você começa como:',
      options: [
        { id: 'a', text: 'Comandante Geral' },
        { id: 'b', text: 'Recruta / Agente Iniciante' },
        { id: 'c', text: 'Prefeito' }
      ],
      correct: 'b'
    },
    {
      id: 13,
      question: 'É necessário ter Carteira de Habilitação (CNH)?',
      options: [
        { id: 'a', text: 'Não, a viatura dirige sozinha' },
        { id: 'b', text: 'Sim, para Carro e Moto' },
        { id: 'c', text: 'Só para bicicleta' }
      ],
      correct: 'b'
    },
    {
      id: 14,
      question: 'Onde o policial deve atuar?',
      options: [
        { id: 'a', text: 'Apenas dentro da delegacia' },
        { id: 'b', text: 'Em toda a cidade, prevenindo e combatendo crimes' },
        { id: 'c', text: 'Apenas em bairros ricos' }
      ],
      correct: 'b'
    },
    {
      id: 15,
      question: 'O exame psicológico serve para garantir que:',
      options: [
        { id: 'a', text: 'Você sabe fazer contas' },
        { id: 'b', text: 'Você tem equilíbrio emocional para portar arma e autoridade' },
        { id: 'c', text: 'Você é bom de lábia' }
      ],
      correct: 'b'
    },
    {
      id: 16,
      question: 'Quem é o responsável por comandar inquéritos e operações?',
      options: [
        { id: 'a', text: 'O Agente' },
        { id: 'b', text: 'O Delegado' },
        { id: 'c', text: 'O Estagiário' }
      ],
      correct: 'b'
    },
    {
      id: 17,
      question: 'Se você desrespeitar um superior ou quebrar regras graves:',
      options: [
        { id: 'a', text: 'Ganha uma promoção' },
        { id: 'b', text: 'Pode ser punido ou até expulso da corporação' },
        { id: 'c', text: 'Ninguém liga' }
      ],
      correct: 'b'
    },
    {
      id: 18,
      question: 'Qual a prioridade da PF no combate ao crime?',
      options: [
        { id: 'a', text: 'Multar carros mal estacionados' },
        { id: 'b', text: 'Combater tráfico, crime organizado e corrupção' },
        { id: 'c', text: 'Prender quem rouba galinha' }
      ],
      correct: 'b'
    },
    {
      id: 19,
      question: 'A Polícia deve servir a quem?',
      options: [
        { id: 'a', text: 'Aos políticos' },
        { id: 'b', text: 'À sociedade e à Lei' },
        { id: 'c', text: 'A si mesma' }
      ],
      correct: 'b'
    },
    {
      id: 20,
      question: 'Quais são os valores da PF?',
      options: [
        { id: 'a', text: 'Corrupção e Preguiça' },
        { id: 'b', text: 'Lealdade, Integridade e Eficiência' },
        { id: 'c', text: 'Medo e Opressão' }
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
