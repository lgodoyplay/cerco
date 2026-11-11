import React, { useState, useEffect, useCallback } from 'react';
import { Users, AlertTriangle, FileText, TrendingUp, Search, BadgeCheck, Sun, Moon, RefreshCw, AlertCircle, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getAvatarPublicUrl } from '../../lib/avatar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const useCurrentDateTime = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return dateTime;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const SkeletonStat = () => (
  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-700 to-slate-600 opacity-70" />
    <div className="relative z-10">
      <div className="inline-flex p-3 rounded-xl bg-slate-800 text-slate-600 mb-4" />
      <div className="h-10 bg-slate-800 rounded w-20 mb-2 animate-pulse" />
      <div className="h-4 bg-slate-800 rounded w-32 mb-2 animate-pulse" />
      <div className="h-3 bg-slate-800 rounded w-24 animate-pulse" />
    </div>
  </div>
);

const DashboardStat = React.memo(({ title, value, subtext, icon: Icon, color }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const colorMap = {
    blue: { bg: 'from-blue-600 to-blue-800', accent: 'text-blue-400', soft: 'bg-blue-500/10', border: 'border-blue-500/30' },
    red: { bg: 'from-red-600 to-red-800', accent: 'text-red-400', soft: 'bg-red-500/10', border: 'border-red-500/30' },
    amber: { bg: 'from-amber-600 to-amber-800', accent: 'text-amber-400', soft: 'bg-amber-500/10', border: 'border-amber-500/30' },
    emerald: { bg: 'from-emerald-600 to-emerald-800', accent: 'text-emerald-400', soft: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <div
      role="region"
      aria-label={`${title}: ${value}`}
      className={`
        bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 relative overflow-hidden
        transition-all duration-500 hover:border-${color}-500/50 hover:shadow-lg hover:shadow-${color}-900/20 hover:-translate-y-1
        ${isVisible ? 'animate-in slide-in-from-bottom-8' : 'opacity-0'}
      `}
    >
      <div className={`absolute top-0 right-0 p-3 md:p-5 opacity-10 text-${color}-500 transform scale-150 md:scale-[2] transition-transform duration-700`}>
        <Icon size={80} />
      </div>

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

const AnimatedCounter = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const num = Number(value) || 0;
    if (num === 0) { setDisplay(0); return; }
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplay(Math.floor(progress * num));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{display.toLocaleString('pt-BR')}</span>;
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const dateTime = useCurrentDateTime();
  const [stats, setStats] = useState({ totalPresos: 0, totalProcurados: 0, totalInvestigacoes: 0, totalBos: 0, totalInformantes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [functionalCode, setFunctionalCode] = useState(null);
  const [userName, setUserName] = useState('');
  const [chartData, setChartData] = useState({ boByWeek: [], crimesByType: [] });
  const [userProfiles, setUserProfiles] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('passport_id, codigo_funcional, full_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.full_name) setUserName(profile.full_name.split(' ')[0]);

          const currentCode = profile.passport_id || profile.codigo_funcional;

          if (currentCode) {
            setFunctionalCode(currentCode);
            if (!profile.passport_id && profile.codigo_funcional) {
              await supabase.from('profiles').update({ passport_id: profile.codigo_funcional }).eq('id', user.id);
            }
          } else {
            const newCode = 'Polícia Civil - Euforia-' + Math.floor(100000 + Math.random() * 900000);
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ passport_id: newCode })
              .eq('id', user.id);

            if (!updateError) setFunctionalCode(newCode);
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
        { data: prisoesData },
        { data: profilesData }
      ] = await Promise.all([
        supabase.from('prisoes').select('*', { count: 'exact', head: true }),
        supabase.from('procurados').select('*', { count: 'exact', head: true }),
        supabase.from('investigacoes').select('*', { count: 'exact', head: true }),
        supabase.from('boletins').select('*', { count: 'exact', head: true }),
        supabase.from('boletins').select('created_at'),
        supabase.from('crimes').select('id, name, article'),
        supabase.from('prisoes').select('artigo, created_at'),
        supabase.from('profiles').select('id, full_name, role, avatar_url, passport_id, codigo_funcional').order('full_name', { ascending: true })
      ]);

      let informantesCount = 0;
      try {
        const informantesData = JSON.parse(localStorage.getItem('dip_informantes') || '[]');
        informantesCount = informantesData.length;
      } catch {
        informantesCount = 0;
      }

      if (isRefresh) setLastUpdated(new Date());

      setStats({
        totalPresos: presosCount || 0,
        totalProcurados: procuradosCount || 0,
        totalInvestigacoes: investigacoesCount || 0,
        totalBos: bosCount || 0,
        totalInformantes: informantesCount
      });

      const boByWeek = (boData || []).reduce((acc, bo) => {
        const date = new Date(bo.created_at);
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const weekKey = startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        acc[weekKey] = (acc[weekKey] || 0) + 1;
        return acc;
      }, {});

      const boByWeekArray = Object.entries(boByWeek).map(([week, count]) => ({ week, count })).slice(-8);

      let crimesByTypeArray = [];

      if (crimesData && crimesData.length > 0) {
        const crimeCounts = {};
        crimesData.forEach(crime => {
          crimeCounts[crime.id] = { name: crime.name, count: 0 };
        });

        if (prisoesData && prisoesData.length > 0) {
          prisoesData.forEach(prisao => {
            if (prisao.artigo) {
              const artigoList = prisao.artigo.split(',').map(a => a.trim());
              artigoList.forEach(artigoStr => {
                const artigoNum = artigoStr.replace(/Art\.?\s*/gi, '').trim();
                const matchingCrime = crimesData.find(c => {
                  const crimeArticleStr = String(c.article).trim();
                  return crimeArticleStr === artigoNum;
                });
                if (matchingCrime) {
                  crimeCounts[matchingCrime.id].count++;
                }
              });
            }
          });
        }

        crimesByTypeArray = Object.values(crimeCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
      }

      setChartData({ boByWeek: boByWeekArray, crimesByType: crimesByTypeArray });
      setUserProfiles((profilesData || [])
        .filter((profile) => profile?.full_name)
        .map((profile) => ({
          id: profile.id,
          name: profile.full_name,
          role: profile.role || 'Usuário',
          code: profile.passport_id || profile.codigo_funcional || 'Sem código',
          avatar: getAvatarPublicUrl(profile.avatar_url) || null,
        }))
        .slice(0, 12));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Erro ao carregar dados do painel');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const greeting = getGreeting();

  const hasData = stats.totalPresos > 0 || stats.totalProcurados > 0 || stats.totalInvestigacoes > 0 || stats.totalBos > 0 || stats.totalInformantes > 0;
  const hasChartData = chartData.boByWeek.length > 0 || chartData.crimesByType.length > 0;
  const visibleProfiles = userProfiles.slice(0, 8);

  return (
    <div className="space-y-6 pb-20 md:pb-6" role="main" aria-label="Painel Principal">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {new Date().getHours() < 12 ?
                <Sun size={24} className="text-amber-400" /> :
                new Date().getHours() < 18 ?
                  <Sun size={24} className="text-orange-400" /> :
                  <Moon size={24} className="text-indigo-400" />
              }
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {greeting}, {userName || 'Agente'}!
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base">
              {dateTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {lastUpdated && (
              <span className="text-xs text-slate-500 hidden sm:block">
                Atualizado: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              aria-label="Atualizar dados do painel"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <span className="px-4 py-2 bg-gradient-to-r from-green-500/20 via-emerald-500/10 text-green-400 border border-green-500/30 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-900/20">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse absolute ml-[6px]" />
              SISTEMA ONLINE
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 relative overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="absolute inset-0 bg-gradient-to-br from-federal-900/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 p-5 opacity-15 text-federal-500 transform scale-[2] group-hover:scale-[1.8] transition-transform duration-700">
          <BadgeCheck size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.24em] mb-3">Identificação Funcional</h3>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
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
            <p className="text-slate-500 text-sm md:text-base max-w-xl">
              Utilize este código para identificação em operações e comprovação de perfil funcional do sistema.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={() => fetchDashboardData()} className="ml-auto text-red-400 hover:text-red-300 text-sm font-semibold underline">
            Tentar novamente
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <DashboardStat title="Presos" value={<AnimatedCounter value={stats.totalPresos} />} subtext="Total no sistema" icon={Users} color="blue" />
            <DashboardStat title="Procurados" value={<AnimatedCounter value={stats.totalProcurados} />} subtext="Em busca ativa" icon={AlertTriangle} color="red" />
            <DashboardStat title="Investigações" value={<AnimatedCounter value={stats.totalInvestigacoes} />} subtext="Em andamento" icon={Search} color="amber" />
            <DashboardStat title="B.O.s" value={<AnimatedCounter value={stats.totalBos} />} subtext="Ocorrências" icon={FileText} color="emerald" />
            <DashboardStat title="Informantes" value={<AnimatedCounter value={stats.totalInformantes} />} subtext="Cadastrados" icon={UserPlus} color="blue" />
          </>
        )}
      </div>

      {!loading && !error && !hasData && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
          <Search size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-300 mb-2">Nenhum dado disponível</h3>
          <p className="text-slate-500 text-sm">Os estatísticas aparecerão aqui quando houver registros no sistema.</p>
        </div>
      )}

      {visibleProfiles.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Perfis</p>
              <h3 className="text-xl md:text-2xl font-extrabold text-white">Usuários cadastrados</h3>
            </div>
            <span className="text-xs text-slate-400 border border-slate-700 rounded-full px-2.5 py-1">{visibleProfiles.length} cards</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleProfiles.map((profile) => (
              <div key={profile.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-slate-950/30 h-full min-h-[220px]">
                <div className="h-28 bg-gradient-to-br from-federal-900 via-slate-800 to-slate-900 relative">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-300 bg-gradient-to-br from-slate-700 to-slate-900">
                      {profile.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col h-[calc(100%-7rem)]">
                  <div className="mb-3">
                    <h4 className="text-base font-bold text-white leading-snug">{profile.name}</h4>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mt-1">{profile.role}</p>
                  </div>
                  <div className="mt-auto bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Código</p>
                    <p className="text-sm font-mono font-semibold text-slate-100 truncate">{profile.code}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && hasChartData && (
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

          {chartData.crimesByType.length > 0 && (
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
          )}
        </div>
      )}

      {!loading && !error && hasData && chartData.crimesByType.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <h3 className="font-bold text-lg md:text-xl text-white mb-4 flex items-center gap-2">
            <Bar size={20} className="text-amber-400" />
            Distribuição de Crimes (Barra)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData.crimesByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
