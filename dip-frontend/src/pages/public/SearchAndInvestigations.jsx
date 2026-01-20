import React, { useState } from 'react';
import { Search, Shield, UserCheck, AlertTriangle, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SearchAndInvestigations = () => {
  const [activeTab, setActiveTab] = useState('verify'); // 'verify' | 'criminals'
  
  // Verification State
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Criminal Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;

    setVerifyLoading(true);
    setVerifyResult(null);
    setVerifyError('');

    try {
      // Query profiles by functional code (passport_id or legacy codigo_funcional)
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role, passport_id, codigo_funcional, avatar_url')
        .or(`passport_id.eq.${verifyCode.trim()},codigo_funcional.eq.${verifyCode.trim()}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          setVerifyError('Nenhum policial encontrado com este código.');
        } else {
          setVerifyError('Erro ao verificar código. Tente novamente.');
          console.error(error);
        }
      } else {
        setVerifyResult(data);
      }
    } catch (err) {
      setVerifyError('Erro inesperado. Tente novamente.');
      console.error(err);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleCriminalSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    setHasSearched(true);
    setSearchResults([]);

    try {
      // Search in Prisoes
      const { data: prisoes, error: prisoesError } = await supabase
        .from('prisoes')
        .select('id, nome, documento, status, foto_principal, artigo')
        .ilike('nome', `%${searchTerm}%`)
        .limit(10);

      // Search in Procurados
      const { data: procurados, error: procuradosError } = await supabase
        .from('procurados')
        .select('id, nome, documento, status, foto_principal, crime, recompensa')
        .ilike('nome', `%${searchTerm}%`)
        .limit(10);

      if (prisoesError) console.error('Error fetching prisoes:', prisoesError);
      if (procuradosError) console.error('Error fetching procurados:', procuradosError);

      const results = [
        ...(prisoes || []).map(p => ({ ...p, type: 'preso' })),
        ...(procurados || []).map(p => ({ ...p, type: 'procurado' }))
      ];

      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden bg-slate-950 border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-federal-900/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-federal-900/60 border border-federal-700/70 text-federal-200 text-xs font-semibold uppercase tracking-[0.18em]">
              <Search size={16} className="text-federal-400" />
              <span>Sistema Integrado</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Pesquisas e Apurações
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl">
              Ferramenta pública para verificação de identidade de agentes e consulta à base de dados de procurados e detidos.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex gap-2 shadow-xl">
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'verify'
                ? 'bg-federal-600 text-white shadow-lg shadow-federal-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck size={18} />
            Verificar Policial
          </button>
          <button
            onClick={() => setActiveTab('criminals')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'criminals'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle size={18} />
            Presos e Procurados
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Verification Tab */}
        {activeTab === 'verify' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Verificação de Identidade</h2>
                <p className="text-slate-400">Insira o código funcional fornecido pelo agente para validar sua credencial.</p>
              </div>
              
              <form onSubmit={handleVerify} className="max-w-md mx-auto relative">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  placeholder="Ex: PF-123456"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-6 py-4 text-center text-2xl font-mono tracking-widest text-white placeholder:text-slate-700 focus:outline-none focus:border-federal-500 transition-colors uppercase"
                />
                <button
                  type="submit"
                  disabled={verifyLoading || !verifyCode}
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-federal-600 hover:bg-federal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white transition-all"
                >
                  {verifyLoading ? <Loader2 className="animate-spin" /> : <Search />}
                </button>
              </form>

              {verifyError && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium">
                  <X size={16} />
                  {verifyError}
                </div>
              )}

              {verifyResult && (
                <div className="mt-8 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 animate-in zoom-in-95 duration-300">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-emerald-500/30 overflow-hidden relative">
                       {verifyResult.avatar_url ? (
                         <img 
                           src={verifyResult.avatar_url.startsWith('http') 
                             ? verifyResult.avatar_url 
                             : supabase.storage.from('avatars').getPublicUrl(verifyResult.avatar_url).data.publicUrl} 
                           alt="Avatar" 
                           className="w-full h-full object-cover" 
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-3xl">
                           {verifyResult.full_name?.charAt(0)}
                         </div>
                       )}
                       <div className="absolute bottom-0 right-0 p-1 bg-emerald-500 rounded-full border-2 border-slate-900">
                         <CheckCircle size={16} className="text-white" />
                       </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Credencial Válida</p>
                      <h3 className="text-2xl font-bold text-white">{verifyResult.full_name}</h3>
                      <p className="text-slate-400 font-medium">{verifyResult.role}</p>
                      <div className="inline-block px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono mt-2">
                        {verifyResult.passport_id || verifyResult.codigo_funcional}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid sm:grid-cols-3 gap-4 text-center text-xs text-slate-500">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                <Shield className="mx-auto mb-2 opacity-50" size={20} />
                Sistema seguro e monitorado
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                <UserCheck className="mx-auto mb-2 opacity-50" size={20} />
                Validação em tempo real
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                <FileText className="mx-auto mb-2 opacity-50" size={20} />
                Registro oficial DPF
              </div>
            </div>
          </div>
        )}

        {/* Criminals Tab */}
        {activeTab === 'criminals' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Consulta Pública</h2>
                <p className="text-slate-400">Pesquise por nome, apelido ou documento na base de dados de segurança.</p>
              </div>

              <form onSubmit={handleCriminalSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome, vulgo ou documento..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchLoading || !searchTerm}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20"
                >
                  {searchLoading ? <Loader2 className="animate-spin" /> : 'Pesquisar'}
                </button>
              </form>
             </div>

             {hasSearched && searchResults.length === 0 && !searchLoading && (
               <div className="text-center py-12 text-slate-500">
                 <p>Nenhum registro encontrado para "{searchTerm}"</p>
               </div>
             )}

             <div className="grid sm:grid-cols-2 gap-4">
               {searchResults.map((item) => (
                 <div key={`${item.type}-${item.id}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 hover:border-slate-700 transition-colors">
                   <div className="w-20 h-20 rounded-xl bg-slate-950 flex-shrink-0 overflow-hidden border border-slate-800">
                     {item.foto_principal ? (
                       <img src={item.foto_principal} alt={item.nome} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-700">
                         <UserCheck size={24} />
                       </div>
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-start justify-between gap-2">
                       <h3 className="font-bold text-white truncate">{item.nome}</h3>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                         item.type === 'procurado' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                       }`}>
                         {item.type === 'procurado' ? 'Procurado' : 'Detido'}
                       </span>
                     </div>
                     <p className="text-xs text-slate-400 mt-1 truncate">
                       {item.type === 'procurado' ? `Crime: ${item.crime || 'N/A'}` : `Artigo: ${item.artigo || 'N/A'}`}
                     </p>
                     {item.recompensa && (
                       <p className="text-xs text-emerald-400 mt-2 font-medium">
                         Recompensa: {item.recompensa}
                       </p>
                     )}
                     <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">
                       Status: {item.status}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAndInvestigations;
