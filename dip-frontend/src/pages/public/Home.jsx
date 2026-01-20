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
    title: 'Módulo 1 — Competência da Polícia Federal em Locais de Crime',
    description: 'Quando o DPF assume a investigação de uma morte ou crime grave.',
    content: [
      'O Artigo 144 da Constituição e as atribuições exclusivas da Polícia Federal.',
      'Morte em bens, serviços ou interesses da União (empresas públicas, autarquias).',
      'Crimes com repercussão interestadual ou internacional que exigem repressão uniforme.',
      'Investigação de homicídios em terras indígenas e crimes contra direitos humanos (quando federalizados).'
    ]
  },
  {
    id: 2,
    title: 'Módulo 2 — O Agente Federal como Primeiro Interventor',
    description: 'Postura do APF ao se deparar com um local de crime sob jurisdição federal.',
    content: [
      'Segurança da equipe e avaliação de riscos em áreas de fronteira, portos ou aeroportos.',
      'A decisão imediata de acionar a Perícia Federal e isolar o perímetro.',
      'Diferença de protocolo entre operações de inteligência e ostensivas.',
      'Gerenciamento de crise inicial até a chegada do Delegado de Polícia Federal.'
    ]
  },
  {
    id: 3,
    title: 'Módulo 3 — Preservação em Cenários Federais Específicos',
    description: 'Desafios únicos em aeroportos, portos, fronteiras e terras da União.',
    content: [
      'Morte a bordo de aeronaves ou embarcações: jurisdição e preservação do espaço confinado.',
      'Corpos encontrados em áreas de fronteira seca: cooperação internacional e isolamento.',
      'Crimes ambientais com resultado morte em unidades de conservação federal.',
      'Procedimentos em sedes de órgãos federais (INSS, Caixa, Correios).'
    ]
  },
  {
    id: 4,
    title: 'Módulo 4 — Cadeia de Custódia na Justiça Federal',
    description: 'O rigor técnico exigido nos processos criminais federais.',
    content: [
      'Rastreabilidade total do vestígio: do local do crime ao depósito central.',
      'O papel do APF na documentação inicial para evitar nulidades em grandes operações.',
      'Manuseio de evidências sensíveis (drogas, armas de grosso calibre, valores).',
      'O uso de lacres e formulários padronizados do DPF.'
    ]
  },
  {
    id: 5,
    title: 'Módulo 5 — A Perícia Criminal Federal',
    description: 'A atuação dos Peritos Criminais Federais (PCFs) e sua relação com a equipe.',
    content: [
      'A autonomia técnica do Perito Criminal Federal no local.',
      'Tecnologias de ponta usadas pela PF: scanner 3D, laboratórios móveis.',
      'Por que o Agente não deve tocar no corpo ou nos vestígios antes do PCF.',
      'Suporte armado e logístico à equipe de perícia em áreas hostis.'
    ]
  },
  {
    id: 6,
    title: 'Módulo 6 — Crimes Violentos e Organizações Criminosas',
    description: 'Cenas de crime envolvendo facções e tráfico internacional.',
    content: [
      'Características de execuções ligadas ao crime organizado transnacional.',
      'Identificação preliminar de cápsulas de armamento restrito e explosivos.',
      'Cuidados com armadilhas (booby traps) em laboratórios de drogas ou depósitos.',
      'A importância de não contaminar a inteligência policial com ações precipitadas.'
    ]
  },
  {
    id: 7,
    title: 'Módulo 7 — Integração com Outras Forças',
    description: 'Relacionamento com PM, Polícia Civil e Forças Armadas.',
    content: [
      'Assunção da ocorrência: quando a PF chega e assume a jurisdição.',
      'Tratamento diplomático e técnico com as forças estaduais no local.',
      'Operações de GLO (Garantia da Lei e da Ordem) e atuação conjunta.',
      'Compartilhamento de informações versus sigilo da investigação federal.'
    ]
  },
  {
    id: 8,
    title: 'Módulo 8 — O Inquérito Policial Federal',
    description: 'Como o trabalho de local alimenta grandes investigações.',
    content: [
      'O Relatório de Local de Crime como peça-chave do IPL.',
      'Conexão entre a materialidade do local e a lavagem de dinheiro/organização criminosa.',
      'Depoimentos iniciais de testemunhas federais ou servidores públicos.',
      'A visão sistêmica: o local do corpo é apenas uma peça do quebra-cabeça.'
    ]
  },
  {
    id: 9,
    title: 'Módulo 9 — Protocolos de Segurança Orgânica',
    description: 'Proteção da imagem e dos dados da instituição.',
    content: [
      'Proibição absoluta de vazamento de imagens para imprensa ou redes sociais.',
      'Controle de curiosos e imprensa em casos de grande repercussão nacional.',
      'Uso de balaclava e preservação da identidade dos agentes operacionais.',
      'Segurança da informação sensível encontrada no local (documentos, HDs).'
    ]
  },
  {
    id: 10,
    title: 'Módulo 10 — Estudo de Casos Federais',
    description: 'Lições aprendidas em grandes casos da Polícia Federal.',
    content: [
      'Análise de erros e acertos em casos históricos (ex: Caso Riocentro, Queda de Aeronaves).',
      'A evolução da doutrina de local de crime na PF nas últimas décadas.',
      'O padrão ouro de investigação da Polícia Federal reconhecido internacionalmente.',
      'A responsabilidade de manter esse legado.'
    ]
  },
  {
    id: 11,
    title: 'Módulo 11 — O Padrão de Excelência DPF',
    description: 'Mensagem final para o futuro Agente de Polícia Federal.',
    content: [
      'Ser Policial Federal é ser técnico, legalista e eficiente.',
      'A preservação do local é o primeiro ato de defesa da sociedade e da União.',
      'Compromisso com a verdade real e a justiça.',
      'Bem-vindo à elite da investigação criminal brasileira.'
    ]
  }
];

