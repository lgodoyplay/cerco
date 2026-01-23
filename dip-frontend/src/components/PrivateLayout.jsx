import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { prefetchRoute } from '../routes/routeLoaders';
import ChangePasswordModal from './ChangePasswordModal';
import { 
  Book, 
  LayoutDashboard, 
  FileText, 
  UserX, 
  Siren, 
  Settings, 
  LogOut, 
  Shield, 
  ShieldAlert,
  AlertTriangle,
  Menu,
  X,
  Search,
  DollarSign,
  FileSearch,
  Target,
  Gavel,
  Car,
  Scale,
  GraduationCap,
  Package,
  Radio
} from 'lucide-react';
import clsx from 'clsx';
import { getInitials } from '../utils/stringUtils';

const SidebarItem = ({ to, icon: Icon, label, active, onClick, prefetchKey }) => (
  <Link
    to={to}
    onClick={onClick}
    onMouseEnter={() => prefetchKey && prefetchRoute(prefetchKey)}
    className={clsx(
      "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg group relative overflow-hidden",
      active
        ? "bg-federal-600 text-white shadow-lg shadow-federal-900/50"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}
  >
    {active && (
      <div className="absolute inset-0 bg-gradient-to-r from-federal-500/20 to-transparent pointer-events-none" />
    )}
    <Icon size={20} className={clsx("transition-colors", active ? "text-white" : "text-slate-500 group-hover:text-white")} />
    <span className="relative z-10">{label}</span>
  </Link>
);

const PrivateLayout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Painel Geral', prefetchKey: 'DashboardHome' },
    { 
      to: user?.passport_id?.startsWith('PRF') ? '/dashboard/curso-prf' : '/dashboard/curso-dpf', 
      icon: Book, 
      label: 'Curso de Formação', 
      prefetchKey: 'CursoDPF' 
    },
    { to: '/dashboard/anp-student', icon: GraduationCap, label: 'Área do Aluno', prefetchKey: 'ANPStudentDashboard' },
    { to: '/dashboard/communication', icon: Radio, label: 'Comunicação', prefetchKey: 'CommunicationHub' },
    { to: '/dashboard/logistics', icon: Package, label: 'Logística', prefetchKey: 'LogisticsDashboard' },
    { to: '/dashboard/prf', icon: Car, label: 'Integração PRF', prefetchKey: 'PRFIntegration', permission: 'prf_view' },
    { to: '/dashboard/lawyers', icon: Scale, label: 'Advogados', prefetchKey: 'LawyerDashboard', permission: 'lawyer_view' },
    { to: '/dashboard/judiciary', icon: Gavel, label: 'Jurídico', prefetchKey: 'JudiciaryManager', permission: 'judiciary_view' },
    { to: '/dashboard/arrest', icon: UserX, label: 'Registrar Prisão', prefetchKey: 'RegisterArrest', permission: 'arrest_manage' },
    { to: '/dashboard/arrests', icon: Shield, label: 'Registro de Prisões', prefetchKey: 'ArrestList', permission: 'arrest_view' },
    { to: '/dashboard/bo', icon: FileText, label: 'Registrar BO', prefetchKey: 'RegisterBO', permission: 'bo_manage' },
    { to: '/dashboard/bo-list', icon: FileText, label: 'Consultar BOs', prefetchKey: 'BOList', permission: 'bo_view' },
    { to: '/dashboard/reports', icon: AlertTriangle, label: 'Denúncias', prefetchKey: 'ReportList', permission: 'reports_view' },
    { to: '/dashboard/register-wanted', icon: Siren, label: 'Registrar Procurados', prefetchKey: 'RegisterWanted', permission: 'wanted_manage' },
    { to: '/dashboard/wanted', icon: ShieldAlert, label: 'Registro de Procurados', prefetchKey: 'WantedList', permission: 'wanted_view' },
    { to: '/dashboard/investigations', icon: Search, label: 'Investigações', prefetchKey: 'InvestigationList', permission: 'investigations_view' },
    { to: '/dashboard/forensics', icon: FileSearch, label: 'Perícias', prefetchKey: 'ForensicsList', permission: 'forensics_view' },
    { to: '/dashboard/weapons', icon: Target, label: 'Porte de Armas', prefetchKey: 'WeaponsManager', permission: 'weapons_view' },
    { to: '/dashboard/revenue', icon: DollarSign, label: 'Receita', prefetchKey: 'RevenueList', permission: 'revenue_view' },
    { to: '/dashboard/settings', icon: Settings, label: 'Configurações', prefetchKey: 'SettingsLayout', permission: 'settings_view' },
  ];

  const filteredNavItems = navItems.filter(item => {
    // Diretor Geral sees everything
    if (user?.role?.toLowerCase().includes('diretor')) return true;
    
    if (!item.permission) return true;
    return (user?.permissions || []).includes(item.permission);
  });

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    // Strict match or sub-route match (ensure slash follows prefix)
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex h-[100dvh] bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Force Password Change Modal */}
      {user?.must_change_password && <ChangePasswordModal />}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 md:static md:translate-x-0 flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-federal-600 flex items-center justify-center shadow-lg shadow-federal-900/50">
               <Shield size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">DPF Policial</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* User Profile Snippet */}
        <div className="p-4">
          <Link to="/dashboard/profile" className="block group">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 group-hover:border-federal-500/50 group-hover:bg-slate-800 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-federal-500 to-federal-700 flex items-center justify-center font-bold text-sm border-2 border-slate-800 shadow-md overflow-hidden">
                   {user?.avatar_url ? (
                      <img 
                        src={user.avatar_url.startsWith('http') ? user.avatar_url : supabase.storage.from('avatars').getPublicUrl(user.avatar_url).data.publicUrl}
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null; // Previne loop
                          e.target.style.display = 'none'; // Esconde imagem quebrada
                          e.target.parentElement.innerText = getInitials(user?.username || user?.full_name); // Mostra iniciais
                        }}
                      />
                   ) : (
                      getInitials(user?.username || user?.full_name)
                   )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-federal-400 transition-colors">
                    {user?.full_name || user?.username || 'Agente'}
                  </p>
                  <p className="text-xs text-federal-400 truncate">{user?.role || 'Agente'}</p>
                  {user?.passport_id && (
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">#{user.passport_id}</p>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Meu Perfil
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu Principal</div>
          {filteredNavItems.map((item) => (
            <SidebarItem 
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              // Fixed active logic: explicit check for root dashboard, startsWith for others
              active={isActive(item.to)}
              prefetchKey={item.prefetchKey}
              onClick={() => setIsSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-lg transition-colors group"
          >
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
        
        {/* Top Header (Mobile Only / Breadcrumbs) */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm z-30 sticky top-0">
          <button 
            className="md:hidden mr-4 p-2 text-slate-400 hover:text-white"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4 flex-1 px-4 md:px-0 md:w-full md:max-w-md">
             <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all placeholder-slate-600"
                />
             </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            {/* Notifications or other top bar items could go here */}
          </div>
        </header>

        <div className={clsx("flex-1 overflow-auto relative z-10", "p-4 md:p-8")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PrivateLayout;
