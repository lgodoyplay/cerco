import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Shield,
  GraduationCap,
  AlertTriangle,
  Skull,
  Microscope,
  Gavel,
  ClipboardCheck,
  Ban,
  CheckSquare
} from 'lucide-react';

const modules = [
  {
    id: 1,
    title: 'Módulo 1 — História e Missão da Polícia Federal',
    description: 'A origem, evolução e o papel constitucional da instituição.',
    content: [
      'Origem histórica da Polícia Federal no Brasil.',
      'O Artigo 144 da Constituição Federal e a definição como órgão permanente.',
      'Missão: exercer a segurança pública para a preservação da ordem pública e da incolumidade das pessoas e do patrimônio.',
      'A Polícia Federal como Polícia Judiciária da União.'
    ]
  },
  {
    id: 2,
    title: 'Módulo 2 — Estrutura Organizacional',
    description: 'Como a PF está organizada em todo o território nacional.',
    content: [
      'Direção Geral em Brasília e Superintendências Regionais nos estados.',
      'Delegacias Descentralizadas e Postos Avançados.',
      'Diretorias especializadas (DIP, DICOR, DIREX, etc.).',
      'A capilaridade e a presença em fronteiras, portos e aeroportos.'
    ]
  },
  {
    id: 3,
    title: 'Módulo 3 — Carreiras da Polícia Federal',
    description: 'Os cargos que compõem a força policial e suas funções.',
    content: [
      'Delegado de Polícia Federal: presunção de inquéritos e operações.',
      'Agente de Polícia Federal: investigação e execução de operações.',
      'Escrivão de Polícia Federal: formalização dos atos de polícia judiciária.',
      'Papiloscopista Policial Federal: identificação humana e perícia papiloscópica.',
      'Perito Criminal Federal: prova material e científica.'
    ]
  },
  {
    id: 4,
    title: 'Módulo 4 — Atribuições de Polícia Judiciária',
    description: 'A investigação de crimes de competência federal.',
    content: [
      'Infrações penais contra a ordem política e social.',
      'Crimes contra bens, serviços e interesses da União (empresas públicas, autarquias).',
      'Tráfico internacional de entorpecentes e drogas afins.',
      'Contrabando e descaminho.'
    ]
  },
  {
    id: 5,
    title: 'Módulo 5 — Atribuições de Polícia Administrativa',
    description: 'Serviços prestados diretamente ao cidadão e controle estatal.',
    content: [
      'Emissão de passaportes e controle migratório.',
      'Controle e fiscalização de segurança privada.',
      'Registro e porte de armas (SINARM).',
      'Controle de produtos químicos.'
    ]
  },
  {
    id: 6,
    title: 'Módulo 6 — Combate ao Crime Organizado',
    description: 'O enfrentamento às organizações criminosas e corrupção.',
    content: [
      'Investigação de desvio de recursos públicos.',
      'Combate à lavagem de dinheiro.',
      'Repressão a facções criminosas com atuação interestadual.',
      'Operações especiais e de grande vulto.'
    ]
  },
  {
    id: 7,
    title: 'Módulo 7 — Cooperação Internacional',
    description: 'A atuação da PF além das fronteiras.',
    content: [
      'Representante exclusiva da Interpol no Brasil.',
      'Adidâncias policiais em diversos países.',
      'Cooperação jurídica internacional em matéria penal.',
      'Combate ao crime transnacional.'
    ]
  },
  {
    id: 8,
    title: 'Módulo 8 — Grupos Especializados',
    description: 'As unidades de elite e apoio operacional.',
    content: [
      'COT (Comando de Operações Táticas): intervenções de alto risco.',
      'CAOP (Coordenação de Aviação Operacional): suporte aéreo.',
      'GPI (Grupos de Pronta Intervenção) nos estados.',
      'NEPOM (Núcleos Especiais de Polícia Marítima).'
    ]
  },
  {
    id: 9,
    title: 'Módulo 9 — Inteligência Policial',
    description: 'A produção de conhecimento para a tomada de decisão.',
    content: [
      'Diferença entre investigação e inteligência.',
      'A doutrina de inteligência policial.',
      'Contrainteligência e proteção de dados sensíveis.',
      'O uso de tecnologia no combate ao crime.'
    ]
  },
  {
    id: 10,
    title: 'Módulo 10 — Valores e Ética Institucional',
    description: 'Os princípios que regem a conduta do servidor.',
    content: [
      'Legalidade, impessoalidade, moralidade, publicidade e eficiência.',
      'Hierarquia e disciplina.',
      'O respeito aos direitos humanos.',
      'A lealdade à instituição e à Constituição.'
    ]
  },
  {
    id: 11,
    title: 'Módulo 11 — O Padrão de Excelência DPF',
    description: 'O compromisso com a sociedade brasileira.',
    content: [
      'A credibilidade da Polícia Federal perante a sociedade.',
      'A busca constante por inovação e aprimoramento.',
      'O orgulho de pertencer e servir.',
      'Bem-vindo à Polícia Federal.'
    ]
  }
];

