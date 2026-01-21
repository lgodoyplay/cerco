import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Shield,
  GraduationCap,
  CheckSquare,
  Microscope,
  Gavel,
  ClipboardCheck,
  Ban
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
    question: 'No contexto de uma operação policial de alto risco, qual é o protocolo prioritário do Comandante de Cena?',
    options: [
      { id: 'a', text: 'Entrar sozinho no perímetro para negociar' },
      { id: 'b', text: 'Estabelecer perímetro, conter a crise e coordenar as equipes táticas' },
      { id: 'c', text: 'Aguardar a imprensa chegar para dar entrevista' }
    ],
    correct: 'b'
  },
  {
    id: 2,
    question: 'Sobre o Inquérito Policial (IP), é correto afirmar que:',
    options: [
      { id: 'a', text: 'É um processo judicial presidido pelo Juiz' },
      { id: 'b', text: 'É um procedimento administrativo, inquisitivo e preparatório, presidido pelo Delegado' },
      { id: 'c', text: 'Pode ser arquivado diretamente pelo Delegado de Polícia' }
    ],
    correct: 'b'
  },
  {
    id: 3,
    question: 'Na Cadeia de Custódia da prova material, a etapa de "Acondicionamento" visa:',
    options: [
      { id: 'a', text: 'Jogar fora o que não serve' },
      { id: 'b', text: 'Proteger o vestígio de contaminação ou alteração, em embalagem lacrada e identificada' },
      { id: 'c', text: 'Tirar fotos para postar nas redes sociais' }
    ],
    correct: 'b'
  },
  {
    id: 4,
    question: 'Conforme a Lei de Organizações Criminosas (12.850/13), considera-se Organização Criminosa a associação de:',
    options: [
      { id: 'a', text: '3 ou mais pessoas, estruturalmente ordenada' },
      { id: 'b', text: '4 ou mais pessoas, estruturalmente ordenada e com divisão de tarefas' },
      { id: 'c', text: 'Qualquer grupo que cometa crimes' }
    ],
    correct: 'b'
  },
  {
    id: 5,
    question: 'Na Lavagem de Dinheiro, a fase de "Integração" consiste em:',
    options: [
      { id: 'a', text: 'Depositar o dinheiro sujo no banco (Placement)' },
      { id: 'b', text: 'Movimentar o dinheiro para dificultar o rastreio (Layering)' },
      { id: 'c', text: 'Incorporar o capital ilícito na economia formal como se fosse lícito' }
    ],
    correct: 'c'
  },
  {
    id: 6,
    question: 'O princípio da "Compartimentação" na Atividade de Inteligência significa:',
    options: [
      { id: 'a', text: 'Esconder tudo de todos' },
      { id: 'b', text: 'Restringir o conhecimento de dados sensíveis apenas a quem tem real necessidade de conhecer' },
      { id: 'c', text: 'Dividir o escritório em salas pequenas' }
    ],
    correct: 'b'
  },
  {
    id: 7,
    question: 'Em uma situação de Gerenciamento de Crises com reféns, a prioridade absoluta é:',
    options: [
      { id: 'a', text: 'A preservação da vida (de todos os envolvidos)' },
      { id: 'b', text: 'A prisão imediata do causador' },
      { id: 'c', text: 'A aplicação rigorosa da lei' }
    ],
    correct: 'a'
  },
  {
    id: 8,
    question: 'O Indiciamento é um ato privativo do Delegado de Polícia que ocorre quando:',
    options: [
      { id: 'a', text: 'Há apenas suspeitas vagas sobre o autor' },
      { id: 'b', text: 'Existem indícios suficientes de autoria e materialidade delitiva contra o investigado' },
      { id: 'c', text: 'O Ministério Público solicita' }
    ],
    correct: 'b'
  },
  {
    id: 9,
    question: 'A "Difusão Vermelha" (Red Notice) da Interpol serve para:',
    options: [
      { id: 'a', text: 'Alertar sobre perigo de incêndio' },
      { id: 'b', text: 'Solicitar a localização e prisão de pessoas procuradas para extradição' },
      { id: 'c', text: 'Informar sobre pessoas desaparecidas' }
    ],
    correct: 'b'
  },
  {
    id: 10,
    question: 'Cometer Abuso de Autoridade inclui a conduta de:',
    options: [
      { id: 'a', text: 'Algemar preso que oferece resistência física' },
      { id: 'b', text: 'Negar ao interessado ou seu defensor acesso aos autos de investigação (Súmula Vinculante 14)' },
      { id: 'c', text: 'Dar voz de prisão em flagrante' }
    ],
    correct: 'b'
  },
  {
    id: 11,
    question: 'O Relatório Final do Inquérito Policial deve conter:',
    options: [
      { id: 'a', text: 'A opinião pessoal do Delegado sobre o juiz' },
      { id: 'b', text: 'A minuciosa descrição dos fatos, das provas colhidas e a classificação do crime' },
      { id: 'c', text: 'A sentença condenatória do réu' }
    ],
    correct: 'b'
  },
  {
    id: 12,
    question: 'A Lei de Drogas (11.343/06) diferencia usuário de traficante baseando-se em:',
    options: [
      { id: 'a', text: 'Apenas a quantidade de droga apreendida' },
      { id: 'b', text: 'Quantidade, natureza, local, condições da ação e circunstâncias sociais/pessoais' },
      { id: 'c', text: 'A confissão do suspeito apenas' }
    ],
    correct: 'b'
  },
  {
    id: 13,
    question: 'A Corregedoria de Polícia tem como função principal:',
    options: [
      { id: 'a', text: 'Defender policiais em processos judiciais' },
      { id: 'b', text: 'Apurar infrações disciplinares e penais praticadas por servidores policiais' },
      { id: 'c', text: 'Organizar escalas de serviço' }
    ],
    correct: 'b'
  },
  {
    id: 14,
    question: 'Em operações interagências (ex: PF + PRF), o comando deve ser:',
    options: [
      { id: 'a', text: 'Disputado na hora' },
      { id: 'b', text: 'Integrado, com definição prévia de competências e liderança situacional' },
      { id: 'c', text: 'Cada um faz o seu sem conversar' }
    ],
    correct: 'b'
  },
  {
    id: 15,
    question: 'O uso de algemas é lícito (Súmula Vinculante 11) apenas em casos de:',
    options: [
      { id: 'a', text: 'Qualquer prisão para garantir a humilhação' },
      { id: 'b', text: 'Resistência, fundado receio de fuga ou perigo à integridade física (própria ou alheia)' },
      { id: 'c', text: 'Crimes de colarinho branco' }
    ],
    correct: 'b'
  },
  {
    id: 16,
    question: 'A infiltração de agentes em organizações criminosas exige:',
    options: [
      { id: 'a', text: 'Apenas ordem do Delegado' },
      { id: 'b', text: 'Autorização judicial prévia, fundamentada e sigilosa' },
      { id: 'c', text: 'Votação entre os policiais' }
    ],
    correct: 'b'
  },
  {
    id: 17,
    question: 'O crime de Corrupção Passiva (Art. 317 CP) se configura quando o funcionário público:',
    options: [
      { id: 'a', text: 'Oferece dinheiro a outro funcionário' },
      { id: 'b', text: 'Solicita ou recebe, para si ou outrem, vantagem indevida em razão da função' },
      { id: 'c', text: 'Desvia dinheiro público de que tem a posse' }
    ],
    correct: 'b'
  },
  {
    id: 18,
    question: 'O "Flagrante Preparado" (ou provocado) pela polícia:',
    options: [
      { id: 'a', text: 'É a melhor forma de prender criminosos' },
      { id: 'b', text: 'É ilegal e torna a prisão nula (Súmula 145 STF - crime impossível)' },
      { id: 'c', text: 'É permitido em qualquer situação' }
    ],
    correct: 'b'
  },
  {
    id: 19,
    question: 'A autonomia funcional do Perito Criminal visa garantir:',
    options: [
      { id: 'a', text: 'Que ele possa trabalhar de casa' },
      { id: 'b', text: 'A isenção e imparcialidade da prova científica, sem interferência hierárquica no laudo' },
      { id: 'c', text: 'Salários mais altos' }
    ],
    correct: 'b'
  },
  {
    id: 20,
    question: 'O dever de "Sigilo Funcional" implica que o policial:',
    options: [
      { id: 'a', text: 'Não pode contar nada para a esposa' },
      { id: 'b', text: 'Deve guardar segredo sobre informações sensíveis da repartição, sob pena de crime e demissão' },
      { id: 'c', text: 'Só pode falar com jornalistas autorizados' }
    ],
    correct: 'b'
  }
];

