import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Shield,
  AlertTriangle,
  Gavel,
  ClipboardCheck,
  Ban,
  CheckSquare,
  Siren,
  DollarSign,
  Send,
  User,
  FileText,
  X,
  Newspaper,
  Calendar,
  ChevronRight,
  Target,
  Search,
  Database,
  Cpu
} from 'lucide-react';
import clsx from 'clsx';

const Home = () => {
  const [wantedList, setWantedList] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [loadingWanted, setLoadingWanted] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tipForm, setTipForm] = useState({
    target: '',
    details: '',
    location: '',
    contact: '' // Optional
  });
  const [tipStatus, setTipStatus] = useState('idle'); // idle, submitting, success, error

  const images = [
    '/imagem1.jpg',
    '/imagem2.jpg',
    '/imagem3.jpg'
  ];

  useEffect(() => {
    fetchWanted();
    fetchNews();
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          author:author_id(full_name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error && error.code !== '42P01') throw error;
      setNewsList(data || []);
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
    }
  };

  const fetchWanted = async () => {
    setLoadingWanted(true);
    try {
      const { data, error } = await supabase
        .from('procurados')
        .select('*')
        .eq('status', 'Procurado')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWantedList(data || []);
    } catch (error) {
      console.error('Erro ao buscar procurados:', error);
    } finally {
      setLoadingWanted(false);
    }
  };

  const handleTipSubmit = async (e) => {
    e.preventDefault();
    setTipStatus('submitting');
    
    try {
      const { error } = await supabase
        .from('boletins')
        .insert([{
           comunicante: tipForm.contact || 'Anônimo (Denúncia Site)',
           descricao: `[DENÚNCIA ANÔNIMA] ALVO: ${tipForm.target} | DETALHES: ${tipForm.details}`,
           localizacao: tipForm.location,
           status: 'Pendente',
           data_fato: new Date().toISOString()
        }]);

      if (error) {
         console.error('Error submitting tip to boletins', error);
         throw error;
      }

      setTipStatus('success');
      setTipForm({ target: '', details: '', location: '', contact: '' });
      setTimeout(() => setTipStatus('idle'), 3000);
    } catch (err) {
      console.error('Erro ao enviar denúncia:', err);
      setTipStatus('error');
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
              <span>Polícia Civil Estadual</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
              DENARC
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl">
              DENARC - INVESTIGATIVA DO ESTADO DA EUFORIA.
              Unidade especializada da Polícia Civil, atuando na preservação da ordem pública.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/join"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-federal-600 hover:bg-federal-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-federal-900/40 transition-transform hover:-translate-y-0.5"
              >
                Como Fazer Parte
              </Link>
              {/* Botão Solicitar Porte temporariamente ocultado - para reativar, remova os comentários
              <Link
                to="/porte-de-armas"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm tracking-wide shadow-lg transition-transform hover:-translate-y-0.5 border border-slate-700"
              >
                Solicitar Porte
              </Link>
              */}
              <a
                href="#regra-de-ouro"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-100 font-semibold text-sm tracking-wide transition-colors"
              >
                Ver Regras e Deveres
              </a>
            </div>
          </div>
          <div className="flex-1 w-full max-w-md lg:max-w-lg space-y-6">
            <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-federal-900 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),transparent_60%)]" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-federal-700 flex items-center justify-center">
                      <Shield className="text-federal-300" size={26} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                        Estado da Euforia
                      </p>
                      <p className="text-sm font-medium text-slate-100">
                        DENARC - Polícia Civil Estadual
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>
                    A DENARC é uma unidade especializada da Polícia Civil do Estado da Euforia.
                  </p>
                  <p>
                    Atua exclusivamente na investigação de tráfico de drogas, facções criminosas locais e crimes relacionados.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wide">Sede</span>
                    <span>Euforia Roleplay</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wide">Atuação</span>
                    <span>Toda Euforia Roleplay</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden aspect-video">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Imagem ${index + 1} - Euforia Roleplay`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-federal-400 w-6' : 'bg-slate-500'}`}
                  />
                ))}
              </div>
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-semibold">
                Ambiente de Jogo
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
              O que é a DENARC
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              O DENARC é o Departamento Estadual de Investigação de Narcóticos,
              uma unidade especializada da Polícia Civil do Estado da Euforia,
              responsável por apurar infrações penais relacionadas ao tráfico de drogas
              e crime organizado dentro do território estadual.
            </p>
            <p className="text-slate-300 text-base leading-relaxed">
              Sua missão é atuar com rigor técnico e científico, garantindo a preservação de provas e a elucidação
              de crimes, mantendo a ordem e a segurança pública no Estado da Euforia.
            </p>
          </div>
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-[0.18em] mb-3">
                Atribuições Principais
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Tráfico de Drogas
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Facções Criminosas
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Inteligência Operacional
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Monitoramento
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Apreensões
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-federal-400" />
                  Mandados Judiciais
                </li>
              </ul>
            </div>
            <div className="bg-federal-900/60 border border-federal-700/60 rounded-2xl p-5">
              <p className="text-xs font-semibold text-federal-300 uppercase tracking-[0.2em] mb-2">
                Frase de referência
              </p>
              <p className="text-lg font-semibold text-federal-50">
                “Investigar, elucidar e combater o crime organizado no Estado da Euforia.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-federal-600/20 border border-federal-500/60 flex items-center justify-center">
                <Target className="text-federal-400" size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">Combate ao Tráfico</h3>
            </div>
            <p className="text-sm text-slate-300">
              Investigação e repressão ao tráfico de drogas dentro do território estadual,
              com foco na desarticulação de redes de distribuição.
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-federal-600/20 border border-federal-500/60 flex items-center justify-center">
                <Search className="text-federal-400" size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">Inteligência</h3>
            </div>
            <p className="text-sm text-slate-300">
              Operações de inteligência, monitoramento de suspeitos e infiltração
              em organizações criminosas locais.
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-federal-600/20 border border-federal-500/60 flex items-center justify-center">
                <Database className="text-federal-400" size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">Apoio Operacional</h3>
            </div>
            <p className="text-sm text-slate-300">
              Apoio a outras unidades da Polícia Civil, produção de relatórios investigativos
              e cumprimento de mandados judiciais estaduais.
            </p>
          </div>
        </div>
      </section>

      {/* NEWS MODAL */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedNews(null)}>
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              {selectedNews.image_url ? (
                <img 
                  src={selectedNews.image_url} 
                  alt={selectedNews.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <Shield size={64} className="text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <button 
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
                <span className="flex items-center gap-1.5 text-federal-400">
                  <Calendar size={14} />
                  {new Date(selectedNews.created_at).toLocaleDateString()}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>Por: {selectedNews.author?.full_name || 'Assessoria de Comunicação'}</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
                {selectedNews.title}
              </h2>
              
              <div className="prose prose-invert prose-lg max-w-none text-slate-300 whitespace-pre-wrap">
                {selectedNews.content}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-800 flex justify-end">
                <button 
                  onClick={() => setSelectedNews(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                O que define o Agente DENARC?
              </p>
              <ul className="space-y-1 text-sm font-semibold text-federal-100">
                <li>LEALDADE À CONSTITUIÇÃO E AO ESTADO DA EUFORIA.</li>
                <li>ÉTICA PROFISSIONAL INEGOCIÁVEL.</li>
                <li>DISCIPLINA E HIERARQUIA.</li>
                <li>EFICIÊNCIA NO SERVIÇO PÚBLICO ESTADUAL.</li>
              </ul>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-100">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Legalidade
                </p>
                <p className="text-slate-200">
                  Toda ação policial deve estar estritamente amparada na lei estadual. O Agente DENARC é, antes de tudo, um garantidor de direitos.
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-950 border border-red-600/40 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/60 flex items-center justify-center">
                <AlertTriangle size={22} className="text-red-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-red-200 uppercase tracking-[0.2em]">
                  Regime Disciplinar
                </p>
                <p className="text-sm text-red-100">
                  Infrações que atentam contra o decoro e a eficácia da DENARC.
                </p>
              </div>
            </div>
            <Link 
              to="/rules" 
              className="inline-flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
            >
              <FileText size={16} />
              Ver Todas as Regras
            </Link>
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
          </div>
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
              O que se espera de todo integrante da DENARC no exercício de suas funções.
            </p>
            <div className="space-y-3 text-sm text-slate-100">
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Servir e proteger a sociedade do Estado da Euforia com dedicação e coragem.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Respeitar incondicionalmente os direitos e garantias fundamentais.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckSquare size={18} className="text-emerald-400 mt-0.5" />
                <span>Atuar com imparcialidade, legalidade e isenção dentro do território estadual.</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-950 border border-federal-700/60 rounded-3xl p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Gavel size={24} className="text-federal-400" />
              <h2 className="text-2xl font-bold text-white">
                Jurisdição
              </h2>
            </div>
            <div className="space-y-4 text-sm text-slate-100">
              <div className="border-l-2 border-federal-500 pl-3">
                <p className="font-bold text-federal-200">Competência Estadual</p>
                <p className="text-xs text-slate-300">A DENARC atua exclusivamente dentro do Estado da Euforia, sob jurisdição estadual.</p>
              </div>
              <div className="border-l-2 border-federal-500 pl-3">
                <p className="font-bold text-federal-200">Polícia Civil</p>
                <p className="text-xs text-slate-300">Unidade especializada da Polícia Civil Estadual.</p>
              </div>
              <div className="border-l-2 border-federal-500 pl-3">
                <p className="font-bold text-federal-200">Contato de Emergência</p>
                <p className="text-xs text-slate-300">Em caso de emergência, dirija-se à DP Euforia da Praia.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-fade-in-up py-8 sm:py-12">
          
          <div className="text-center space-y-4">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white flex flex-col sm:flex-row items-center justify-center gap-4">
              <Siren className="text-red-600 animate-pulse hidden sm:block" size={48} />
              <Siren className="text-red-600 animate-pulse sm:hidden" size={32} />
              LISTA DE PROCURADOS
              <Siren className="text-red-600 animate-pulse hidden sm:block" size={48} />
              <Siren className="text-red-600 animate-pulse sm:hidden" size={32} />
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Ajude a DENARC a localizar criminosos perigosos no Estado da Euforia. Sua identidade será mantida em absoluto sigilo.
            </p>
          </div>

          {loadingWanted ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : wantedList.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800">
              <p className="text-slate-400 text-xl">Nenhum procurado listado no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {wantedList.map((person) => (
                <div key={person.id} className="group relative bg-slate-900 border border-slate-800 hover:border-red-600/50 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 shadow-2xl">
                  {/* Reward Badge */}
                  {person.recompensa && (
                    <div className="absolute top-4 right-4 z-10 bg-emerald-600 text-white font-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transform rotate-2 group-hover:scale-110 transition-transform">
                      <DollarSign size={20} />
                      {person.recompensa}
                    </div>
                  )}
                  
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img 
                      src={person.foto_principal} 
                      alt={person.nome}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
                    
                    <div className="absolute bottom-0 left-0 w-full p-6">
                      <h3 className="text-2xl font-black text-white uppercase italic tracking-wider mb-1">
                        {person.nome}
                      </h3>
                      <p className="text-red-500 font-bold uppercase tracking-widest text-xs mb-2">
                        {person.periculosidade} Periculosidade
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Motivo / Crimes</p>
                      <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                        {person.motivo}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setTipForm(prev => ({ ...prev, target: person.nome }));
                        document.getElementById('tip-form')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 text-red-200 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600"
                    >
                      <AlertTriangle size={18} />
                      DENUNCIAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NEWS SECTION */}
          {newsList.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-federal-900/40 border border-federal-700/50 text-federal-300 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Newspaper size={14} />
                    <span>Boletim DENARC</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white">Últimas Notícias e Operações</h2>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsList.map((news) => (
                  <div 
                    key={news.id} 
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group hover:border-federal-500/50 transition-all cursor-pointer"
                    onClick={() => setSelectedNews(news)}
                  >
                    <div className="h-48 overflow-hidden relative">
                      {news.image_url ? (
                        <img 
                          src={news.image_url} 
                          alt={news.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <Shield size={48} className="text-slate-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-federal-400 mb-2">
                        <Calendar size={12} />
                        {new Date(news.created_at).toLocaleDateString()}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-federal-400 transition-colors">
                        {news.title}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                        {news.content}
                      </p>
                      <div className="flex items-center text-federal-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                        Ler mais <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anonymous Tip Section */}
          <div id="tip-form" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-12 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none hidden lg:block">
               <Shield size={300} />
             </div>
             
             <div className="relative z-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
               <div>
                 <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-3">
                   <User size={24} className="text-federal-400 sm:w-8 sm:h-8" />
                   Denúncia Anônima
                 </h3>
                 <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                   Sua colaboração é fundamental. Se você tem informações sobre tráfico de drogas,
                   facções criminosas ou qualquer crime no Estado da Euforia, utilize este canal.
                   <strong className="block mt-2 text-white">Não exigimos identificação. O sigilo é garantido.</strong>
                 </p>
                 
                 <div className="space-y-4">
                   <div className="flex items-center gap-4 text-slate-400">
                     <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                       <Shield size={24} />
                     </div>
                     <p className="text-sm">Informações criptografadas e seguras.</p>
                   </div>
                   <div className="flex items-center gap-4 text-slate-400">
                     <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                       <Ban size={24} />
                     </div>
                     <p className="text-sm">Sem rastreamento de IP ou localização.</p>
                   </div>
                 </div>
               </div>

               <form onSubmit={handleTipSubmit} className="space-y-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Alvo da Denúncia</label>
                   <input 
                     type="text" 
                     value={tipForm.target}
                     onChange={e => setTipForm({...tipForm, target: e.target.value})}
                     className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-federal-500 outline-none transition-colors"
                     placeholder="Nome do procurado ou organização"
                     required
                   />
                 </div>
                 
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Localização Aproximada</label>
                   <input 
                     type="text" 
                     value={tipForm.location}
                     onChange={e => setTipForm({...tipForm, location: e.target.value})}
                     className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-federal-500 outline-none transition-colors"
                     placeholder="Cidade, Bairro, Rua..."
                     required
                   />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Detalhes da Informação</label>
                   <textarea 
                     value={tipForm.details}
                     onChange={e => setTipForm({...tipForm, details: e.target.value})}
                     rows={4}
                     className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-federal-500 outline-none transition-colors resize-none"
                     placeholder="Descreva o que você sabe com o máximo de detalhes..."
                     required
                   />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Contato (Opcional)</label>
                   <input 
                     type="text" 
                     value={tipForm.contact}
                     onChange={e => setTipForm({...tipForm, contact: e.target.value})}
                     className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-federal-500 outline-none transition-colors"
                     placeholder="Caso queira ser contatado para recompensa"
                   />
                 </div>

                 <button 
                   type="submit"
                   disabled={tipStatus === 'submitting'}
                   className={clsx(
                     "w-full py-4 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2",
                     tipStatus === 'success' ? "bg-emerald-600 text-white" : 
                     tipStatus === 'error' ? "bg-red-600 text-white" :
                     "bg-federal-600 hover:bg-federal-500 text-white"
                   )}
                 >
                   {tipStatus === 'submitting' ? (
                     <span className="animate-spin">⌛</span>
                   ) : tipStatus === 'success' ? (
                     <>
                       <CheckSquare size={20} />
                       Denúncia Enviada!
                     </>
                   ) : (
                     <>
                       <Send size={20} />
                       Enviar Denúncia
                     </>
                   )}
                 </button>
               </form>
             </div>
          </div>
        </div>

    </div>
  );
};

export default Home;
