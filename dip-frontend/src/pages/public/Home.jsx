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
    title: 'Módulo 1 — O DPF e sua missão',
    description: 'Entenda o papel estratégico do DPF dentro da estrutura policial.',
    content: [
      'Apresentação do DPF como unidade especializada na investigação de crimes federais e mortes violentas.',
      'Enquadramento legal e normativo: o que a lei e os regulamentos internos atribuem ao DPF.',
      'Diferença entre atendimento de rotina, patrulhamento e atuação especializada.',
      'Visão de cadeia de custódia: como cada ato no local impacta o trabalho do DPF até a sentença judicial.'
    ]
  },
  {
    id: 2,
    title: 'Módulo 2 — Regra de Ouro do Local de Morte',
    description: 'A regra que separa uma boa investigação de um caso perdido.',
    content: [
      'Conceito de Regra de Ouro: preservar tudo, tocar em nada, acionar a perícia e o DPF.',
      'Por que o impulso de “ajudar” movendo o corpo ou objetos gera danos irreversíveis à prova.',
      'Exemplos reais de investigações prejudicadas por violação da regra de ouro.',
      'Postura profissional esperada do primeiro policial que chega ao local.'
    ]
  },
  {
    id: 3,
    title: 'Módulo 3 — O Primeiro Policial no Local',
    description: 'Condutas obrigatórias de quem chega antes do DPF.',
    content: [
      'Checklist inicial: segurança da guarnição, preservação de vidas e isolamento da área.',
      'Comunicação com a Central e com o DPF: o que informar, como e quando.',
      'Controle de acesso ao local: quem entra, quem não entra e como registrar.',
      'Postura com familiares, curiosos e imprensa sem comprometer a investigação.'
    ]
  },
  {
    id: 4,
    title: 'Módulo 4 — Preservação Total do Local',
    description: 'Técnicas práticas para manter o local intacto até a chegada da perícia.',
    content: [
      'Definição de perímetro primário e secundário e como delimitar cada um.',
      'Uso de viaturas, cones, fitas e barreiras humanas para conter o fluxo de pessoas.',
      'Cuidados com pegadas, marcas de pneus, manchas de sangue e vestígios frágeis.',
      'Registro visual básico, quando autorizado por protocolo, sem invadir o trabalho pericial.'
    ]
  },
  {
    id: 5,
    title: 'Módulo 5 — Por que só a Perícia pode tocar no corpo',
    description: 'Fundamentos técnicos e legais da atuação pericial sobre o cadáver.',
    content: [
      'Diferença entre constatar óbito e prestar socorro em situações de urgência.',
      'Como a posição original do corpo orienta a dinâmica do crime e a linha investigativa.',
      'Impacto de movimentar o cadáver sobre a análise de manchas de sangue, trajetória de projéteis e sinais de defesa.',
      'Responsabilidade funcional de quem desrespeita o limite técnico da perícia.'
    ]
  },
  {
    id: 6,
    title: 'Módulo 6 — Papel do IML',
    description: 'Do recolhimento do corpo ao laudo: o ciclo pericial.',
    content: [
      'Fluxo entre local de crime, remoção e recebimento no Instituto Médico Legal.',
      'Exames realizados no IML: necropsia, exames complementares e documentação fotográfica.',
      'Como o laudo tanatológico subsidia a investigação do DPF.',
      'Prazos, limitações técnicas e importância de laudos bem solicitados pelo delegado.'
    ]
  },
  {
    id: 7,
    title: 'Módulo 7 — Como o DPF monta uma investigação',
    description: 'Etapas da investigação desde o primeiro chamado até o indiciamento.',
    content: [
      'Levantamento preliminar no local e definição de hipóteses iniciais.',
      'Coleta e análise de depoimentos, imagens, registros telefônicos e laudos periciais.',
      'Construção de linha do tempo, dinâmica do crime e motivação provável.',
      'Integração entre delegados, agentes, escrivães e peritos oficiais.'
    ]
  },
  {
    id: 8,
    title: 'Módulo 8 — Erros que destroem investigações',
    description: 'O que nunca deve acontecer em um local de morte.',
    content: [
      'Exemplos de casos comprometidos por manipulação indevida de vestígios.',
      'Impacto jurídico: nulidade de prova, absolvições e arquivamentos.',
      'Como a falta de registro básico inviabiliza a reconstrução do fato.',
      'Cultura de responsabilização: cada um responde pelos atos que pratica no local.'
    ]
  },
  {
    id: 9,
    title: 'Módulo 9 — Atuação do DPF em qualquer área',
    description: 'Doutrina única, mesmo em comunidades ou áreas sensíveis.',
    content: [
      'Aplicação dos mesmos princípios de preservação em áreas de risco e comunidades.',
      'Coordenação com unidades territoriais e forças de apoio tático.',
      'Negociação de acesso ao local sem abrir mão da preservação de prova.',
      'Respeito à população e firmeza técnica na condução da ocorrência.'
    ]
  },
  {
    id: 10,
    title: 'Módulo 10 — Protocolo Operacional Padrão',
    description: 'Transformando a doutrina em procedimento claro e repetível.',
    content: [
      'Passo a passo padronizado desde o primeiro acionamento até a entrega do caso.',
      'Documentos mínimos que devem ser gerados em toda ocorrência de morte.',
      'Comunicação entre DPF, perícia, IML e Ministério Público.',
      'Indicadores de qualidade para medir a eficácia da preservação de local.'
    ]
  },
  {
    id: 11,
    title: 'Módulo 11 — Encerramento e mensagem final',
    description: 'Fechamento doutrinário e reforço da cultura de preservação.',
    content: [
      'Síntese dos principais pontos do curso com foco no dia a dia de rua.',
      'Reflexão sobre a responsabilidade de quem é o primeiro a chegar no local.',
      'Mensagem final do DPF: cada vestígio preservado é um passo rumo à verdade.',
      'Compromisso ético: respeito às vítimas, às famílias e à sociedade.'
    ]
  }
];

