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
    title: 'Módulo 1 — História e Missão da Polícia Rodoviária Federal',
    description: 'A origem, evolução e o papel constitucional da instituição.',
    content: [
      'Origem histórica da Polícia Rodoviária Federal no Brasil (1928).',
      'O Artigo 144 da Constituição Federal: Patrulhamento ostensivo das rodovias federais.',
      'Missão: Proteger a vida, garantir a fluidez do trânsito e combater o crime nas rodovias.',
      'A Polícia Rodoviária Federal como órgão permanente e de carreira única.'
    ]
  },
  {
    id: 2,
    title: 'Módulo 2 — Estrutura Organizacional',
    description: 'Como a PRF está organizada em todo o território nacional.',
    content: [
      'Direção Geral em Brasília e Superintendências Regionais nos estados.',
      'Delegacias e Unidades Operacionais (UOPs).',
      'Divisão de áreas de atuação e circunscrições.',
      'A capilaridade e a presença em todas as rodovias federais.'
    ]
  },
  {
    id: 3,
    title: 'Módulo 3 — Carreira da Polícia Rodoviária Federal',
    description: 'A carreira única e suas funções.',
    content: [
      'Policial Rodoviário Federal: Cargo único, com diversas classes e padrões.',
      'Atribuições: Fiscalização de trânsito, combate ao crime, atendimento a acidentes.',
      'Possibilidade de especialização (motopoliciamento, operações aéreas, etc.).',
      'A importância da uniformidade e disciplina.'
    ]
  },
  {
    id: 4,
    title: 'Módulo 4 — Atribuições de Trânsito',
    description: 'A fiscalização e segurança viária.',
    content: [
      'Fiscalização do Código de Trânsito Brasileiro (CTB).',
      'Prevenção e atendimento de acidentes de trânsito.',
      'Educação para o trânsito e cidadania.',
      'Controle de peso e dimensões de veículos de carga.'
    ]
  },
  {
    id: 5,
    title: 'Módulo 5 — Combate ao Crime',
    description: 'A atuação da PRF no enfrentamento à criminalidade.',
    content: [
      'Combate ao tráfico de drogas e armas em rodovias.',
      'Recuperação de veículos roubados e furtados.',
      'Enfrentamento ao contrabando e descaminho.',
      'Crimes ambientais e exploração sexual de crianças e adolescentes.'
    ]
  },
  {
    id: 6,
    title: 'Módulo 6 — Grupos Especializados',
    description: 'As unidades de elite e apoio operacional da PRF.',
    content: [
      'GRR (Grupo de Resposta Rápida).',
      'NOE (Núcleo de Operações Especiais).',
      'DOA (Divisão de Operações Aéreas).',
      'GOC (Grupo de Operações com Cães).'
    ]
  },
  {
    id: 7,
    title: 'Módulo 7 — Inteligência Policial',
    description: 'O uso da informação estratégica.',
    content: [
      'Sistemas de monitoramento e câmeras (OCR).',
      'Integração com outros órgãos de segurança.',
      'Análise criminal e planejamento operacional.',
      'Produção de conhecimento para a segurança viária.'
    ]
  },
  {
    id: 8,
    title: 'Módulo 8 — Direitos Humanos e Cidadania',
    description: 'A atuação policial pautada no respeito ao cidadão.',
    content: [
      'Atendimento humanizado em acidentes.',
      'Respeito aos direitos fundamentais.',
      'Uso diferenciado da força.',
      'A PRF como polícia cidadã.'
    ]
  },
  {
    id: 9,
    title: 'Módulo 9 — Ética e Disciplina',
    description: 'Os valores institucionais da PRF.',
    content: [
      'Transparência, integridade e profissionalismo.',
      'Hierarquia e disciplina funcionais.',
      'O Código de Ética e Disciplina da PRF.',
      'Compromisso com o serviço público.'
    ]
  },
  {
    id: 10,
    title: 'Módulo 10 — O Orgulho de Ser PRF',
    description: 'O espírito de corpo e a identidade institucional.',
    content: [
      'A farda cáqui e seus significados.',
      'O lema: "Polícia Rodoviária Federal, o Brasil caminha com segurança".',
      'A importância da PRF para a integração nacional.',
      'Bem-vindo à Polícia Rodoviária Federal.'
    ]
  }
];

