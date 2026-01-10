import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Siren, FileText, ChevronRight, AlertTriangle, Search, Filter, Eye, X, Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

const StatCard = ({ icon: Icon, value, label, color = "blue" }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-4 hover:border-federal-600/50 transition-colors group">
    <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500 group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
    </div>
  </div>
);

const UserPlaceholder = () => (
  <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-slate-600">
    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mb-2">
      <User size={24} />
    </div>
    <span className="text-[10px] font-bold uppercase">Sem Foto</span>
  </div>
);

const Home = () => {
  const [wantedList, setWantedList] = useState([]);
  const [arrestList, setArrestList] = useState([]);
  
  // Search & Filters
  const [wantedSearch, setWantedSearch] = useState('');
  const [wantedFilter, setWantedFilter] = useState('all'); // all, Alta, Média, Baixa
  
  // Modals
  const [selectedWanted, setSelectedWanted] = useState(null);
  const [selectedArrest, setSelectedArrest] = useState(null);

  // Candidate Form
  const [candidateForm, setCandidateForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: ''
  });
  const [formStatus, setFormStatus] = useState('idle'); // idle, submitting, success, error

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    try {
      const { error } = await supabase
        .from('candidatos')
        .insert([{
          nome: candidateForm.nome,
          email: candidateForm.email,
          telefone: candidateForm.telefone,
          mensagem: candidateForm.mensagem
        }]);

      if (error) throw error;

      setFormStatus('success');
      setCandidateForm({ nome: '', email: '', telefone: '', mensagem: '' });
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (error) {
      console.error('Erro ao enviar candidatura:', error);
      setFormStatus('error');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          { data: wantedData },
          { data: arrestData }
        ] = await Promise.all([
          supabase.from('procurados').select('*').order('created_at', { ascending: false }).limit(6),
          supabase.from('prisoes').select('*').order('created_at', { ascending: false }).limit(6)
        ]);

        setWantedList((wantedData || []).map(item => ({
          ...item,
          image: item.foto_principal,
          dangerLevel: item.periculosidade,
          crime: item.motivo
        })));

        setArrestList((arrestData || []).map(item => ({
          ...item,
          name: item.nome,
          image: item.foto_principal,
          reason: item.observacoes // using observacoes as reason since we don't have 'motivo' in arrests table, or 'artigo'
        })));
      } catch (error) {
        console.error('Erro ao carregar dados públicos:', error);
      }
    };

    fetchData();
  }, []);

  // Filter Wanted List
  const filteredWanted = wantedList.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(wantedSearch.toLowerCase()) || 
                          (person.crime || '').toLowerCase().includes(wantedSearch.toLowerCase());
    const matchesFilter = wantedFilter === 'all' || (person.dangerLevel || person.status) === wantedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-federal-900/20 z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950 z-0" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-federal-900/50 border border-federal-700/50 text-federal-300 text-xs font-medium uppercase tracking-wider mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Sistema Operacional Ativo
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Cerco <br/>
            <span className="text-federal-500">Polícia Civil</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Unidade de elite da Polícia Civil dedicada ao combate ao crime organizado, 
            corrupção e crimes de alta complexidade.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/join"
              className="px-8 py-4 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all hover:-translate-y-1 shadow-lg shadow-federal-900/20 flex items-center gap-2"
            >
              Quero Fazer Parte
              <ChevronRight size={18} />
            </Link>
            <Link 
              to="/rules"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all hover:-translate-y-1 flex items-center gap-2"
            >
              Ler Regulamento
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Users} value={arrestList.length || "1,240"} label="Presos Detidos" color="blue" />
          <StatCard icon={Siren} value={wantedList.length || "42"} label="Procurados" color="red" />
          <StatCard icon={FileText} value="156" label="Casos Encerrados" color="emerald" />
          <StatCard icon={Shield} value="89" label="Agentes Ativos" color="amber" />
        </div>
      </section>

      {/* 🚨 SEÇÃO: PROCURADOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Siren className="text-red-500" size={32} />
              Lista de Procurados
            </h2>
            <p className="text-slate-400 mt-2">Indivíduos com mandado de prisão ativo. Cuidado: Podem estar armados.</p>
          </div>
          
          {/* Search & Filters */}
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Buscar procurado..." 
                value={wantedSearch}
                onChange={(e) => setWantedSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors w-48 lg:w-64"
              />
            </div>
            <select 
              value={wantedFilter}
              onChange={(e) => setWantedFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
            >
              <option value="all">Todos os Níveis</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
              <option value="Extrema">Extrema</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredWanted.map((person) => (
            <div key={person.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-red-500/50 transition-all group flex flex-col shadow-lg">
              <div className="h-64 relative bg-slate-950">
                {person.images?.proof1 || person.image ? (
                  <img src={person.images?.proof1 || person.image} alt={person.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <UserPlaceholder />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider animate-pulse shadow-lg">
                  Procurado
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">{person.name}</h3>
                <div className="mt-3 space-y-2 mb-4 flex-1">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Crimes</span>
                    <p className="text-xs text-slate-300 line-clamp-2">{person.crime || person.reason}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-bold">Periculosidade</span>
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ['Alta', 'Extrema'].includes(person.dangerLevel || person.status)
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {person.dangerLevel || person.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedWanted(person)}
                  className="w-full py-2 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-300 rounded-lg text-sm font-medium transition-all border border-transparent hover:border-red-500/50 flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
          {filteredWanted.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800/50">
              Nenhum procurado encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </section>

      {/* 📢 BANNER DE DENÚNCIA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-federal-900 to-slate-900 border-l-4 border-red-500 rounded-r-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-full text-red-500 shrink-0">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Você tem informações?</h3>
              <p className="text-slate-300">Se você viu algum desses indivíduos ou tem informações sobre seu paradeiro, denuncie anonimamente.</p>
            </div>
          </div>
          <button className="relative z-10 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 whitespace-nowrap">
            Denunciar Agora
          </button>
        </div>
      </section>

      {/* ⛓️ SEÇÃO: PRESOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="text-federal-500" size={32} />
            Últimas Prisões
          </h2>
          <p className="text-slate-400 mt-2">Registro público de detenções realizadas pela corporação.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Detento</th>
                  <th className="p-4 font-bold hidden md:table-cell">Motivo</th>
                  <th className="p-4 font-bold">Data da Prisão</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {arrestList.map((arrest) => (
                  <tr key={arrest.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                          {arrest.images?.face ? (
                            <img src={arrest.images.face} alt={arrest.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={18} className="text-slate-500" />
                          )}
                        </div>
                        <span className="font-bold text-white">{arrest.name}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm text-slate-300">{arrest.reason}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Calendar size={14} className="text-slate-500" />
                        {format(new Date(arrest.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Preso
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedArrest(arrest)}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {arrestList.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      Nenhum registro de prisão encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 📝 FORMULÁRIO FAÇA PARTE */}
      <section id="join-form" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 bg-federal-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-4">Junte-se ao DIP</h2>
              <p className="text-slate-400">
                Preencha o formulário abaixo para demonstrar seu interesse em fazer parte da 
                nossa equipe de elite. Entraremos em contato.
              </p>
            </div>

            <form onSubmit={handleCandidateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={candidateForm.nome}
                    onChange={(e) => setCandidateForm({...candidateForm, nome: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors"
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Email</label>
                  <input 
                    type="email" 
                    required
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({...candidateForm, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Telefone / WhatsApp</label>
                <input 
                  type="tel" 
                  required
                  value={candidateForm.telefone}
                  onChange={(e) => setCandidateForm({...candidateForm, telefone: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Por que você quer fazer parte?</label>
                <textarea 
                  required
                  value={candidateForm.mensagem}
                  onChange={(e) => setCandidateForm({...candidateForm, mensagem: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-federal-500 transition-colors h-32 resize-none"
                  placeholder="Conte-nos sobre sua motivação e experiência..."
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={formStatus === 'submitting' || formStatus === 'success'}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 ${
                    formStatus === 'success' 
                      ? 'bg-green-600 hover:bg-green-500 cursor-default'
                      : formStatus === 'error'
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-federal-600 hover:bg-federal-500 shadow-lg shadow-federal-900/20'
                  }`}
                >
                  {formStatus === 'submitting' ? (
                    <span className="animate-pulse">Enviando...</span>
                  ) : formStatus === 'success' ? (
                    <>Candidatura Enviada! <Shield size={20} /></>
                  ) : formStatus === 'error' ? (
                    <>Erro ao Enviar. Tente Novamente.</>
                  ) : (
                    <>Enviar Candidatura <ChevronRight size={20} /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* MODAL: PROCURADO */}
      {selectedWanted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedWanted(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative h-32 bg-slate-950 flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-red-900/20" />
               <div className="relative z-10 flex flex-col items-center">
                 <div className="w-24 h-24 rounded-full border-4 border-slate-900 shadow-xl overflow-hidden bg-slate-800 -mb-12">
                    {selectedWanted.images?.proof1 || selectedWanted.image ? (
                      <img src={selectedWanted.images?.proof1 || selectedWanted.image} alt={selectedWanted.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserPlaceholder />
                    )}
                 </div>
               </div>
               <button onClick={() => setSelectedWanted(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900/50 p-1 rounded-full backdrop-blur-sm transition-colors">
                 <X size={20} />
               </button>
            </div>
            
            <div className="pt-14 pb-8 px-8 text-center">
              <div className="inline-block bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2">
                Procurado
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{selectedWanted.name}</h3>
              <p className="text-red-400 font-mono text-sm mb-6">Nível de Periculosidade: {selectedWanted.dangerLevel || selectedWanted.status}</p>
              
              <div className="grid grid-cols-2 gap-4 text-left bg-slate-950 p-6 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Motivo / Crimes</span>
                  <p className="text-sm text-slate-200">{selectedWanted.crime || selectedWanted.reason}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Recompensa</span>
                  <p className="text-sm text-emerald-400 font-bold">{selectedWanted.reward === 'A definir' ? 'A definir' : `R$ ${selectedWanted.reward}`}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  Reportar Avistamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRESO */}
      {selectedArrest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedArrest(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="text-federal-500" size={20} />
                Detalhes da Detenção
              </h3>
              <button onClick={() => setSelectedArrest(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex gap-6">
                <div className="w-1/3">
                  <div className="aspect-square bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    {selectedArrest.images?.face ? (
                      <img src={selectedArrest.images.face} alt={selectedArrest.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                        <User size={32} />
                        <span className="text-[10px] font-bold uppercase mt-2">Sem Foto</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-wider">
                      Preso
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedArrest.name}</h2>
                    <p className="text-sm text-slate-400">Doc: {selectedArrest.passport}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-bold block">Motivo da Prisão</span>
                      <p className="text-sm text-slate-200">{selectedArrest.reason}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-bold block">Artigos</span>
                      <p className="text-sm text-slate-200">{selectedArrest.articles}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-bold block">Data da Ocorrência</span>
                      <p className="text-sm text-slate-200">
                        {format(new Date(selectedArrest.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