const examQuestions = [
  {
    id: 1,
    question: 'Ao chegar primeiro em um possível local de homicídio, qual é a prioridade absoluta?',
    options: [
      { id: 'a', text: 'Verificar bolsos da vítima em busca de documentos' },
      { id: 'b', text: 'Isolar o local, afastar pessoas e acionar DPF e perícia' },
      { id: 'c', text: 'Permitir que familiares se aproximem para reconhecer o corpo' }
    ],
    correct: 'b'
  },
  {
    id: 2,
    question: 'Por que não se deve virar o corpo antes da chegada da perícia?',
    options: [
      { id: 'a', text: 'Porque o corpo pode estar infectado' },
      { id: 'b', text: 'Porque isso altera vestígios de posição, sangue e dinâmica do crime' },
      { id: 'c', text: 'Porque apenas o delegado pode autorizar qualquer contato' }
    ],
    correct: 'b'
  },
  {
    id: 3,
    question: 'Qual é o entendimento correto sobre “todo local é potencial cena de crime”?',
    options: [
      { id: 'a', text: 'Só vale para locais com sinais evidentes de violência' },
      { id: 'b', text: 'Mesmo em suspeita de mal súbito, o local deve ser preservado até conclusão técnica' },
      { id: 'c', text: 'Aplica-se apenas a casos de latrocínio ou execução' }
    ],
    correct: 'b'
  },
  {
    id: 4,
    question: 'O que caracteriza a missão principal do DPF?',
    options: [
      { id: 'a', text: 'Fiscalizar trânsito e aplicar multas' },
      { id: 'b', text: 'Apurar crimes federais e contra a vida, com foco em investigações complexas' },
      { id: 'c', text: 'Realizar policiamento comunitário em áreas de risco' }
    ],
    correct: 'b'
  },
  {
    id: 5,
    question: 'Qual atitude em relação a cápsulas e projéteis encontrados no local é correta?',
    options: [
      { id: 'a', text: 'Recolher rapidamente para evitar que alguém pise' },
      { id: 'b', text: 'Deixar no local e preservar, aguardando a coleta pericial' },
      { id: 'c', text: 'Guardá-los na viatura para entregar depois ao delegado' }
    ],
    correct: 'b'
  },
  {
    id: 6,
    question: 'Por que o isolamento perimétrico é tão importante em locais de morte?',
    options: [
      { id: 'a', text: 'Para evitar que curiosos filmem e gerem repercussão na mídia' },
      { id: 'b', text: 'Para preservar vestígios e impedir contaminação da cena' },
      { id: 'c', text: 'Para facilitar o estacionamento das viaturas' }
    ],
    correct: 'b'
  },
  {
    id: 7,
    question: 'Em relação à atuação do IML, qual afirmação está correta?',
    options: [
      { id: 'a', text: 'O IML apenas guarda corpos até o reconhecimento pela família' },
      { id: 'b', text: 'O IML realiza necropsias e exames que definem causa e meio da morte' },
      { id: 'c', text: 'O IML decide se haverá investigação policial ou não' }
    ],
    correct: 'b'
  },
  {
    id: 8,
    question: 'Qual é o impacto de “organizar” o local antes da perícia?',
    options: [
      { id: 'a', text: 'Ajuda a perícia a circular com mais segurança' },
      { id: 'b', text: 'Destrói a narrativa original da cena e compromete a investigação' },
      { id: 'c', text: 'Não há impacto se for feito com cuidado' }
    ],
    correct: 'b'
  },
  {
    id: 9,
    question: 'O que se entende por preservação total do local?',
    options: [
      { id: 'a', text: 'Manter apenas o corpo intocado; o resto pode ser mexido' },
      { id: 'b', text: 'Proteger todo o perímetro, vestígios, objetos e trajetórias até a chegada da perícia' },
      { id: 'c', text: 'Fechar apenas a área imediatamente ao redor da vítima' }
    ],
    correct: 'b'
  },
  {
    id: 10,
    question: 'Por que só a perícia deve tocar no corpo em locais de morte?',
    options: [
      { id: 'a', text: 'Porque o perito tem prioridade hierárquica sobre o policial' },
      { id: 'b', text: 'Porque qualquer movimentação pode alterar sinais que orientam a dinâmica do crime' },
      { id: 'c', text: 'Porque o policial não tem autorização legal para se aproximar da vítima' }
    ],
    correct: 'b'
  },
  {
    id: 11,
    question: 'Em uma comunidade ou área sensível, como o DPF deve atuar?',
    options: [
      { id: 'a', text: 'Abrindo mão da preservação de prova para evitar conflito' },
      { id: 'b', text: 'Aplicando a mesma doutrina de preservação, ajustando apenas a segurança operacional' },
      { id: 'c', text: 'Deixando a investigação para a unidade territorial local' }
    ],
    correct: 'b'
  },
  {
    id: 12,
    question: 'Qual é uma consequência jurídica de erros graves no local de crime?',
    options: [
      { id: 'a', text: 'Apenas advertência interna; o processo penal não é afetado' },
      { id: 'b', text: 'Possível nulidade de provas, absolvições ou arquivamento do caso' },
      { id: 'c', text: 'Apenas demora maior na conclusão do inquérito' }
    ],
    correct: 'b'
  },
  {
    id: 13,
    question: 'O que significa tratar o local com “respeito à cadeia de custódia”?',
    options: [
      { id: 'a', text: 'Registrar todo vestígio e preservar sua trajetória até o laudo' },
      { id: 'b', text: 'Permitir que cada policial fotografe por conta própria' },
      { id: 'c', text: 'Remover rapidamente objetos para a delegacia' }
    ],
    correct: 'a'
  },
  {
    id: 14,
    question: 'Qual deve ser a postura com familiares e curiosos no local de morte?',
    options: [
      { id: 'a', text: 'Permitir aproximação para acalmar as pessoas, mesmo dentro do perímetro' },
      { id: 'b', text: 'Postura firme e respeitosa, mantendo-os fora da área isolada' },
      { id: 'c', text: 'Evitar qualquer contato e ignorar totalmente a presença deles' }
    ],
    correct: 'b'
  },
  {
    id: 15,
    question: 'Em relação ao laudo do IML, qual é o papel para o DPF?',
    options: [
      { id: 'a', text: 'Apenas formalizar o encerramento do inquérito' },
      { id: 'b', text: 'Fornecer elementos técnicos que confirmam ou corrigem hipóteses da investigação' },
      { id: 'c', text: 'Definir sozinho quem é o autor do crime' }
    ],
    correct: 'b'
  },
  {
    id: 16,
    question: 'Qual é a consequência de permitir livre circulação de curiosos no local?',
    options: [
      { id: 'a', text: 'Apenas maior dificuldade de trabalho para a perícia, sem impacto na prova' },
      { id: 'b', text: 'Contaminação de vestígios, destruição de marcas e perda de informações' },
      { id: 'c', text: 'Nenhuma, se o corpo estiver coberto' }
    ],
    correct: 'b'
  },
  {
    id: 17,
    question: 'O que mede a eficácia da preservação do local segundo a doutrina do curso?',
    options: [
      { id: 'a', text: 'Quantidade de viaturas na cena' },
      { id: 'b', text: 'Qualidade dos vestígios mantidos íntegros até a perícia e o laudo' },
      { id: 'c', text: 'Tempo que a ocorrência levou para ser liberada' }
    ],
    correct: 'b'
  },
  {
    id: 18,
    question: 'Qual é o papel do primeiro policial em relação às testemunhas?',
    options: [
      { id: 'a', text: 'Dispersá-las imediatamente para evitar aglomeração' },
      { id: 'b', text: 'Identificar, proteger e registrar dados básicos das testemunhas-chave' },
      { id: 'c', text: 'Deixar esse trabalho apenas para o delegado' }
    ],
    correct: 'b'
  },
  {
    id: 19,
    question: 'Por que registrar informações básicas logo no atendimento inicial é tão importante?',
    options: [
      { id: 'a', text: 'Para gerar estatística interna da corporação' },
      { id: 'b', text: 'Porque muitos detalhes se perdem com o tempo e com a movimentação do local' },
      { id: 'c', text: 'Para facilitar o trabalho da imprensa' }
    ],
    correct: 'b'
  },
  {
    id: 20,
    question: 'Quando se pode considerar que o trabalho de preservação foi bem-sucedido?',
    options: [
      { id: 'a', text: 'Quando o local é rapidamente liberado para circulação' },
      { id: 'b', text: 'Quando DPF, perícia e IML conseguem reconstruir a dinâmica com base em vestígios íntegros' },
      { id: 'c', text: 'Quando nenhum familiar reclama do atendimento' }
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
        'Prova DPF - Preservação de Local de Morte',
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
              O sucesso da investigação começa na primeira viatura.
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl">
              Curso oficial de capacitação em Preservação de Local de Morte, focado integralmente no DPF
              e na doutrina correta de atendimento inicial em ocorrências de morte violenta ou suspeita.
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
                        Preservação de Local de Morte
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                    Focado no DPF
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>
                    Visual sério, policial e investigativo, com ênfase em cenas de crime, isolamento de área e
                    integração entre DPF, perícia e IML.
                  </p>
                  <p>
                    Todo o conteúdo é construído para a realidade do atendimento inicial: a primeira viatura,
                    o primeiro policial, o primeiro contato com o local de morte.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wide">Foco</span>
                    <span>DPF e preservação de local de morte.</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wide">Público-alvo</span>
                    <span>Policiais e agentes que chegam primeiro ao local.</span>
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
        <div className="rounded-3xl border border-red-500/40 bg-gradient-to-br from-red-900/40 via-slate-950 to-slate-950 shadow-xl overflow-hidden">
          <div className="px-6 sm:px-8 py-6 border-b border-red-500/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/60 flex items-center justify-center">
              <AlertTriangle className="text-red-300" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                Regra de Ouro do Local de Morte
              </p>
              <p className="text-sm text-red-100">
                Uma vez quebrada, a prova dificilmente volta.
              </p>
            </div>
          </div>
          <div className="px-6 sm:px-8 py-8 space-y-6">
            <div className="space-y-2">
              <p className="text-lg font-bold text-white">
                Encontrou alguém caído?
              </p>
              <ul className="space-y-1 text-sm font-semibold text-red-100">
                <li>NÃO TOQUE EM NADA.</li>
                <li>NÃO CONFIRA PULSO.</li>
                <li>NÃO VIRE O CORPO.</li>
                <li>PRIMEIRA COISA: CHAME A PERÍCIA E O DPF.</li>
              </ul>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-100">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Ato técnico
                </p>
                <p className="text-slate-200">
                  Declarar óbito, manusear o corpo e interpretar sinais vitais são atos técnicos que
                  pertencem à equipe de saúde e aos peritos oficiais.
                </p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Todo local é potencial cena de crime
                </p>
                <p className="text-slate-200">
                  Mesmo que pareça um mal súbito, queda ou acidente, o local deve ser tratado como
                  possível cena de crime até conclusão técnica em sentido contrário.
                </p>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Responsabilidade profissional
                </p>
                <p className="text-slate-200">
                  O policial que altera o local assume o risco de comprometer a investigação e a
                  responsabilização do autor.
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
              Cada módulo aprofunda uma etapa crítica da preservação de local de morte e da atuação do
              DPF, com foco em doutrina correta, casos reais e aplicação prática em serviço.
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
              Importância da Perícia e do IML
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              A perícia de local e o Instituto Médico Legal são pilares da investigação de homicídios.
              Sem laudos técnicos consistentes, a narrativa dos fatos fica frágil e vulnerável à contestação
              judicial.
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              A perícia examina cena, vestígios, trajetórias, manchas e dispositivos, enquanto o IML
              responde ao que o corpo tem a dizer: causa da morte, meio empregado, tempo decorrido e sinais
              compatíveis com defesa, tortura ou execução.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">
                O que a perícia faz
              </p>
              <ul className="space-y-1.5 text-xs text-slate-200">
                <li>Analisa a cena de forma técnica e documentada.</li>
                <li>Registra vestígios, manchas, pegadas e trajetórias.</li>
                <li>Gera laudos que sustentam a linha investigativa do DPF.</li>
              </ul>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">
                O que o IML faz
              </p>
              <ul className="space-y-1.5 text-xs text-slate-200">
                <li>Realiza necropsia e exames complementares.</li>
                <li>Define causa, meio e circunstâncias prováveis da morte.</li>
                <li>Fecha o ciclo pericial com laudo que dialoga com o local.</li>
              </ul>
            </div>
            <div className="bg-federal-900/70 border border-federal-700/60 rounded-2xl p-5 sm:col-span-2">
              <p className="text-xs font-semibold text-federal-300 uppercase tracking-[0.18em] mb-1">
                Conexão entre laudo e investigação
              </p>
              <p className="text-xs sm:text-sm text-federal-50">
                Quando local, perícia e IML trabalham de forma integrada, o DPF consegue reconstruir a
                dinâmica do crime com precisão e oferecer ao Judiciário um caso sólido, técnico e robusto.
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
                <Skull size={22} className="text-red-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-red-200 uppercase tracking-[0.2em]">
                  Erros graves
                </p>
                <p className="text-sm text-red-100">
                  Condutas que quebram a cadeia de custódia e comprometem o trabalho do DPF.
                </p>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold">Mexer no corpo</p>
                <p>Mudar posição, erguer cabeça ou conferir bolsos destrói a leitura técnica da cena.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold">Recolher cápsulas ou projéteis</p>
                <p>Retirar vestígios sem técnica rompe a cadeia de custódia e fragiliza o laudo balístico.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold">“Organizar” o local</p>
                <p>Arrastar móveis, limpar sangue ou alinhar objetos destrói a narrativa original do crime.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold">Mudar objetos de lugar</p>
                <p>Armas, celulares e pertences devem permanecer exatamente onde foram encontrados.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <Ban size={18} className="text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200">
                <p className="font-semibold">Deixar curiosos entrarem</p>
                <p>Trânsito desnecessário contamina vestígios, pisa em marcas e espalha informações.</p>
              </div>
            </div>
          </div>
          <p className="text-sm font-semibold text-red-100 mt-2">
            “Isso não é erro pequeno. Isso é destruir prova.”
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardCheck size={24} className="text-federal-400" />
              <h2 className="text-2xl font-bold text-white">
                Checklist Operacional
              </h2>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Sequência mínima de condutas para quem chega primeiro em um possível local de morte.
            </p>
            <div className="space-y-3 text-sm text-slate-100">
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Viu alguém caído: tratou o local como potencial cena de crime.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Não toquei no corpo em nenhuma hipótese.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Isolei o local estabelecendo perímetro seguro.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Chamei a perícia e o DHPP imediatamente.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Preservei tudo até a chegada das equipes especializadas.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Identifiquei e protegi testemunhas-chave para posterior oitiva.</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-950 border border-federal-700/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Gavel size={22} className="text-federal-400" />
                Encerramento
              </h2>
              <p className="text-sm text-slate-200">
                Este curso foi desenhado para que cada policial, em qualquer área, compreenda a
                gravidade de um local de morte e o impacto direto de suas ações sobre a verdade dos fatos.
              </p>
            </div>
            <p className="mt-6 text-base font-semibold text-federal-50">
              “O DPF só consegue trabalhar bem quando ninguém mexe em nada.”
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <p className="text-sm text-slate-300 text-center max-w-2xl">
            Após estudar o conteúdo, você pode testar seus conhecimentos em uma prova oficial deste curso.
            São 20 questões objetivas focadas na doutrina correta de preservação de local de morte.
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
                  Preservação de Local de Morte – DHPP
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