const examQuestions = [
  {
    id: 1,
    question: 'Qual é a principal atribuição constitucional da Polícia Rodoviária Federal (Art. 144 CF)?',
    options: [
      { id: 'a', text: 'Investigação de crimes federais' },
      { id: 'b', text: 'Patrulhamento ostensivo das rodovias federais' },
      { id: 'c', text: 'Policiamento marítimo e aeroportuário' }
    ],
    correct: 'b'
  },
  {
    id: 2,
    question: 'Sobre a estrutura de carreira da PRF, é correto afirmar:',
    options: [
      { id: 'a', text: 'Possui cargos de Delegado, Agente e Escrivão' },
      { id: 'b', text: 'É organizada em carreira única de Policial Rodoviário Federal' },
      { id: 'c', text: 'É dividida em oficiais e praças, como a PM' }
    ],
    correct: 'b'
  },
  {
    id: 3,
    question: 'O que significa a sigla UOP na estrutura da PRF?',
    options: [
      { id: 'a', text: 'Unidade de Operações Policiais' },
      { id: 'b', text: 'Unidade Operacional (Posto PRF)' },
      { id: 'c', text: 'União dos Oficiais de Polícia' }
    ],
    correct: 'b'
  },
  {
    id: 4,
    question: 'Qual destes grupos especializados pertence à PRF?',
    options: [
      { id: 'a', text: 'COT (Comando de Operações Táticas)' },
      { id: 'b', text: 'NOE (Núcleo de Operações Especiais)' },
      { id: 'c', text: 'GATE (Grupo de Ações Táticas Especiais)' }
    ],
    correct: 'b'
  },
  {
    id: 5,
    question: 'No combate ao crime, a PRF atua frequentemente na repressão de:',
    options: [
      { id: 'a', text: 'Crimes contra a honra na internet' },
      { id: 'b', text: 'Tráfico de drogas, armas e contrabando em rodovias' },
      { id: 'c', text: 'Crimes eleitorais' }
    ],
    correct: 'b'
  },
  {
    id: 6,
    question: 'Qual sistema é amplamente utilizado pela PRF para leitura de placas?',
    options: [
      { id: 'a', text: 'OCR (Optical Character Recognition)' },
      { id: 'b', text: 'GPS (Global Positioning System)' },
      { id: 'c', text: 'HTML (HyperText Markup Language)' }
    ],
    correct: 'a'
  },
  {
    id: 7,
    question: 'A PRF foi criada no ano de:',
    options: [
      { id: 'a', text: '1988' },
      { id: 'b', text: '1928' },
      { id: 'c', text: '1964' }
    ],
    correct: 'b'
  },
  {
    id: 8,
    question: 'O atendimento a acidentes de trânsito pela PRF visa principalmente:',
    options: [
      { id: 'a', text: 'Multar os envolvidos' },
      { id: 'b', text: 'Garantir a fluidez, segurança e socorro às vítimas' },
      { id: 'c', text: 'Vender seguros de automóveis' }
    ],
    correct: 'b'
  },
  {
    id: 9,
    question: 'Sobre o uso da força pela PRF:',
    options: [
      { id: 'a', text: 'Deve ser sempre letal' },
      { id: 'b', text: 'Deve seguir os princípios da necessidade, proporcionalidade e legalidade' },
      { id: 'c', text: 'Não é permitido em nenhuma hipótese' }
    ],
    correct: 'b'
  },
  {
    id: 10,
    question: 'A fiscalização de trânsito pela PRF baseia-se fundamentalmente:',
    options: [
      { id: 'a', text: 'No Código Penal' },
      { id: 'b', text: 'No Código de Trânsito Brasileiro (CTB)' },
      { id: 'c', text: 'No Código Civil' }
    ],
    correct: 'b'
  },
  {
    id: 11,
    question: 'O combate à exploração sexual de crianças e adolescentes nas rodovias é:',
    options: [
      { id: 'a', text: 'Uma atribuição exclusiva do Conselho Tutelar' },
      { id: 'b', text: 'Uma das pautas de direitos humanos defendidas e fiscalizadas pela PRF' },
      { id: 'c', text: 'Irrelevante para a segurança viária' }
    ],
    correct: 'b'
  },
  {
    id: 12,
    question: 'A competência territorial da PRF abrange:',
    options: [
      { id: 'a', text: 'Apenas as capitais dos estados' },
      { id: 'b', text: 'Todas as rodovias e estradas federais' },
      { id: 'c', text: 'Apenas as fronteiras secas' }
    ],
    correct: 'b'
  },
  {
    id: 13,
    question: 'Em caso de crime flagrante em rodovia federal, a PRF deve:',
    options: [
      { id: 'a', text: 'Ignorar e chamar a Polícia Civil' },
      { id: 'b', text: 'Realizar a prisão e encaminhar à Polícia Judiciária competente' },
      { id: 'c', text: 'Julgar o criminoso no local' }
    ],
    correct: 'b'
  },
  {
    id: 14,
    question: 'O "Sinal de Pare" emanado por um PRF:',
    options: [
      { id: 'a', text: 'É apenas uma sugestão' },
      { id: 'b', text: 'É ordem legal e deve ser obedecida imediatamente' },
      { id: 'c', text: 'Só vale durante o dia' }
    ],
    correct: 'b'
  },
  {
    id: 15,
    question: 'A fiscalização de alcoolemia (bafômetro) visa:',
    options: [
      { id: 'a', text: 'Arrecadar dinheiro para o governo' },
      { id: 'b', text: 'Prevenir acidentes causados por embriaguez ao volante' },
      { id: 'c', text: 'Atrasar a viagem dos motoristas' }
    ],
    correct: 'b'
  },
  {
    id: 16,
    question: 'O transporte de produtos perigosos sem autorização é:',
    options: [
      { id: 'a', text: 'Permitido à noite' },
      { id: 'b', text: 'Infração e crime ambiental passível de fiscalização pela PRF' },
      { id: 'c', text: 'Problema apenas da empresa transportadora' }
    ],
    correct: 'b'
  },
  {
    id: 17,
    question: 'A PRF pode atuar fora das rodovias federais?',
    options: [
      { id: 'a', text: 'Nunca' },
      { id: 'b', text: 'Sim, em situações excepcionais, apoio a outros órgãos ou interesse da União' },
      { id: 'c', text: 'Sim, mas apenas em dias de feriado' }
    ],
    correct: 'b'
  },
  {
    id: 18,
    question: 'O lema "Polícia de todos os brasileiros" refere-se à:',
    options: [
      { id: 'a', text: 'Polícia Militar' },
      { id: 'b', text: 'Polícia Rodoviária Federal' },
      { id: 'c', text: 'Guarda Municipal' }
    ],
    correct: 'b'
  },
  {
    id: 19,
    question: 'Qual documento é obrigatório para condutores e fiscalizado pela PRF?',
    options: [
      { id: 'a', text: 'Título de Eleitor' },
      { id: 'b', text: 'CNH (Carteira Nacional de Habilitação)' },
      { id: 'c', text: 'Carteira de Trabalho' }
    ],
    correct: 'b'
  },
  {
    id: 20,
    question: 'A PRF é uma instituição de Estado, o que significa que:',
    options: [
      { id: 'a', text: 'Serve aos interesses do governo de plantão' },
      { id: 'b', text: 'Serve à sociedade e ao Estado brasileiro, independente de governos' },
      { id: 'c', text: 'É uma empresa privada' }
    ],
    correct: 'b'
  }
];