const CursoDPF = () => {
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
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [modulesFinished, setModulesFinished] = useState(true);

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
        'Prova DPF - Capacitação Técnica Superior (Curso Avançado)',
        `Nome: ${examForm.nome || 'N/A'}`,
        `Matrícula: ${examForm.matricula || 'N/A'}`,
        `Lotação: ${examForm.lotacao || 'N/A'}`,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 lg:py-28 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-federal-900/60 border border-federal-700/70 text-federal-200 text-xs font-semibold uppercase tracking-[0.18em] mb-6">
            <Shield size={16} className="text-federal-400" />
            <span>Treinamento Oficial DPF</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Curso de Formação Institucional
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Material de estudo para novos integrantes da Polícia Federal, focado na estrutura,
            missão institucional e funcionamento da instituição.
          </p>
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
              className="group text-left bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-federal-500/70 hover:bg-slate-900 transition-all flex flex-col gap-3 h-full"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-federal-600/20 text-federal-300 text-xs font-bold border border-federal-500/40">
                  {String(module.id).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 group-hover:text-federal-300">
                  Módulo do Curso
                </span>
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-semibold text-white group-hover:text-federal-200">
                  {module.title}
                </h3>
                <p className="text-xs text-slate-300 mb-3">
                  {module.description}
                </p>
                <ul className="space-y-1.5 border-t border-slate-800 pt-3 mt-3">
                  {module.content.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-federal-500 shrink-0 opacity-70" />
                      <span className="leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-federal-300 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="w-1.5 h-1.5 rounded-full bg-federal-400 group-hover:bg-federal-200" />
                Clique para expandir
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
        <div className="flex flex-col items-center gap-4 bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <p className="text-sm text-slate-300 text-center max-w-2xl">
            Após estudar o conteúdo, você pode testar seus conhecimentos em uma prova oficial deste curso.
            São 20 questões objetivas focadas na estrutura, história e funcionamento da instituição.
          </p>
          
          {loadingProfile ? (
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="h-12 w-48 bg-slate-800 rounded-xl"></div>
              <p className="text-xs text-slate-500">Verificando permissões...</p>
            </div>
          ) : modulesFinished ? (
            <button
              type="button"
              onClick={handleOpenExam}
              className="px-8 py-4 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all hover:-translate-y-1 shadow-lg shadow-federal-900/20"
            >
              Iniciar Prova
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2 p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
              <Ban size={32} className="text-yellow-500 mb-2" />
              <p className="text-yellow-500 font-bold text-lg">Prova Bloqueada</p>
              <p className="text-sm text-yellow-500/80 text-center max-w-md">
                A prova final estará disponível apenas após a confirmação de conclusão dos módulos pela instrução.
                Continue seus estudos e aguarde a liberação.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
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
                  Prova de Capacitação Técnica Superior
                </p>
                <p className="text-sm font-semibold text-white">
                  Curso de Aperfeiçoamento Profissional – DPF
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
                    Preencha seus dados para identificação interna.
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
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
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
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
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
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
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
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500"
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

export default CursoDPF;
