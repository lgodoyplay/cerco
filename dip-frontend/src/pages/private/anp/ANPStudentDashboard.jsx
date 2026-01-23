import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { 
  Book, 
  CheckCircle, 
  Circle, 
  Tablet, 
  GraduationCap, 
  AlertCircle, 
  Shield, 
  FileText,
  Map,
  Radio,
  Scale,
  PlayCircle,
  AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';

const ANPStudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('progress'); // progress, tablet, rules, exam
  const [stages, setStages] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [extraCourses, setExtraCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStagesAndProgress();
  }, [user]);

  const fetchStagesAndProgress = async () => {
    try {
      setLoading(true);
      // Fetch Stages
      const { data: stagesData, error: stagesError } = await supabase
        .from('anp_stages')
        .select('*')
        .order('order');

      if (stagesError) throw stagesError;

      setStages(stagesData || []);

      // Fetch User Progress
      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_anp_progress')
          .select('stage_id, status')
          .eq('user_id', user.id);

        if (progressError) throw progressError;

        const progressMap = {};
        progressData.forEach(p => {
          progressMap[p.stage_id] = p.status;
        });
        setUserProgress(progressMap);

        // Fetch Extra Courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('cursos_policiais')
          .select(`
            id,
            certificado_url,
            cursos (
              id,
              nome,
              descricao
            )
          `)
          .eq('policial_id', user.id);
          
        if (!coursesError) {
          setExtraCourses(coursesData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching ANP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (stages.length === 0) return 0;
    const completedCount = stages.filter(s => userProgress[s.id] === 'completed').length;
    return Math.round((completedCount / stages.length) * 100);
  };

  const checkReadyForExam = () => {
    if (stages.length === 0) return false;
    // Filter out the exam stage itself if it exists (assuming it's named 'Prova Final')
    const learningStages = stages.filter(s => s.title !== 'Prova Final');
    if (learningStages.length === 0) return false;
    
    // Check if all learning stages are completed
    return learningStages.every(s => userProgress[s.id] === 'completed');
  };

  const isReadyForExam = checkReadyForExam();

  const renderProgressTab = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <GraduationCap className="text-federal-500" />
          Progresso da Formação
        </h3>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Conclusão Geral</span>
            <span>{calculateProgress()}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5">
            <div 
              className="bg-federal-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-4">
          {stages.map((stage) => {
            const isCompleted = userProgress[stage.id] === 'completed';
            // Highlight 'Prova Final' differently if ready
            const isExamStage = stage.title === 'Prova Final';
            
            return (
              <div 
                key={stage.id} 
                className={clsx(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all",
                  isCompleted 
                    ? "bg-federal-900/20 border-federal-500/30" 
                    : isExamStage && isReadyForExam
                      ? "bg-federal-900/10 border-federal-500/50 animate-pulse"
                      : "bg-slate-800/30 border-slate-700"
                )}
              >
                <div className={clsx(
                  "mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                  isCompleted ? "bg-federal-500 text-white" : "bg-slate-700 text-slate-400"
                )}>
                  {isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
                </div>
                <div>
                  <h4 className={clsx("font-semibold", isCompleted ? "text-white" : "text-slate-300")}>
                    {stage.title}
                  </h4>
                  <p className="text-sm text-slate-400 mt-1">{stage.description}</p>
                  {isCompleted && (
                    <span className="inline-block mt-2 text-xs font-medium text-federal-400 bg-federal-900/50 px-2 py-1 rounded">
                      Concluído
                    </span>
                  )}
                  {isExamStage && isReadyForExam && !isCompleted && (
                    <button 
                      onClick={() => setActiveTab('exam')}
                      className="mt-2 text-xs font-bold text-federal-400 hover:text-federal-300 underline"
                    >
                      CLIQUE AQUI PARA INICIAR A PROVA
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extra Courses Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Book className="text-federal-500" />
          Cursos e Especializações Extras
        </h3>
        
        {extraCourses.length === 0 ? (
          <div className="text-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-lg">
            <p>Nenhum curso extra atribuído.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {extraCourses.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-federal-900/20 flex items-center justify-center border border-federal-500/20 text-federal-400">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{item.cursos?.nome}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.cursos?.descricao || 'Curso Oficial'}</p>
                  </div>
                </div>

                {item.certificado_url && (
                  <a 
                    href={item.certificado_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-federal-400 transition-colors bg-slate-900 rounded-lg border border-slate-800 hover:border-federal-500/30"
                    title="Ver Certificado"
                  >
                    <FileText size={18} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTabletTab = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Tablet className="text-federal-500" />
          Manual do Tablet Policial
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <FileText size={20} />
              </div>
              <h4 className="font-semibold text-white">Boletim de Ocorrência (BO)</h4>
            </div>
            <p className="text-sm text-slate-400">
              Utilize para registrar crimes, ocorrências de trânsito e denúncias. 
              Sempre preencha com detalhes precisos sobre o local e envolvidos.
            </p>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                <Shield size={20} />
              </div>
              <h4 className="font-semibold text-white">Prisões</h4>
            </div>
            <p className="text-sm text-slate-400">
              Registre todas as prisões efetuadas. É obrigatório informar os crimes (artigos) 
              e anexar provas (fotos/vídeos) quando disponível.
            </p>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                <Map size={20} />
              </div>
              <h4 className="font-semibold text-white">Consultas</h4>
            </div>
            <p className="text-sm text-slate-400">
              Verifique antecedentes criminais, mandados de prisão em aberto e 
              histórico de veículos antes de qualquer abordagem de risco.
            </p>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                <Radio size={20} />
              </div>
              <h4 className="font-semibold text-white">Comunicação</h4>
            </div>
            <p className="text-sm text-slate-400">
              Mantenha o rádio na frequência correta (QAP). Reporte início de patrulha, 
              abordagens (QTH) e solicitações de apoio (QRU/QRR).
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRulesTab = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Book className="text-federal-500" />
          Regras Fundamentais da Corporação
        </h3>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <span className="font-mono text-federal-500 font-bold">01</span>
            <p className="text-slate-300">Respeito à hierarquia é absoluto. Acate ordens de superiores sem questionar em público.</p>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-federal-500 font-bold">02</span>
            <p className="text-slate-300">O uso da força deve ser progressivo. Arma de fogo é o último recurso.</p>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-federal-500 font-bold">03</span>
            <p className="text-slate-300">Corrupção passiva ou ativa resultará em exoneração imediata e prisão (Character Kill em casos graves).</p>
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-federal-500 font-bold">04</span>
            <p className="text-slate-300">Mantenha a postura profissional. Evite gírias e brincadeiras no rádio.</p>
          </div>
          <div className="mt-6 p-4 bg-federal-900/20 rounded-lg border border-federal-500/20">
            <p className="text-sm text-federal-300 text-center">
              Consulte o Regulamento Interno completo na aba "Regras" do menu público.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Scale className="text-federal-500" />
          Legislação Brasileira Essencial
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
            <h4 className="font-bold text-federal-400 mb-3 border-b border-slate-700 pb-2">Constituição Federal (CF/88)</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <strong className="text-white block mb-1">Art. 5º (Direitos Individuais):</strong> 
                Todos são iguais perante a lei. Ninguém será preso senão em flagrante delito ou por ordem escrita e fundamentada.
              </li>
              <li>
                <strong className="text-white block mb-1">Art. 144 (Segurança Pública):</strong> 
                A segurança pública, dever do Estado, direito e responsabilidade de todos, é exercida para a preservação da ordem pública.
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
            <h4 className="font-bold text-federal-400 mb-3 border-b border-slate-700 pb-2">Código Penal (CP)</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li><strong className="text-white">Art. 121:</strong> Homicídio (Matar alguém).</li>
              <li><strong className="text-white">Art. 155/157:</strong> Furto (sem violência) e Roubo (com violência/ameaça).</li>
              <li><strong className="text-white">Art. 329:</strong> Resistência (Opor-se à execução de ato legal).</li>
              <li><strong className="text-white">Art. 331:</strong> Desacato (Desacatar funcionário público no exercício da função).</li>
            </ul>
          </div>

          <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
            <h4 className="font-bold text-federal-400 mb-3 border-b border-slate-700 pb-2">Código de Processo Penal (CPP)</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <strong className="text-white block mb-1">Art. 302 (Flagrante Delito):</strong> 
                Considera-se em flagrante quem: está cometendo a infração; acaba de cometê-la; ou é perseguido logo após.
              </li>
            </ul>
          </div>

           <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
            <h4 className="font-bold text-federal-400 mb-3 border-b border-slate-700 pb-2">Leis Especiais</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li><strong className="text-white">Lei 11.343 (Drogas):</strong> Art. 33 (Tráfico) vs Art. 28 (Porte para consumo).</li>
              <li><strong className="text-white">Lei 13.869 (Abuso de Autoridade):</strong> Veda o uso excessivo e injustificado de algemas (Súmula Vinc. 11) e constrangimentos ilegais.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExamTab = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <GraduationCap className="text-federal-500" />
          Prova Final - Curso de Formação
        </h3>

        <div className="bg-federal-900/20 border border-federal-500/30 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-federal-400 shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-federal-400 mb-1">Atenção, Recruta!</h4>
              <p className="text-sm text-federal-200">
                Você completou todos os módulos preparatórios. A Prova Final definirá sua aptidão para ingressar na corporação.
                Revise os pontos abaixo antes de iniciar.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/30 p-5 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-federal-500" />
              Dicas: Procedimentos e Ética
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-federal-500 mt-1 shrink-0" />
                <span><strong>Hierarquia e Disciplina:</strong> Pilares fundamentais. Respeito irrestrito a superiores.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-federal-500 mt-1 shrink-0" />
                <span><strong>Uso da Força:</strong> Sempre progressivo. Verbalização &gt; Controle Físico &gt; Arma não letal &gt; Letal.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-federal-500 mt-1 shrink-0" />
                <span><strong>Abordagem:</strong> Segurança em primeiro lugar. Jamais aborde sem vantagem tática.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/30 p-5 rounded-lg border border-slate-700">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <Scale size={18} className="text-federal-500" />
              Dicas: Legislação Penal
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-federal-500 mt-1 shrink-0" />
                <span><strong>Art. 121 (Homicídio):</strong> Matar alguém. Pena varia se for qualificado.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-federal-500 mt-1 shrink-0" />
                <span><strong>Art. 157 (Roubo):</strong> Subtrair coisa alheia móvel mediante grave ameaça ou violência.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={14} className="text-federal-500 mt-1 shrink-0" />
                <span><strong>Art. 331 (Desacato):</strong> Desacatar funcionário público no exercício da função.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => alert('Sistema de Prova Final em desenvolvimento. Solicite a aplicação ao seu instrutor!')}
            className="group relative px-8 py-4 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-federal-500/25 flex items-center gap-3 text-lg"
          >
            <PlayCircle size={24} className="group-hover:scale-110 transition-transform" />
            INICIAR PROVA FINAL
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Área do Aluno ANP</h1>
          <p className="text-slate-400">Academia Nacional de Polícia - Acompanhe seu treinamento.</p>
        </div>
        
        {calculateProgress() === 100 && (
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-2">
            <CheckCircle size={20} />
            <span className="font-bold">Curso Concluído! Aguarde promoção.</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('progress')}
          className={clsx(
            "px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
            activeTab === 'progress' 
              ? "border-federal-500 text-federal-400" 
              : "border-transparent text-slate-400 hover:text-white"
          )}
        >
          Meu Progresso
        </button>
        
        {isReadyForExam && (
          <button
            onClick={() => setActiveTab('exam')}
            className={clsx(
              "px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2",
              activeTab === 'exam' 
                ? "border-federal-500 text-federal-400" 
                : "border-transparent text-federal-400 hover:text-federal-300"
            )}
          >
            <GraduationCap size={16} />
            Prova Final
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-federal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-federal-500"></span>
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('tablet')}
          className={clsx(
            "px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
            activeTab === 'tablet' 
              ? "border-federal-500 text-federal-400" 
              : "border-transparent text-slate-400 hover:text-white"
          )}
        >
          Uso do Tablet
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={clsx(
            "px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
            activeTab === 'rules' 
              ? "border-federal-500 text-federal-400" 
              : "border-transparent text-slate-400 hover:text-white"
          )}
        >
          Regras
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-800 border-t-federal-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {activeTab === 'progress' && renderProgressTab()}
            {activeTab === 'exam' && renderExamTab()}
            {activeTab === 'tablet' && renderTabletTab()}
            {activeTab === 'rules' && renderRulesTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default ANPStudentDashboard;