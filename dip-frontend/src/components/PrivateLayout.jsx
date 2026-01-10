import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  UserX, 
  Siren, 
  Settings, 
  LogOut, 
  Shield, 
  ShieldAlert,
  Menu,
  X,
  Search
} from 'lucide-react';
import clsx from 'clsx';
import { getInitials } from '../utils/stringUtils';

const SidebarItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
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
    { to: '/dashboard', icon: LayoutDashboard, label: 'Painel Geral' },
    { to: '/dashboard/arrest', icon: UserX, label: 'Registrar Prisão' },
    { to: '/dashboard/arrests', icon: Shield, label: 'Registro de Prisões' },
    { to: '/dashboard/bo', icon: FileText, label: 'Registrar BO' },
    { to: '/dashboard/bo-list', icon: FileText, label: 'Consultar BOs' },
    { to: '/dashboard/register-wanted', icon: Siren, label: 'Registrar Procurados' },
    { to: '/dashboard/wanted', icon: ShieldAlert, label: 'Registro de Procurados' },
    { to: '/dashboard/investigations', icon: Search, label: 'Investigações' },
    { to: '/dashboard/settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
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
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 md:h-20 flex items-center px-4 md:px-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-federal-600 flex items-center justify-center shadow-lg shadow-federal-600/20">
              <Shield className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg tracking-tight text-white leading-none">DICOR</h1>
              <p className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">Polícia Federal</p>
            </div>
          </div>
          <button 
            className="md:hidden ml-auto p-2 text-slate-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
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
                        src={`https://vtfpfevjoxbnyowrecyu.supabase.co/storage/v1/object/public/avatars/${user.avatar_url}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
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
          {navItems.map((item) => (
            <SidebarItem 
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
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
            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto md:ml-0 md:w-full md:max-w-md">
             <div className="relative w-full hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Pesquisar registros, códigos ou agentes..." 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all placeholder-slate-600"
                />
             </div>
          </div>

          <div className="flex items-center gap-4 ml-4">
            {/* Notifications or other top bar items could go here */}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PrivateLayout;