const examQuestions = [
  {
    id: 1,
    question: 'Qual é a competência constitucional primária da Polícia Federal em locais de morte?',
    options: [
      { id: 'a', text: 'Investigar todos os homicídios ocorridos no território nacional' },
      { id: 'b', text: 'Apurar crimes contra bens, serviços e interesses da União, ou com repercussão interestadual/internacional' },
      { id: 'c', text: 'Auxiliar a Polícia Militar no patrulhamento ostensivo de bairros' }
    ],
    correct: 'b'
  },
  {
    id: 2,
    question: 'Um corpo é encontrado dentro de uma aeronave comercial em voo internacional que pousou em Guarulhos. De quem é a competência?',
    options: [
      { id: 'a', text: 'Polícia Civil de São Paulo' },
      { id: 'b', text: 'Polícia Federal' },
      { id: 'c', text: 'Polícia Militar' }
    ],
    correct: 'b'
  },
  {
    id: 3,
    question: 'Ao chegar em um local de crime em Terra Indígena, qual deve ser a postura do Agente Federal?',
    options: [
      { id: 'a', text: 'Ignorar a liderança indígena e entrar na aldeia à força' },
      { id: 'b', text: 'Isolar o local, respeitar a cultura local, mas garantir a preservação técnica para a Perícia Federal' },
      { id: 'c', text: 'Deixar a investigação para a FUNAI' }
    ],
    correct: 'b'
  },
  {
    id: 4,
    question: 'Por que a Cadeia de Custódia é tratada com extremo rigor na Justiça Federal?',
    options: [
      { id: 'a', text: 'Apenas por burocracia administrativa' },
      { id: 'b', text: 'Para evitar nulidades processuais em investigações complexas contra o crime organizado' },
      { id: 'c', text: 'Porque os juízes federais não confiam nos agentes' }
    ],
    correct: 'b'
  },
  {
    id: 5,
    question: 'Qual a função do Perito Criminal Federal (PCF) no local?',
    options: [
      { id: 'a', text: 'Comandar a operação tática de prisão' },
      { id: 'b', text: 'Realizar a análise técnico-científica, materializando a prova pericial com autonomia' },
      { id: 'c', text: 'Apenas recolher o corpo para o IML' }
    ],
    correct: 'b'
  },
  {
    id: 6,
    question: 'Em uma operação contra o tráfico internacional, um suspeito é morto em confronto. O que o APF deve fazer?',
    options: [
      { id: 'a', text: 'Alterar a cena para favorecer a equipe policial' },
      { id: 'b', text: 'Preservar o local, as armas e cápsulas para a perícia, garantindo a lisura da ação policial' },
      { id: 'c', text: 'Remover o corpo imediatamente para o hospital, mesmo se já houver sinais evidentes de morte' }
    ],
    correct: 'b'
  },
  {
    id: 7,
    question: 'O que caracteriza um crime de repercussão interestadual que atrai a competência da PF?',
    options: [
      { id: 'a', text: 'Um crime passional entre vizinhos' },
      { id: 'b', text: 'Ação de grupos criminosos atuando em múltiplos estados com necessidade de repressão uniforme' },
      { id: 'c', text: 'Furto de celular em transporte público' }
    ],
    correct: 'b'
  },
  {
    id: 8,
    question: 'Como deve ser o relacionamento com as forças estaduais (PM/PC) em um local de competência federal?',
    options: [
      { id: 'a', text: 'De subordinação da PF às polícias estaduais' },
      { id: 'b', text: 'De cooperação, mas com a PF assumindo a liderança da investigação e da perícia' },
      { id: 'c', text: 'Hostil e sem troca de informações' }
    ],
    correct: 'b'
  },
  {
    id: 9,
    question: 'Qual o procedimento correto ao encontrar grandes somas de dinheiro em espécie no local?',
    options: [
      { id: 'a', text: 'Contar e guardar no bolso sem testemunhas' },
      { id: 'b', text: 'Preservar no local exato para fotografia pericial, contabilizar com testemunhas e lacrar conforme protocolo' },
      { id: 'c', text: 'Distribuir entre a equipe como gratificação' }
    ],
    correct: 'b'
  },
  {
    id: 10,
    question: 'Em crimes cibernéticos ou financeiros, o "local de crime" pode ser:',
    options: [
      { id: 'a', text: 'Apenas onde há um corpo físico' },
      { id: 'b', text: 'Computadores, servidores e mídias digitais, que também devem ser preservados (não ligados/desligados indevidamente)' },
      { id: 'c', text: 'Apenas agências bancárias físicas' }
    ],
    correct: 'b'
  },
  {
    id: 11,
    question: 'Por que o sigilo é vital em investigações da Polícia Federal?',
    options: [
      { id: 'a', text: 'Para que a imprensa possa ter exclusividade depois' },
      { id: 'b', text: 'Para não alertar organizações criminosas complexas e não comprometer operações futuras' },
      { id: 'c', text: 'Porque a PF não gosta de publicidade' }
    ],
    correct: 'b'
  },
  {
    id: 12,
    question: 'O que é a "Garantia da Lei e da Ordem" (GLO) e como afeta a competência?',
    options: [
      { id: 'a', text: 'Operação exclusiva da Guarda Municipal' },
      { id: 'b', text: 'Operação onde Forças Armadas atuam com poder de polícia, exigindo integração fina com a PF judiciária' },
      { id: 'c', text: 'Situação onde não existe mais lei' }
    ],
    correct: 'b'
  },
  {
    id: 13,
    question: 'Qual a importância do Relatório de Local de Crime para o Delegado de Polícia Federal?',
    options: [
      { id: 'a', text: 'Nenhuma, o Delegado não vai ao local' },
      { id: 'b', text: 'É a base para a instauração do Inquérito e para as primeiras diligências cautelares' },
      { id: 'c', text: 'Serve apenas para estatística' }
    ],
    correct: 'b'
  },
  {
    id: 14,
    question: 'Ao encontrar um laboratório de refino de drogas com produtos químicos, o APF deve:',
    options: [
      { id: 'a', text: 'Manusear os produtos para identificar o cheiro' },
      { id: 'b', text: 'Isolar a área imediatamente, ventilar se possível e aguardar peritos especializados em química forense' },
      { id: 'c', text: 'Destruir tudo imediatamente' }
    ],
    correct: 'b'
  },
  {
    id: 15,
    question: 'Em caso de morte de autoridade estrangeira em visita oficial ao Brasil, a competência é:',
    options: [
      { id: 'a', text: 'Da Guarda Municipal' },
      { id: 'b', text: 'Federal, devido à repercussão internacional e diplomática' },
      { id: 'c', text: 'Estadual comum' }
    ],
    correct: 'b'
  },
  {
    id: 16,
    question: 'O uso de balaclava e preservação da identidade do Agente Federal em operações serve para:',
    options: [
      { id: 'a', text: 'Parecer mais "tático" nas fotos' },
      { id: 'b', text: 'Proteger o servidor e sua família de represálias de organizações criminosas' },
      { id: 'c', text: 'Esconder o rosto porque está feio' }
    ],
    correct: 'b'
  },
  {
    id: 17,
    question: 'Sobre a coleta de vestígios biológicos (sangue, DNA) em local federal:',
    options: [
      { id: 'a', text: 'Qualquer agente pode coletar com um pano' },
      { id: 'b', text: 'Deve ser feita pelo PCF com técnica estéril para alimentar o Banco Nacional de Perfis Genéticos' },
      { id: 'c', text: 'Não é relevante para a PF' }
    ],
    correct: 'b'
  },
  {
    id: 18,
    question: 'Se um servidor público federal é encontrado morto em seu local de trabalho (repartição federal):',
    options: [
      { id: 'a', text: 'Chama-se a Polícia Civil, pois é homicídio comum' },
      { id: 'b', text: 'Aciona-se a Polícia Federal, pois ocorreu em bem da União e pode ter relação com a função' },
      { id: 'c', text: 'O chefe da repartição investiga' }
    ],
    correct: 'b'
  },
  {
    id: 19,
    question: 'Qual o valor da prova testemunhal colhida no calor dos fatos pelo APF?',
    options: [
      { id: 'a', text: 'Baixo, o que vale é o juiz' },
      { id: 'b', text: 'Alto, pois registra a versão espontânea antes de coações ou esquecimentos (res gestae)' },
      { id: 'c', text: 'Nenhum, agente não ouve testemunha' }
    ],
    correct: 'b'
  },
  {
    id: 20,
    question: 'O "Padrão DPF" de investigação significa:',
    options: [
      { id: 'a', text: 'Fazer o básico e ir embora' },
      { id: 'b', text: 'Atuar com excelência técnica, legalidade estrita e uso intensivo de inteligência e perícia científica' },
      { id: 'c', text: 'Usar sempre o armamento mais pesado' }
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
        'Prova DPF - Preservação de Local de Crime Federal',
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
                    Visual sério, policial e investigativo, com ênfase em crimes federais, operações interestaduais e
                    integração entre Agentes, Escrivães, Delegados e Peritos Criminais Federais.
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
                  Preservação de Local de Morte – DPF
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

