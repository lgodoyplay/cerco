import React, { useMemo, useState } from 'react';
import { ChevronRight, X, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const examStages = [
  {
    id: 'etapa_1',
    label: 'Etapa 1',
    title: 'Conhecimentos gerais da corporação',
    questions: [
      { id: 1, question: 'Qual é a principal missão da Polícia Civil - Euforia?', options: [
        { id: 'a', text: 'Promover apenas a repressão por meio da força bruta' },
        { id: 'b', text: 'Servir e proteger a sociedade, cumprindo a lei' },
        { id: 'c', text: 'Atuar apenas em eventos e espetáculos' }
      ], correct: 'b' },
      { id: 2, question: 'O que significa hierarquia na Polícia?', options: [
        { id: 'a', text: 'A ausência de disciplina e obediencia' },
        { id: 'b', text: 'A organização funcional e respeitos aos níveis de comando' },
        { id: 'c', text: 'A vontade individual de cada agente' }
      ], correct: 'b' },
      { id: 3, question: 'O que é disciplina no serviço público?', options: [
        { id: 'a', text: 'Cumprir regras, normas e ordens superiores' },
        { id: 'b', text: 'Fazer o que quiser sem prestar contas' },
        { id: 'c', text: 'Ignorar procedimentos para ganhar tempo' }
      ], correct: 'a' },
      { id: 4, question: 'Como deve ser o tratamento com o cidadão?', options: [
        { id: 'a', text: 'Respeitoso, firme e profissional' },
        { id: 'b', text: 'Agressivo sempre que houver conflito' },
        { id: 'c', text: 'Diferente conforme a vontade do policial' }
      ], correct: 'a' },
      { id: 5, question: 'Em caso de ordem manifestamente ilegal, o correto é:', options: [
        { id: 'a', text: 'Cumprir sem questionar e perder a dignidade' },
        { id: 'b', text: 'Não cumprir e reportar à autoridade competente' },
        { id: 'c', text: 'Ignorar e agir como se nada tivesse acontecido' }
      ], correct: 'b' }
    ]
  },
  {
    id: 'etapa_2',
    label: 'Etapa 2',
    title: 'Legislação e procedimento',
    questions: [
      { id: 6, question: 'O que caracteriza a corrupção passiva?', options: [
        { id: 'a', text: 'Receber ou solicitar vantagem indevida em razão da função' },
        { id: 'b', text: 'Fazer ronda sem documentação' },
        { id: 'c', text: 'Cometer uma infração de trânsito' }
      ], correct: 'a' },
      { id: 7, question: 'Quando se deve usar sirene e giroflex?', options: [
        { id: 'a', text: 'Somente em situações de emergência ou perseguição' },
        { id: 'b', text: 'Todos os dias no deslocamento' },
        { id: 'c', text: 'Para se diferenciar dos civis em qualquer momento' }
      ], correct: 'a' },
      { id: 8, question: 'Qual a conduta correta ao realizar uma abordagem?', options: [
        { id: 'a', text: 'Verbalizar, identificar-se e garantir a segurança de todos' },
        { id: 'b', text: 'Fazer uma checagem violenta sem aviso' },
        { id: 'c', text: 'Atacar o suspeito para garantir o controle' }
      ], correct: 'a' },
      { id: 9, question: 'O que é metagaming em um contexto de RP?', options: [
        { id: 'a', text: 'Usar informações externas ao personagem para obter vantagem' },
        { id: 'b', text: 'Cumprir a rotina administrativa corretamente' },
        { id: 'c', text: 'Pedir ajuda aos colegas em situações simples' }
      ], correct: 'a' },
      { id: 10, question: 'A viatura pode ser usada para fins pessoais?', options: [
        { id: 'a', text: 'Sim, desde que o agente queira usar para lazer' },
        { id: 'b', text: 'Não, deve ser usada exclusivamente em serviço' },
        { id: 'c', text: 'Somente quando o patrulhamento estiver em baixa' }
      ], correct: 'b' }
    ]
  },
  {
    id: 'etapa_3',
    label: 'Etapa 3',
    title: 'Operação e zelo institucional',
    questions: [
      { id: 11, question: 'O que significa a sigla QTH no código Q?', options: [
        { id: 'a', text: 'Qual a sua localização?' },
        { id: 'b', text: 'Qual o seu apelido?' },
        { id: 'c', text: 'Estou vagando pela cidade' }
      ], correct: 'a' },
      { id: 12, question: 'O que significa a sigla QRU no código Q?', options: [
        { id: 'a', text: 'Ocorrência / Problema' },
        { id: 'b', text: 'Preciso de um veículo' },
        { id: 'c', text: 'Vou almoçar' }
      ], correct: 'a' },
      { id: 13, question: 'O uso da força deve ser:', options: [
        { id: 'a', text: 'Progressivo, moderado e proporcional à ameaça' },
        { id: 'b', text: 'Máximo e letal desde o início' },
        { id: 'c', text: 'Incentivado sem necessidade' }
      ], correct: 'a' },
      { id: 14, question: 'Se um cidadão desacata o policial, a conduta correta é?', options: [
        { id: 'a', text: 'Fazer uso da força imediatamente e sem aviso' },
        { id: 'b', text: 'Aplicar o devido procedimento legal e conduzir com rigor' },
        { id: 'c', text: 'Responder com ofensa para manter autoridade' }
      ], correct: 'b' },
      { id: 15, question: 'Ao presenciar um crime fora de serviço, o policial deve:', options: [
        { id: 'a', text: 'Ignorar e continuar o caminho' },
        { id: 'b', text: 'Agir quando seguro ou acionar o suporte imediatamente' },
        { id: 'c', text: 'Guardar segredo e não comunicar nada' }
      ], correct: 'b' }
    ]
  }
];

const totalQuestions = examStages.reduce((count, stage) => count + stage.questions.length, 0);
const passThreshold = Math.ceil(totalQuestions * 0.8);

const getDefaultForm = () => ({
  nome: '',
  telefone: '',
  cidade: '',
  discord_user: '',
  mensagem: ''
});

const generateRecruitmentCode = () => `RC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const getStageScore = (stageId, answers) => {
  const stage = examStages.find((item) => item.id === stageId);
  if (!stage) return 0;

  return stage.questions.reduce((score, question) => {
    const answer = answers[`${stageId}-${question.id}`];
    return answer === question.correct ? score + 1 : score;
  }, 0);
};

const getTotalScore = (answers) => {
  return examStages.reduce((score, stage) => score + getStageScore(stage.id, answers), 0);
};

const CandidateFormModal = ({ isOpen, onClose }) => {
  const [candidateForm, setCandidateForm] = useState(getDefaultForm());
  const [formStatus, setFormStatus] = useState('idle');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStatus, setQuizStatus] = useState('idle');
  const [stageIndex, setStageIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const currentStage = examStages[stageIndex];
  const stageAnswered = useMemo(() => {
    if (!currentStage) return false;
    return currentStage.questions.every((question) => Boolean(examAnswers[`${currentStage.id}-${question.id}`]));
  }, [currentStage, examAnswers]);

  const resetFlow = () => {
    setFormStatus('idle');
    setShowQuiz(false);
    setQuizStatus('idle');
    setStageIndex(0);
    setExamAnswers({});
    setErrorMessage('');
    setCandidateForm(getDefaultForm());
  };

  const handleStartQuiz = (e) => {
    e.preventDefault();
    setShowQuiz(true);
    setQuizStatus('idle');
    setErrorMessage('');
  };

  const handleAnswer = (questionId, optionId) => {
    if (!currentStage) return;
    setExamAnswers((prev) => ({
      ...prev,
      [`${currentStage.id}-${questionId}`]: optionId
    }));
    setErrorMessage('');
  };

  const handleNextStage = () => {
    if (!stageAnswered) {
      setErrorMessage('Responda todas as questões desta etapa antes de continuar.');
      return;
    }

    if (stageIndex < examStages.length - 1) {
      setStageIndex((prev) => prev + 1);
      setErrorMessage('');
      return;
    }

    handleQuizSubmit();
  };

  const handleRetryQuiz = () => {
    setQuizStatus('idle');
    setStageIndex(0);
    setExamAnswers({});
    setErrorMessage('');
  };

  const sendDiscordNotification = async (formData, totalScore, stageScores) => {
    try {
      const { data: settingsData, error: dbError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'discord_config')
        .maybeSingle();

      if (dbError) {
        console.error('Erro ao buscar config do Discord:', dbError);
        return;
      }

      if (!settingsData) {
        console.warn('Configuração discord_config não encontrada.');
        return;
      }

      let webhookUrl = settingsData?.value?.formsWebhook || settingsData?.value?.webhookUrl;
      if (!webhookUrl && typeof settingsData.value === 'string') {
        try {
          const parsed = JSON.parse(settingsData.value);
          webhookUrl = parsed.formsWebhook || parsed.webhookUrl;
        } catch (error) {
          console.warn('Erro ao parsear webhook no banco:', error);
        }
      }

      if (!webhookUrl) {
        console.warn('Nenhum webhook configurado para recruiting notification.');
        return;
      }

      const embed = {
        title: '🧪 Nova avaliação de recrutamento',
        color: 0x1d4ed8,
        fields: [
          { name: '👤 Nome', value: formData.nome || 'N/A', inline: true },
          { name: '🛰️ Discord', value: formData.discord_user || formData.nome || 'N/A', inline: true },
          { name: '📍 Cidade', value: formData.cidade || 'N/A', inline: true },
          { name: '📱 Telefone', value: formData.telefone || 'N/A', inline: true },
          { name: '🔐 Código', value: formData.codigo_identificacao || 'N/A', inline: true },
          { name: '✅ Pontuação total', value: `${totalScore}/${totalQuestions}`, inline: true },
          { name: '📊 Etapas', value: `1:${stageScores.etapa_1}/5 | 2:${stageScores.etapa_2}/5 | 3:${stageScores.etapa_3}/5`, inline: false },
          { name: '📄 Motivação', value: formData.mensagem || 'N/A', inline: false }
        ],
        footer: { text: 'Sistema de recrutamento da Polícia Civil - Euforia' },
        timestamp: new Date().toISOString()
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    } catch (error) {
      console.error('Erro ao configurar notificação para o Discord:', error);
    }
  };

  const submitApplication = async (totalScore, stageScores) => {
    setFormStatus('submitting');

    try {
      const recruitmentCode = generateRecruitmentCode();
      const payload = {
        nome: candidateForm.nome,
        telefone: candidateForm.telefone,
        cidade: candidateForm.cidade,
        email: candidateForm.discord_user,
        discord_user: candidateForm.discord_user,
        mensagem: candidateForm.mensagem,
        codigo_identificacao: recruitmentCode,
        etapa_atual: totalScore >= passThreshold ? 'aprovado' : 'reprovado',
        pontuacao_total: totalScore,
        pontuacao_etapa_1: stageScores.etapa_1,
        pontuacao_etapa_2: stageScores.etapa_2,
        pontuacao_etapa_3: stageScores.etapa_3,
        status: totalScore >= passThreshold ? 'Aprovado' : 'Rejeitado',
        pontuacao_quiz: totalScore
      };

      const { error } = await supabase.from('candidatos').insert([payload]);
      if (error) throw error;

      await sendDiscordNotification({
        ...candidateForm,
        codigo_identificacao: recruitmentCode
      }, totalScore, stageScores);

      setFormStatus('success');
      setTimeout(() => {
        resetFlow();
        onClose();
      }, 3200);
    } catch (error) {
      console.error('Erro ao enviar candidatura:', error);
      setFormStatus('error');
      setErrorMessage('Não foi possível salvar sua inscrição. Tente novamente.');
    }
  };

  const handleQuizSubmit = async () => {
    if (Object.keys(examAnswers).length !== totalQuestions) {
      setErrorMessage('Responda todas as 15 questões antes de finalizar o recrutamento.');
      return;
    }

    const stageScores = {
      etapa_1: getStageScore('etapa_1', examAnswers),
      etapa_2: getStageScore('etapa_2', examAnswers),
      etapa_3: getStageScore('etapa_3', examAnswers)
    };

    const totalScore = getTotalScore(examAnswers);

    if (totalScore >= passThreshold) {
      setQuizStatus('submitting');
      await submitApplication(totalScore, stageScores);
      return;
    }

    setQuizStatus('failed');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl animate-fade-in-up overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative p-6 md:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {!showQuiz ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Candidatura à Polícia Civil - Euforia</h2>
                <p className="text-slate-400">
                  Preencha o formulário e siga as 3 etapas de avaliação para concluir o processo de recrutamento.
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
                      onChange={(e) => setCandidateForm({ ...candidateForm, nome: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors"
                      placeholder="Ex: usuario#1234"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Discord / Nome do usuário</label>
                    <input
                      type="text"
                      required
                      value={candidateForm.discord_user}
                      onChange={(e) => setCandidateForm({ ...candidateForm, discord_user: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors"
                      placeholder="Ex: usuario123"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Telefone / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={candidateForm.telefone}
                      onChange={(e) => setCandidateForm({ ...candidateForm, telefone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Cidade</label>
                    <input
                      type="text"
                      value={candidateForm.cidade}
                      onChange={(e) => setCandidateForm({ ...candidateForm, cidade: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors"
                      placeholder="Sua cidade"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Motivação para fazer parte da corporação</label>
                  <textarea
                    required
                    value={candidateForm.mensagem}
                    onChange={(e) => setCandidateForm({ ...candidateForm, mensagem: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors h-32 resize-none"
                    placeholder="Conte-nos sua motivação, experiência e disponibilidade..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all hover:-translate-y-1 shadow-lg shadow-federal-900/20 flex items-center justify-center gap-2"
                >
                  Iniciar processo de recrutamento
                  <ChevronRight size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              {quizStatus === 'idle' && currentStage && (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800 pb-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-federal-500">{currentStage.label}</p>
                      <h2 className="text-2xl font-bold text-white mt-2">{currentStage.title}</h2>
                    </div>
                    <div className="text-sm text-slate-400">
                      {stageIndex + 1} / {examStages.length}
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="space-y-5">
                    {currentStage.questions.map((question, index) => (
                      <div key={question.id} className="bg-slate-950/60 p-5 rounded-xl border border-slate-800">
                        <p className="text-white font-bold mb-4 flex gap-3">
                          <span className="text-federal-500">#{index + 1}</span>
                          {question.question}
                        </p>

                        <div className="space-y-3">
                          {question.options.map((option) => (
                            <label
                              key={option.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                                examAnswers[`${currentStage.id}-${question.id}`] === option.id
                                  ? 'bg-federal-500/20 border-federal-500 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option.id}
                                checked={examAnswers[`${currentStage.id}-${question.id}`] === option.id}
                                onChange={() => handleAnswer(question.id, option.id)}
                                className="hidden"
                              />
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                examAnswers[`${currentStage.id}-${question.id}`] === option.id ? 'border-federal-500' : 'border-slate-600'
                              }`}>
                                {examAnswers[`${currentStage.id}-${question.id}`] === option.id && <div className="w-2 h-2 rounded-full bg-federal-500" />}
                              </div>
                              <span className="text-sm">{option.text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowQuiz(false)}
                      className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStage}
                      className="w-2/3 py-3 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all hover:-translate-y-1 shadow-lg shadow-federal-900/20"
                    >
                      {stageIndex === examStages.length - 1 ? `Finalizar avaliação (${totalQuestions} questões)` : 'Próxima etapa'}
                    </button>
                  </div>
                </>
              )}

              {quizStatus === 'failed' && (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-bounce">
                    <X size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Reprovado na avaliação</h3>
                  <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                    Você obteve {getTotalScore(examAnswers)}/{totalQuestions} pontos. A nota mínima para avançar é {passThreshold}/{totalQuestions} ({Math.ceil(totalQuestions * 0.8)}). Tente novamente no próximo processo.
                  </p>
                  <button
                    onClick={handleRetryQuiz}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all hover:-translate-y-1"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {quizStatus === 'submitting' && (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-federal-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-federal-500 animate-pulse">
                    <Check size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Avaliando sua candidatura...</h3>
                  <p className="text-slate-400">Enviando os resultados e validando sua identidade para o processo.</p>
                </div>
              )}

              {formStatus === 'success' && (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 animate-bounce">
                    <Check size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Candidatura aprovada na fase de avaliação</h3>
                  <p className="text-slate-400 max-w-xl mx-auto">
                    Sua inscrição foi registrada com sucesso. A equipe da Polícia Civil - Euforia vai analisar sua identificação e dados de Discord para o próximo passo.
                  </p>
                </div>
              )}

              {formStatus === 'error' && (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-bounce">
                    <X size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Erro ao salvar inscrição</h3>
                  <p className="text-slate-400">{errorMessage || 'Não foi possível concluir o cadastro no momento.'}</p>
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
