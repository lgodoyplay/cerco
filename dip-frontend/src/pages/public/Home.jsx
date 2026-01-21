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
  X
} from 'lucide-react';
import clsx from 'clsx';

const Home = () => {
  const [wantedList, setWantedList] = useState([]);
  const [loadingWanted, setLoadingWanted] = useState(false);
  const [tipForm, setTipForm] = useState({
    target: '',
    details: '',
    location: '',
    contact: '' // Optional
  });
  const [tipStatus, setTipStatus] = useState('idle'); // idle, submitting, success, error

  useEffect(() => {
    fetchWanted();
  }, []);

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
              <span>Institucional</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
              Polícia Federal
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl">
              Órgão permanente de Estado, organizado e mantido pela União, atuando na preservação da ordem pública e da incolumidade das pessoas e do patrimônio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/join"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-federal-600 hover:bg-federal-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-federal-900/40 transition-transform hover:-translate-y-0.5"
              >
                Como Fazer Parte
              </Link>
              <a
                href="#regra-de-ouro"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-100 font-semibold text-sm tracking-wide transition-colors"
              >
                Ver Regras e Deveres
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
                      <Shield className="text-federal-300" size={26} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                        República Federativa do Brasil
                      </p>
                      <p className="text-sm font-medium text-slate-100">
                        Departamento de Polícia Federal
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>
                    A Polícia Federal exerce, com exclusividade, as funções de polícia judiciária da União.
                  </p>
                  <p>
                    Atua no combate ao crime organizado, tráfico de drogas, corrupção, crimes cibernéticos e ambientais, entre outros crimes de competência federal.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wide">Sede</span>
                    <span>Brasília, DF</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wide">Atuação</span>
                    <span>Território Nacional</span>
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
            </div>
          </div>
          <div className="bg-slate-950 border border-federal-700/60 rounded-3xl p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Gavel size={24} className="text-federal-400" />
              <h2 className="text-2xl font-bold text-white">
                Legislação Essencial
              </h2>
            </div>
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
              Ajude a Polícia Federal a localizar criminosos perigosos. Sua identidade será mantida em absoluto sigilo.
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
                   Sua colaboração é fundamental. Se você tem informações sobre qualquer procurado ou crime federal, 
                   utilize este canal. 
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
