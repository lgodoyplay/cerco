import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, TrendingUp, Search, Clock, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const DashboardStat = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
    <div className={`absolute top-0 right-0 p-4 opacity-5 text-${color}-500 transform scale-150`}>
      <Icon size={100} />
    </div>
    <div className="relative z-10">
      <div className={`inline-flex p-2.5 rounded-lg bg-${color}-500/10 text-${color}-500 mb-4`}>
        <Icon size={24} />
      </div>
      <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</h3>
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      {subtext && <p className="text-slate-600 text-xs mt-2">{subtext}</p>}
    </div>
  </div>
);

const DashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPresos: 0,
    totalProcurados: 0,
    totalInvestigacoes: 0,
    totalBos: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          { count: presosCount },
          { count: procuradosCount },
          { count: investigacoesCount },
          { count: bosCount },
          { data: logs }
        ] = await Promise.all([
          supabase.from('prisoes').select('*', { count: 'exact', head: true }),
          supabase.from('procurados').select('*', { count: 'exact', head: true }),
          supabase.from('investigacoes').select('*', { count: 'exact', head: true }),
          supabase.from('boletins').select('*', { count: 'exact', head: true }),
          supabase.from('system_logs').select('*, profiles(full_name, role)').order('created_at', { ascending: false }).limit(5)
        ]);

        setStats({
          totalPresos: presosCount || 0,
          totalProcurados: procuradosCount || 0,
          totalInvestigacoes: investigacoesCount || 0,
          totalBos: bosCount || 0
        });
        
        // Map logs to match recentActivities structure if needed
        const activities = (logs || []).map(log => ({
          action: log.action,
          details: log.details,
          createdAt: log.created_at,
          user: {
             nome: log.profiles?.full_name,
             patente: log.profiles?.role
          }
        }));

        setRecentActivities(activities);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s atrás`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    return `${Math.floor(diffInSeconds / 86400)}d atrás`;
  };

  const getIconForActivity = (action) => {
    const lower = (action || '').toLowerCase();
    if (lower.includes('prisão')) return { icon: Users, color: 'blue' };
    if (lower.includes('procurado')) return { icon: ShieldAlert, color: 'red' };
    if (lower.includes('investigação')) return { icon: FileText, color: 'amber' };
    return { icon: AlertTriangle, color: 'slate' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Painel Geral</h2>
          <p className="text-slate-400 text-sm">Visão geral das operações e estatísticas (Tempo Real).</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            STATUS: ONLINE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStat 
          title="Presos Registrados" 
          value={loading ? '...' : stats.totalPresos} 
          subtext="Total no sistema" 
          icon={Users} 
          color="blue" 
        />
        <DashboardStat 
          title="Procurados Ativos" 
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
          title="B.O.s Registrados" 
          value={loading ? '...' : stats.totalBos} 
          subtext="Ocorrências" 
          icon={FileText} 
          color="emerald" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Clock size={20} className="text-slate-400" />
              Atividade Recente (Logs)
            </h3>
            <button className="text-xs text-federal-400 hover:text-federal-300 font-medium">Ver Histórico</button>
          </div>
          
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma atividade recente registrada.</p>
            ) : (
              recentActivities.map((item, i) => {
                const { icon: Icon, color } = getIconForActivity(item.action);
                return (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
                    <div className={`mt-1 p-2 rounded-lg flex-shrink-0 bg-${color}-500/10 text-${color}-500`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-slate-200">{item.action}</h4>
                        <span className="text-xs text-slate-500">{formatTimeAgo(item.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.details}</p>
                      <p className="text-[10px] text-slate-600 mt-2 font-medium uppercase tracking-wider">
                        Por: {item.user?.nome || 'Sistema'} ({item.user?.patente || 'N/A'})
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions / Notices */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-federal-900 to-federal-800 border border-federal-700 rounded-xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Acesso Rápido</h3>
              <p className="text-federal-200 text-xs mb-6">Atalhos para funções comuns.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/dashboard/arrest')}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors text-left px-4"
                >
                  + Nova Prisão
                </button>
                <button 
                  onClick={() => navigate('/dashboard/register-wanted')}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors text-left px-4"
                >
                  + Novo Procurado
                </button>
                <button 
                  onClick={() => navigate('/dashboard/investigations/new')}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors text-left px-4"
                >
                  + Iniciar Investigação
                </button>
                <button 
                  onClick={() => navigate('/dashboard/bo')}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors text-left px-4"
                >
                  + Registrar B.O.
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
