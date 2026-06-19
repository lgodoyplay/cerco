import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, TrendingUp, Search, BadgeCheck, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Hook para data e hora em tempo real
const useCurrentDateTime = () => {
  const [dateTime, setDateTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  return dateTime;
};

// Função para saudação personalizada
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const DashboardStat = React.memo(({ title, value, subtext, icon: Icon, color }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Mapeamento de cores para gradientes
  const colorMap = {
    blue: { bg: 'from-blue-600 to-blue-800', accent: 'text-blue-400', soft: 'bg-blue-500/10', border: 'border-blue-500/30' },
    red: { bg: 'from-red-600 to-red-800', accent: 'text-red-400', soft: 'bg-red-500/10', border: 'border-red-500/30' },
    amber: { bg: 'from-amber-600 to-amber-800', accent: 'text-amber-400', soft: 'bg-amber-500/10', border: 'border-amber-500/30' },
    emerald: { bg: 'from-emerald-600 to-emerald-800', accent: 'text-emerald-400', soft: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  };
  
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div 
      className={`
        bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 relative overflow-hidden 
        transition-all duration-500 hover:border-${color}-500/50 hover:shadow-lg hover:shadow-${color}-900/20 hover:-translate-y-1
        ${isVisible ? 'animate-in slide-in-from-bottom-8' : 'opacity-0'}
      `}
    >
      {/* Elemento de fundo decorativo */}
      <div className={`absolute top-0 right-0 p-3 md:p-5 opacity-10 text-${color}-500 transform scale-150 md:scale-[2] transition-transform duration-700 group-hover:scale-[1.8]`}>
        <Icon size={80} />
      </div>
      
      {/* Barra de acento no topo */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.bg} opacity-70`} />
      
      <div className="relative z-10">
        <div className={`inline-flex p-3 rounded-xl ${colors.soft} ${colors.accent} mb-4 shadow-inner`}>
          <Icon size={24} className="md:w-7 md:h-7" />
        </div>
        <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-sm">
          {value}
        </h3>
        <p className="text-slate-300 text-sm md:text-base font-semibold">{title}</p>
        {subtext && <p className="text-slate-500 text-xs md:text-sm mt-2 flex items-center gap-1">
          <TrendingUp size={12} /> {subtext}
        </p>}
      </div>
    </div>
  );
});

const DashboardHome = () => {
  const navigate = useNavigate();
  const dateTime = useCurrentDateTime();
  const [stats, setStats] = useState({
    totalPresos: 0,
    totalProcurados: 0,
    totalInvestigacoes: 0,
    totalBos: 0
  });
  const [loading, setLoading] = useState(true);
  const [functionalCode, setFunctionalCode] = useState(null);
  const [userName, setUserName] = useState('');
  const [chartData, setChartData] = useState({
    boByWeek: [],
    crimesByType: []
  });

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      console.time('Dashboard Fetch');
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Setar nome do usuário
          const { data: profile } = await supabase
            .from('profiles')
            .select('passport_id, codigo_funcional, full_name')
            .eq('id', user.id)
            .single();

          if (profile) {
            if (profile.full_name) setUserName(profile.full_name.split(' ')[0]);
            
            const currentCode = profile.passport_id || profile.codigo_funcional;

            if (currentCode) {
              if (isMounted) setFunctionalCode(currentCode);
              
              if (!profile.passport_id && profile.codigo_funcional) {
                 await supabase.from('profiles').update({ passport_id: profile.codigo_funcional }).eq('id', user.id);
              }

            } else {
              const newCode = 'CIVIL EUFORIA-' + Math.floor(100000 + Math.random() * 900000);
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ passport_id: newCode })
                .eq('id', user.id);
              
              if (!updateError && isMounted) {
                setFunctionalCode(newCode);
              }
            }
          }
        }

        const [
          { count: presosCount },
          { count: procuradosCount },
          { count: investigacoesCount },
          { count: bosCount },
          { data: boData },
          { data: crimesData },
          { data: prisoesData }
        ] = await Promise.all([
          supabase.from('prisoes').select('*', { count: 'exact', head: true }),
          supabase.from('procurados').select('*', { count: 'exact', head: true }),
          supabase.from('investigacoes').select('*', { count: 'exact', head: true }),
          supabase.from('boletins').select('*', { count: 'exact', head: true }),
          supabase.from('boletins').select('created_at'),
          supabase.from('crimes').select('id, name, article'),
          supabase.from('prisoes').select('artigo, created_at')
        ]);

        console.log('Debug Dashboard Data:', { crimesData, prisoesData });

        if (isMounted) {
          setStats({
            totalPresos: presosCount || 0,
            totalProcurados: procuradosCount || 0,
            totalInvestigacoes: investigacoesCount || 0,
            totalBos: bosCount || 0
          });

          // Processar dados para gráfico de BO por SEMANA
          const boByWeek = (boData || []).reduce((acc, bo) => {
            const date = new Date(bo.created_at);
            // Obter semana do ano
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            const weekKey = startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            acc[weekKey] = (acc[weekKey] || 0) + 1;
            return acc;
          }, {});

          const boByWeekArray = Object.entries(boByWeek).map(([week, count]) => ({ week, count })).slice(-8);

          // Processar dados para gráfico de crimes por tipo (dados reais de prisoes)
          let crimesByTypeArray = [];
          
          if (crimesData && crimesData.length > 0) {
            // Contar quantas vezes cada artigo aparece nas prisões
            const crimeCounts = {};
            crimesData.forEach(crime => {
              crimeCounts[crime.id] = { name: crime.name, count: 0 };
            });

            if (prisoesData && prisoesData.length > 0) {
              prisoesData.forEach(prisao => {
                if (prisao.artigo) {
                  console.log('Prisão artigo:', prisao.artigo);
                  const artigoList = prisao.artigo.split(',').map(a => a.trim());
                  artigoList.forEach(artigoStr => {
                    const artigoNum = artigoStr.replace(/Art\.?\s*/gi, '').trim();
                    console.log('Artigo processado:', artigoNum);
                    const matchingCrime = crimesData.find(c => {
                      // Compara tanto como string quanto como número
                      const crimeArticleStr = String(c.article).trim();
                      return crimeArticleStr === artigoNum;
                    });
                    console.log('Matching crime:', matchingCrime);
                    if (matchingCrime) {
                      crimeCounts[matchingCrime.id].count++;
                    }
                  });
                }
              });
            }

            // Mostrar todos os crimes ordenados por contagem (incluindo os com 0)
            crimesByTypeArray = Object.values(crimeCounts)
              .sort((a, b) => b.count - a.count)
              .slice(0, 8);
          }
          
          console.log('Final crimesByTypeArray:', crimesByTypeArray);

          setChartData({
            boByWeek: boByWeekArray,
            crimesByType: crimesByTypeArray
          });
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        if (isMounted) setLoading(false);
        console.timeEnd('Dashboard Fetch');
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Seção de saudação e data */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {new Date().getHours() < 12 ? 
              <Sun size={24} className="text-amber-400" /> : 
              new Date().getHours() < 18 ? 
                <Sun size={24} className="text-orange-400" /> : 
                <Moon size={24} className="text-indigo-400" />
            }
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {getGreeting()}, {userName || 'Agente'}!
            </h1>
          </div>
          <p className="text-slate-400 text-sm md:text-base">
            {dateTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-slate-500 text-xs md:text-sm">Visão geral das operações e estatísticas (Tempo Real).</p>
        </div>
        <div className="flex gap-3 items-center">
          <span className="px-4 py-2 bg-gradient-to-r from-green-500/20 via-emerald-500/10 text-green-400 border border-green-500/30 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-900/20">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse absolute ml-[6px]" />
            SISTEMA ONLINE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <DashboardStat 
          title="Presos" 
          value={loading ? '...' : stats.totalPresos} 
          subtext="Total no sistema" 
          icon={Users} 
          color="blue" 
        />
        <DashboardStat 
          title="Procurados" 
          value={loading ? '...' : stats.totalProcurados} 
          subtext="Em busca ativa" 
          icon={AlertTriangle} 
          color="red" 
        />
        <DashboardStat 
          title="Investigações" 
          value={loading ? '...' : stats.totalInvestigacoes} 
          subtext="Em andamento" 
          icon={Search} 
          color="amber" 
        />
        <DashboardStat 
          title="B.O.s" 
          value={loading ? '...' : stats.totalBos} 
          subtext="Ocorrências" 
          icon={FileText} 
          color="emerald" 
        />
      </div>

      {/* Gráficos Analíticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <h3 className="font-bold text-lg md:text-xl text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-federal-400" />
            B.O.s por Semana
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.boByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <h3 className="font-bold text-lg md:text-xl text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-emerald-400" />
            Crimes por Tipo (Prisões)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={chartData.crimesByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {chartData.crimesByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'][index % 8]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions / Notices */}
        <div className="space-y-6">
          {/* Functional Code Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-0 bg-gradient-to-br from-federal-900/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 p-5 opacity-15 text-federal-500 transform scale-[2] group-hover:scale-[1.8] transition-transform duration-700">
              <BadgeCheck size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Identificação Funcional</h3>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-2xl md:text-4xl font-mono font-extrabold text-white tracking-wider">
                  {functionalCode || '...'}
                </span>
                {functionalCode && (
                  <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ATIVO
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                Utilize este código para se identificar em operações e para verificação de identidade em serviços.
              </p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-gradient-to-br from-federal-900/80 to-federal-800/70 border border-federal-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-[0_8px_30px_rgba(30,58,138,0.2)]">
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                Acesso Rápido
              </h3>
              <p className="text-federal-200 text-sm mb-6">Atalhos para as funções mais utilizadas.</p>
              
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => navigate('/dashboard/arrest')}
                  className="group flex items-center gap-3 w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <Users size={18} className="text-blue-300" />
                  </div>
                  <span>Nova Prisão</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard/register-wanted')}
                  className="group flex items-center gap-3 w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                    <AlertTriangle size={18} className="text-red-300" />
                  </div>
                  <span>Novo Procurado</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard/investigations/new')}
                  className="group flex items-center gap-3 w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="p-2 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                    <Search size={18} className="text-amber-300" />
                  </div>
                  <span>Iniciar Investigação</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard/bo')}
                  className="group flex items-center gap-3 w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                    <FileText size={18} className="text-emerald-300" />
                  </div>
                  <span>Registrar B.O.</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