const examQuestions = [
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

const Home = () => {
  const [selectedModule, setSelectedModule] = useState(null);
  const [showExam, setShowExam] = useState(false);
  const [examStep, setExamStep] = useState('form');
  const [examForm, setExamForm] = useState({
    nome: '',
    matricula: '',
    lotacao: '',
    telefone: ''
  });
  const [examAnswers, setExamAnswers] = useState({});
  const [examScore, setExamScore] = useState(0);
  const [examStatus, setExamStatus] = useState('idle');
  const [examError, setExamError] = useState('');

  const handleOpenExam = () => {
    setShowExam(true);
    setExamStep('form');
    setExamAnswers({});
    setExamScore(0);
    setExamStatus('idle');
    setExamError('');
  };

  const handleCloseExam = () => {
    setShowExam(false);
  };

  const handleExamFormSubmit = (e) => {
    e.preventDefault();
    setExamStep('quiz');
  };

  const handleExamAnswer = (questionId, optionId) => {
    setExamAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleExamSubmit = async () => {
    let score = 0;
    examQuestions.forEach((q) => {
      if (examAnswers[q.id] === q.correct) {
        score += 1;
      }
    });

    setExamScore(score);
    setExamStatus('submitting');
    setExamError('');

    const aprovado = score >= 10;

    try {
      const mensagem = [
        'Prova DPF - Conhecimentos Institucionais',
        `Nome: ${examForm.nome || 'N/A'}`,
        `Matrícula: ${examForm.matricula || 'N/A'}`,
        `Lotação/Unidade: ${examForm.lotacao || 'N/A'}`,
        `Telefone: ${examForm.telefone || 'N/A'}`,
        `Resultado: ${aprovado ? 'APROVADO' : 'REPROVADO'}`,
        `Acertos: ${score}/20`
      ].join(' | ');

      const { error } = await supabase.from('candidatos').insert([
        {
          nome: examForm.nome,
          telefone: examForm.telefone,
          mensagem,
          pontuacao_quiz: score,
          status: 'PROVA_DPF'
        }
      ]);

      if (error) {
        throw error;
      }

      setExamStatus('success');
      setExamStep('result');
    } catch (err) {
      setExamStatus('error');
      setExamError('Ocorreu um erro ao registrar a prova. Tente novamente ou avise a chefia.');
    }
  };

  return (
    <div className="space-y-20 pb-20">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-federal-900" />
        <div className="absolute inset-x-0 -top-32 h-64 bg-gradient-to-b from-federal-600/30 to-transparent blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-federal-900/60 border border-federal-700/70 text-federal-200 text-xs font-semibold uppercase tracking-[0.18em]">
              <Shield size={16} className="text-federal-400" />
              <span>Treinamento Oficial DPF</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
              A formação de excelência começa aqui.
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl">
              Material de estudo para novos integrantes da Polícia Federal, focado na estrutura,
              missão institucional e funcionamento da instituição.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#estrutura-curso"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-federal-600 hover:bg-federal-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-federal-900/40 transition-transform hover:-translate-y-0.5"
              >
                Acessar Conteúdo do Curso
              </a>
              <a
                href="#regra-de-ouro"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-100 font-semibold text-sm tracking-wide transition-colors"
              >
                Ver Regra de Ouro
              </a>
            </div>
          </div>
          <div className="flex-1 w-full max-w-md lg:max-w-lg">
            <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-federal-900 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),transparent_60%)]" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-federal-700 flex items-center justify-center">
                      <GraduationCap className="text-federal-300" size={26} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                        Curso Operacional
                      </p>
                      <p className="text-sm font-medium text-slate-100">
                        Curso de Formação Institucional - DPF
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                    Focado no DPF
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>
                    Visual sério, policial e investigativo, com ênfase em crimes federais, operações interestaduais e
                    integração entre Agentes, Escrivães, Delegados e Peritos Criminais Federais.
                  </p>
                  <p>
                    Todo o conteúdo é construído para aeo atendimenooatend meiio cnlcial pmeprrmeiia vatturaura,
                    oipiimo po policiolico pprmeero contatoccomnttloc c dcetortee.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wide">Foco</span>
                    <span>Conhecimento institucional e operacional.</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wide">Público-alvo</span>
                    <span>Novos policiais e aspirantes à carreira.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="dpf" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
              <Shield size={30} className="text-federal-400" />
              O que é o DPF
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              O Departamento de Polícia Federal é a instituição de excelência responsável por apurar
              infrações penais contra a ordem política e social ou em detrimento de bens, serviços e interesses da União.
            </p>
            <p className="text-slate-300 text-base leading-relaxed">
              Sua missão é atuar com rigor técnico e científico, garantindo a preservação de provas e a elucidação
              de crimes federais, mantendo a ordem e a segurança pública.
            </p>
          </div>
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-[0.18em] mb-3">
                Ocorrências típicas do DPF
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Crimes Federais
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Tráfico Internacional
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Corrupção
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Crimes Cibernéticos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Crimes Ambientais
                </li>
              </ul>
            </div>
            <div className="bg-federal-900/60 border border-federal-700/60 rounded-2xl p-5">
              <p className="text-xs font-semibold text-federal-300 uppercase tracking-[0.2em] mb-2">
                Frase de referência
              </p>
              <p className="text-lg font-semibold text-federal-50">
                “Descobrir o que aconteceu, como aconteceu, por que aconteceu e quem fez.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="regra-de-ouro"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl border border-federal-500/40 bg-gradient-to-br from-federal-900/40 via-slate-950 to-slate-950 shadow-xl overflow-hidden">
          <div className="px-6 sm:px-8 py-6 border-b border-federal-500/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-federal-600/20 border border-federal-500/60 flex items-center justify-center">
              <Shield className="text-federal-300" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-federal-200">
                Compromisso Institucional
              </p>
              <p className="text-sm text-federal-100">
                A base que sustenta a confiança da sociedade.
              </p>
            </div>
          </div>
          <div className="px-6 sm:px-8 py-8 space-y-6">
            <div className="space-y-2">
              <p className="text-lg font-bold text-white">
                O que define o Policial Federal?
              </p>
              <ul className="space-y-1 text-sm font-semibold text-federal-100">
                <li>LEALDADE À CONSTITUIÇÃO.</li>
                <li>ÉTICA PROFISSIONAL INEGOCIÁVEL.</li>
                <li>DISCIPLINA E HIERARQUIA.</li>
                <li>EFICIÊNCIA NO SERVIÇO PÚBLICO.</li>
              </ul>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-100">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Legalidade
                </p>
                <p className="text-slate-200">
                  Toda ação policial deve estar estritamente amparada na lei. O Policial Federal é, antes de tudo, um garantidor de direitos.
                </p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Excelência Técnica
                </p>
                <p className="text-slate-200">
                  A investigação criminal exige conhecimento científico, uso de tecnologia e constante aprimoramento profissional.
                </p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Probidade
                </p>
                <p className="text-slate-200">
                  A honestidade e a integridade são valores absolutos. A corrupção é o maior inimigo da instituição.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="estrutura-curso"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
              <GraduationCap size={30} className="text-federal-400" />
              Estrutura do Curso em Módulos
            </h2>
            <p className="text-slate-300 mt-3 max-w-2xl">
              Cada módulo aborda um aspecto fundamental da Polícia Federal, desde sua história e estrutura
              até suas áreas de atuação e valores, proporcionando uma visão completa da instituição.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() => setSelectedModule(module)}
              className="group text-left bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-federal-500/70 hover:bg-slate-900 transition-all flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-federal-600/20 text-federal-300 text-xs font-bold border border-federal-500/40">
                  {String(module.id).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 group-hover:text-federal-300">
                  Módulo do Curso
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white group-hover:text-federal-200">
                  {module.title}
                </h3>
                <p className="text-xs text-slate-300">
                  {module.description}
                </p>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-federal-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-federal-400 group-hover:bg-federal-200" />
                Abrir conteúdo detalhado
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Microscope size={28} className="text-federal-400" />
              O Ciclo da Investigação
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              A Polícia Federal atua com base em inteligência e prova técnica. A investigação criminal é o instrumento
              para alcançar a verdade real dos fatos e garantir a aplicação da lei penal.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Do trabalho de campo à análise de dados, cada etapa é crucial para desarticular organizações criminosas
              e combater a corrupção, sempre respeitando os direitos fundamentais e o devido processo legal.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">
                Investigação
              </p>
              <ul className="space-y-1.5 text-xs text-slate-200">
                <li>Coleta de provas e oitivas.</li>
                <li>Operações policiais e cumprimento de mandados.</li>
                <li>Materialidade e autoria delitiva.</li>
              </ul>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">
                Inteligência
              </p>
              <ul className="space-y-1.5 text-xs text-slate-200">
                <li>Produção de conhecimento estratégico.</li>
                <li>Análise de vínculos e dados financeiros.</li>
                <li>Assessoramento para tomada de decisão.</li>
              </ul>
            </div>
            <div className="bg-federal-900/70 border border-federal-700/60 rounded-2xl p-5 sm:col-span-2">
              <p className="text-xs font-semibold text-federal-300 uppercase tracking-[0.18em] mb-1">
                Integração Operacional
              </p>
              <p className="text-xs sm:text-sm text-federal-50">
                A união entre investigação, inteligência e perícia permite à Polícia Federal enfrentar a criminalidade
                organizada com eficiência, técnica e resultados efetivos para a sociedade.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-950 border border-red-600/40 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/60 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-red-200 uppercase tracking-[0.2em]">
                  Regime Disciplinar (Lei 4.878/65)
                </p>
                <p className="text-sm text-red-100">
                  Infrações que atentam contra o decoro e a eficácia da Polícia Federal.
                </p>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold text-red-200">Abuso da Condição Policial</p>
                <p>Art. 43, XLVIII: Prevalecer-se, abusivamente, da condição de funcionário policial.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold text-red-200">Sigilo Funcional</p>
                <p>Art. 43, XXXII: Divulgar, através da imprensa escrita, falada ou televisionada, fatos ocorridos na repartição.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold text-red-200">Negligência</p>
                <p>Art. 43, XX: Deixar de cumprir ou de fazer cumprir, na esfera de suas atribuições, as leis e os regulamentos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold text-red-200">Escândalo</p>
                <p>Art. 43, VIII: Praticar ato que importe em escândalo ou que concorra para comprometer a função policial.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold text-red-200">Corrupção/Vantagem</p>
                <p>Art. 43, LII: Solicitar ou receber propina, comissão, presente ou vantagem de qualquer espécie.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold text-red-200">Violência Desnecessária</p>
                <p>Art. 43, LXII: Praticar ato lesivo da honra ou do patrimônio, com abuso ou desvio de poder.</p>
              </div>
            </div>
          </div>
          <p className="text-sm font-semibold text-red-100 mt-2">
            “A função policial funda-se na hierarquia e na disciplina.” (Art. 2º da Lei 4.878/65)
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardCheck size={24} className="text-federal-400" />
              <h2 className="text-2xl font-bold text-white">
                Deveres Fundamentais
              </h2>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              O que se espera de todo integrante da Polícia Federal no exercício de suas funções.
            </p>
            <div className="space-y-3 text-sm text-slate-100">
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Servir e proteger a sociedade com dedicação e coragem.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Respeitar incondicionalmente os direitos e garantias fundamentais.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Atuar com imparcialidade, legalidade e isenção.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Manter conduta ilibada na vida pública e privada.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Zelar pela imagem e pelo bom nome da Polícia Federal.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Buscar constante aprimoramento técnico e profissional.</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-950 border border-federal-700/60 rounded-3xl p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Gavel size={24} className="text-federal-400" />
              <h2 className="text-2xl font-bold text-white">
                Legislação Essencial
              </h2>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              O arcabouço jurídico indispensável para o Policial Federal.
            </p>
            <div className="space-y-4 text-sm text-slate-100">
              <div className="border-l-2 border-federal-500 pl-3">
                <p className="font-bold text-federal-200">CF/88, Art. 144</p>
                <p className="text-xs text-slate-300">Define a PF como órgão permanente, organizado e mantido pela União.</p>
              </div>
              <div className="border-l-2 border-federal-500 pl-3">
                <p className="font-bold text-federal-200">Lei 12.830/2013</p>
                <p className="text-xs text-slate-300">Investigação criminal conduzida pelo Delegado de Polícia.</p>
              </div>
              <div className="border-l-2 border-federal-500 pl-3">
                <p className="font-bold text-federal-200">Lei 12.850/2013</p>
                <p className="text-xs text-slate-300">Combate às Organizações Criminosas e meios de obtenção de prova.</p>
              </div>
              <div className="border-l-2 border-federal-500 pl-3">
                <p className="font-bold text-federal-200">Lei 13.869/2019</p>
                <p className="text-xs text-slate-300">Nova Lei de Abuso de Autoridade.</p>
              </div>
              <div className="border-l-2 border-federal-500 pl-3">
                <p className="font-bold text-federal-200">Lei 11.343/2006</p>
                <p className="text-xs text-slate-300">Lei de Drogas (Repressão ao Tráfico Nacional e Internacional).</p>
              </div>
              <div className="border-l-2 border-federal-500 pl-3">
                <p className="font-bold text-federal-200">Lei 10.446/2002</p>
                <p className="text-xs text-slate-300">Infrações de repercussão interestadual ou internacional.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <p className="text-sm text-slate-300 text-center max-w-2xl">
            Após estudar o conteúdo, você pode testar seus conhecimentos em uma prova oficial deste curso.
            São 20 questões objetivas focadas na estrutura, história e funcionamento da instituição.
          </p>
          <button
            type="button"
            onClick={handleOpenExam}
            className="px-8 py-4 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all hover:-translate-y-1 shadow-lg shadow-federal-900/20"
          >
            Iniciar Prova
          </button>
        </div>
      </section>

      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-federal-600/20 border border-federal-500/60 flex items-center justify-center">
                  <GraduationCap size={22} className="text-federal-200" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
                    Conteúdo do Módulo
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {selectedModule.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModule(null)}
                className="text-slate-400 hover:text-white text-sm font-semibold"
              >
                Fechar
              </button>
            </div>
            <div className="px-6 sm:px-8 py-6 space-y-4">
              <p className="text-sm text-slate-300">
                {selectedModule.description}
              </p>
              <ul className="space-y-2 text-sm text-slate-200">
                {selectedModule.content.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-federal-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {showExam && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
                  Prova Oficial do Curso
                </p>
                <p className="text-sm font-semibold text-white">
                  Conhecimentos Institucionais – DPF
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseExam}
                className="text-slate-400 hover:text-white text-sm font-semibold"
              >
                Fechar
              </button>
            </div>

            <div className="px-6 sm:px-8 py-6 space-y-6">
              {examStep === 'form' && (
                <form onSubmit={handleExamFormSubmit} className="space-y-5">
                  <p className="text-sm text-slate-300">
                    Preencha seus dados para identificação interna. As informações e o resultado serão enviados
                    para a área de configurações da dashboard.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        required
                        value={examForm.nome}
                        onChange={(e) => setExamForm({ ...examForm, nome: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                        placeholder="Ex: Inspetor João Silva"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Matrícula / Identificação
                      </label>
                      <input
                        type="text"
                        value={examForm.matricula}
                        onChange={(e) => setExamForm({ ...examForm, matricula: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                        placeholder="Ex: 12345-XX"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Lotação / Unidade
                      </label>
                      <input
                        type="text"
                        value={examForm.lotacao}
                        onChange={(e) => setExamForm({ ...examForm, lotacao: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                        placeholder="Ex: DPF, Superintendência Regional"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Telefone / Contato
                      </label>
                      <input
                        type="text"
                        value={examForm.telefone}
                        onChange={(e) => setExamForm({ ...examForm, telefone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
                        placeholder="Ex: (00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-federal-900/20"
                    >
                      Iniciar Prova
                    </button>
                  </div>
                </form>
              )}

              {examStep === 'quiz' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">
                      Prova com 20 questões objetivas
                    </p>
                    <p className="text-xs text-slate-400">
                      É necessário acertar pelo menos 10 questões para ser considerado aprovado.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {examQuestions.map((q, index) => (
                      <div
                        key={q.id}
                        className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3"
                      >
                        <p className="text-sm text-white font-semibold flex gap-2">
                          <span className="text-federal-400">#{index + 1}</span>
                          {q.question}
                        </p>
                        <div className="grid sm:grid-cols-3 gap-2">
                          {q.options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleExamAnswer(q.id, opt.id)}
                              className={`text-left px-3 py-2 rounded-lg border text-xs ${
                                examAnswers[q.id] === opt.id
                                  ? 'bg-federal-600 border-federal-500 text-white'
                                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              <span className="font-semibold mr-1 uppercase">{opt.id})</span>
                              {opt.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {examError && (
                    <p className="text-xs text-red-400">
                      {examError}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleExamSubmit}
                      disabled={examStatus === 'submitting'}
                      className="px-8 py-3 bg-federal-600 hover:bg-federal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-federal-900/20"
                    >
                      {examStatus === 'submitting' ? 'Enviando...' : 'Finalizar Prova'}
                    </button>
                  </div>
                </div>
              )}

              {examStep === 'result' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300">
                    Prova registrada com sucesso. Seu resultado foi:
                  </p>
                  <p className="text-xl font-bold text-white">
                    {examScore}/20 acertos – {examScore >= 10 ? 'APROVADO' : 'REPROVADO'}
                  </p>
                  <p className="text-xs text-slate-400">
                    As informações desta prova foram enviadas para a área de configurações da dashboard, para
                    acompanhamento pela chefia.
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleCloseExam}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