const CursoPRF = () => {
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

    const aprovado = score >= 14; // Critério um pouco mais rigoroso ou igual (70%) - user didn't specify, keeping logical. 14/20 = 70%.

    try {
      const mensagem = [
        'Prova PRF - Curso de Formação Profissional (CFP)',
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
          status: 'PROVA_PRF' // Distinct status for PRF
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900" /> {/* Blue for PRF (traditionally yellow/blue) - keeping dark theme consistent but slightly blue-ish */}
        <div className="absolute inset-x-0 -top-32 h-64 bg-gradient-to-b from-yellow-500/20 to-transparent blur-3xl" /> {/* Yellow accent for PRF */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 lg:py-28 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-yellow-500/50 text-yellow-500 text-xs font-semibold uppercase tracking-[0.18em] mb-6">
            <Shield size={16} className="text-yellow-500" />
            <span>Treinamento Oficial PRF</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Curso de Formação PRF
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Material de estudo para novos integrantes da Polícia Rodoviária Federal, focado na
            legislação de trânsito, combate ao crime e valores institucionais.
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
              <GraduationCap size={30} className="text-yellow-500" />
              Módulos de Ensino PRF
            </h2>
            <p className="text-slate-300 mt-3 max-w-2xl">
              Conteúdo programático essencial para o desempenho das atividades de policiamento
              rodoviário e segurança pública.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() => setSelectedModule(module)}
              className="group text-left bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-yellow-500/70 hover:bg-slate-900 transition-all flex flex-col gap-3 h-full"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-900/40 text-yellow-500 text-xs font-bold border border-yellow-500/40">
                  {String(module.id).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 group-hover:text-yellow-500">
                  Módulo PRF
                </span>
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-sm font-semibold text-white group-hover:text-yellow-200">
                  {module.title}
                </h3>
                <p className="text-xs text-slate-300 mb-3">
                  {module.description}
                </p>
                <ul className="space-y-1.5 border-t border-slate-800 pt-3 mt-3">
                  {module.content.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-yellow-500 shrink-0 opacity-70" />
                      <span className="leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-yellow-500 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 group-hover:bg-yellow-200" />
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
              <Shield size={28} className="text-yellow-500" />
              Excelência na Rodovia
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              A Polícia Rodoviária Federal é referência em policiamento ostensivo e segurança viária.
              Sua atuação vai além do trânsito, sendo fundamental no combate ao tráfico de drogas,
              armas e seres humanos nas fronteiras e corredores logísticos do país.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">
                Trânsito Seguro
              </p>
              <div className="text-2xl font-bold text-white mb-1">Fiscalização</div>
              <p className="text-xs text-slate-400">Aplicação rigorosa do CTB para salvar vidas.</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">
                Combate ao Crime
              </p>
              <div className="text-2xl font-bold text-white mb-1">Repressão</div>
              <p className="text-xs text-slate-400">Enfrentamento qualificado à criminalidade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Exam CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-12">
        <div className="bg-gradient-to-r from-blue-900/40 to-yellow-600/20 border border-yellow-500/30 rounded-3xl p-8 sm:p-12 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Prova de Capacitação PRF
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
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
              className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-black rounded-xl transition-all hover:-translate-y-1 shadow-lg shadow-yellow-500/20"
            >
              INICIAR PROVA PRF
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

      {/* Module Modal */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedModule(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedModule(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 rounded-full p-2 transition-colors"
            >
              <Ban size={24} />
            </button>
            <div className="p-8 space-y-6">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-500 text-xs font-bold uppercase tracking-wider mb-4">
                  Módulo {selectedModule.id}
                </span>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {selectedModule.title}
                </h3>
                <p className="text-slate-400 text-lg">
                  {selectedModule.description}
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                  Conteúdo Programático
                </h4>
                <ul className="space-y-3">
                  {selectedModule.content.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                      <CheckSquare className="text-yellow-500 mt-1 shrink-0" size={18} />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-6 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedModule(null)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
                >
                  Fechar Módulo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {showExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckSquare className="text-yellow-500" />
                Prova de Capacitação PRF
              </h3>
              {examStep !== 'result' && (
                 <button onClick={handleCloseExam} className="text-slate-400 hover:text-white">
                   <Ban size={24} />
                 </button>
              )}
            </div>

            <div className="p-6 sm:p-8">
              {examStep === 'form' && (
                <form onSubmit={handleExamFormSubmit} className="space-y-6">
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-200">
                      Preencha seus dados corretamente. Eles serão utilizados para o registro da sua nota
                      e emissão do certificado caso aprovado.
                    </p>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">Nome Completo</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none transition-colors"
                        value={examForm.nome}
                        onChange={e => setExamForm({...examForm, nome: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">Passaporte (Discord)</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none transition-colors"
                        value={examForm.matricula}
                        onChange={e => setExamForm({...examForm, matricula: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">Lotação Pretendida</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none transition-colors"
                        value={examForm.lotacao}
                        onChange={e => setExamForm({...examForm, lotacao: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">Telefone (Opcional)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none transition-colors"
                        value={examForm.telefone}
                        onChange={e => setExamForm({...examForm, telefone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-black rounded-xl transition-all hover:-translate-y-1 shadow-lg shadow-yellow-900/20"
                    >
                      INICIAR PROVA
                    </button>
                  </div>
                </form>
              )}

              {examStep === 'quiz' && (
                <div className="space-y-8">
                  <div className="space-y-8">
                    {examQuestions.map((q, index) => (
                      <div key={q.id} className="space-y-3 pb-6 border-b border-slate-800 last:border-0">
                        <p className="text-white font-medium text-lg">
                          <span className="text-yellow-500 font-bold mr-2">{index + 1}.</span>
                          {q.question}
                        </p>
                        <div className="space-y-2 pl-4">
                          {q.options.map((opt) => (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                examAnswers[q.id] === opt.id
                                  ? 'bg-yellow-500/10 border-yellow-500 text-white'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                className="hidden"
                                checked={examAnswers[q.id] === opt.id}
                                onChange={() => handleExamAnswer(q.id, opt.id)}
                              />
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                examAnswers[q.id] === opt.id ? 'border-yellow-500' : 'border-slate-600'
                              }`}>
                                {examAnswers[q.id] === opt.id && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                )}
                              </div>
                              <span>{opt.text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {examStatus === 'error' && (
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-200 text-sm">
                      {examError}
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleExamSubmit}
                      disabled={Object.keys(examAnswers).length < examQuestions.length || examStatus === 'submitting'}
                      className={`px-8 py-4 font-bold rounded-xl transition-all ${
                        Object.keys(examAnswers).length < examQuestions.length
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-500 text-white hover:-translate-y-1 shadow-lg shadow-green-900/20'
                      }`}
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
                    {examScore}/20 acertos – {examScore >= 14 ? 'APROVADO' : 'REPROVADO'}
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

export default CursoPRF;
