import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { supabase } from '../lib/supabase';
import { prefetchRoute } from '../routes/routeLoaders';
import ChangePasswordModal from './ChangePasswordModal';
import {
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
  Radio,
  Newspaper,
  Building2,
  Stethoscope,
  FileCheck,
  BadgeX,
  UserCog,
  Bell,
  ChevronDown,
  User,
  LogOut as LogOutIcon,
  Settings as SettingsIcon,
  ShieldCheck,
  UserPlus,
  FolderOpen,
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
  const { can } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Nova prisão registrada', time: '5 min atrás', read: false, icon: UserX, color: 'red' },
    { id: 2, title: 'Investigação atualizada', time: '1 hora atrás', read: false, icon: Search, color: 'amber' },
    { id: 3, title: 'Relatório gerado', time: '3 horas atrás', read: true, icon: FileText, color: 'emerald' },
  ]);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSidebarOpen(false);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const navCategories = [
    { 
      label: 'Painel Principal',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Painel Geral', prefetchKey: 'DashboardHome' },
        ...(user?.role === 'Aluno' ? [{ to: '/dashboard/anp-student', icon: GraduationCap, label: 'Área do Aluno', prefetchKey: 'ANPStudentDashboard' }] : []),
      ]
    },
    { 
      label: 'Trabalho',
      items: [
        { to: '/dashboard/arrest', icon: UserX, label: 'Registrar Prisão', prefetchKey: 'RegisterArrest', permission: 'arrest_manage' },
        { to: '/dashboard/arrests', icon: Shield, label: 'Registro de Prisões', prefetchKey: 'ArrestList', permission: 'arrest_view' },
        { to: '/dashboard/register-wanted', icon: Siren, label: 'Registrar Procurados', prefetchKey: 'RegisterWanted', permission: 'wanted_manage' },
        { to: '/dashboard/wanted', icon: ShieldAlert, label: 'Registro de Procurados', prefetchKey: 'WantedList', permission: 'wanted_view' },
        { to: '/dashboard/bo', icon: FileText, label: 'Registrar B.O.', prefetchKey: 'RegisterBO', permission: 'bo_manage' },
        { to: '/dashboard/bo-list', icon: FileText, label: 'Consultar B.O.s', prefetchKey: 'BOList', permission: 'bo_view' },
        { to: '/dashboard/protective-measures', icon: ShieldAlert, label: 'Medida Protetiva', prefetchKey: 'ProtectiveMeasuresManager', permission: 'protective_measures_view' },
        { to: '/dashboard/reports', icon: AlertTriangle, label: 'Denúncias', prefetchKey: 'ReportList', permission: 'reports_view' },
      ]
    },
    {
      label: 'Investigativo',
      items: [
        { to: '/dashboard/investigations', icon: Search, label: 'Investigações', prefetchKey: 'InvestigationList', permission: 'investigations_view' },
        { to: '/dashboard/investigations/informantes', icon: UserPlus, label: 'Informantes', prefetchKey: 'InformantesList', permission: 'investigations_view' },
        { to: '/dashboard/search-seizure', icon: FileCheck, label: 'Busca e Apreensão', prefetchKey: 'SearchSeizureList', permission: 'investigations_view' },
        { to: '/dashboard/forensics', icon: FileSearch, label: 'Perícias', prefetchKey: 'ForensicsList', permission: 'forensics_view' },
        { to: '/dashboard/revenue', icon: DollarSign, label: 'Receita', prefetchKey: 'RevenueList', permission: 'revenue_view' },
      ]
    },
    { 
      label: 'Jurídico',
      items: [
        { to: '/dashboard/alvaras', icon: Building2, label: 'Alvarás', prefetchKey: 'AlvaraList' },
        { to: '/dashboard/weapons', icon: Target, label: 'Porte de Armas', prefetchKey: 'WeaponsManager', permission: 'weapons_view' },
        { to: '/dashboard/lawyers', icon: Scale, label: 'Advogados', prefetchKey: 'LawyerDashboard', permission: 'lawyer_view' },
        { to: '/dashboard/judiciary', icon: Gavel, label: 'Jurídico', prefetchKey: 'JudiciaryManager', permission: 'judiciary_view' },
      ]
    },
    { 
      label: 'Hospital',
      items: [
        { to: '/dashboard/laudos', icon: Stethoscope, label: 'Laudos Médicos', prefetchKey: 'LaudosList', permission: 'laudos_view' },
      ]
    },
    { 
      label: 'Outros',
      items: [
        { to: '/dashboard/corregedoria', icon: ShieldAlert, label: 'Corregedoria', prefetchKey: 'CorregedoriaList' },
        { to: '/dashboard/exonerations', icon: BadgeX, label: 'Exoneração', prefetchKey: 'ExonerationsManager', permission: 'exonerations_view' },
        { to: '/dashboard/integration', icon: UserCog, label: 'Integração', prefetchKey: 'IntegrationManager', permission: 'integration_view' },
        { to: '/dashboard/pm', icon: Car, label: 'Integração PM', prefetchKey: 'PMIntegration', permission: 'pm_view' },
        { to: '/dashboard/news', icon: Newspaper, label: 'Notícias', permission: 'news_manage' },
        { to: '/dashboard/communication', icon: Radio, label: 'Comunicação', prefetchKey: 'CommunicationHub', permission: 'communication_view' },
        { to: '/dashboard/logistics', icon: Package, label: 'Logística', prefetchKey: 'LogisticsDashboard', permission: 'logistics_view' },
      ]
    },
    { 
      label: 'Configuração',
      items: [
        { to: '/dashboard/settings', icon: Settings, label: 'Configurações', prefetchKey: 'SettingsLayout', permission: 'settings_view' },
      ]
    }
  ];

  const filterItems = (items) => items.filter(item => {
    if (user?.role?.toLowerCase().includes('diretor')) return true;
    if (!item.permission) return true;
    return can(item.permission);
  });

  const filteredNavCategories = navCategories.map(category => ({
    ...category,
    items: filterItems(category.items)
  })).filter(category => category.items.length > 0);

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const getBreadcrumbLabel = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Painel Geral';
    const segments = path.replace('/dashboard', '').split('/').filter(Boolean);
    if (segments.length === 0) return 'Painel Geral';
    return segments.map(s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(' / ');
  };

  return (
    <div className="flex h-[100dvh] bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {user?.must_change_password && <ChangePasswordModal />}

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 md:static md:translate-x-0 flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/LOGO.gif" alt="Logo CIVIL EUFORIA" className="w-8 h-8 rounded-lg shadow-lg shadow-federal-900/50 object-cover" />
            <span className="font-bold text-lg tracking-tight">CIVIL EUFORIA - Polícia Civil</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

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
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerText = getInitials(user?.username || user?.full_name);
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

        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto custom-scrollbar">
          {filteredNavCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{category.label}</div>
              {category.items.map((item) => (
                <SidebarItem 
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.to)}
                  prefetchKey={item.prefetchKey}
                  onClick={() => setIsSidebarOpen(false)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 rounded-lg transition-colors group"
          >
            <LogOutIcon size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
        
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden mr-2 p-2 text-slate-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu lateral"
            >
              <Menu size={24} />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden md:flex items-center gap-2 text-sm" aria-label="Breadcrumb">
              <span className="text-slate-500">Painel</span>
              <span className="text-slate-700">/</span>
              <span className="text-slate-300 font-medium">{getBreadcrumbLabel()}</span>
            </nav>
          </div>

          <div className="flex items-center gap-4 flex-1 md:max-w-md md:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="search" 
                placeholder="Pesquisar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all placeholder-slate-600"
                aria-label="Pesquisar"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsUserMenuOpen(false); }}
                aria-label="Notificações"
                className="relative p-2 text-slate-400 hover:text-white transition-colors"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">Notificações</h3>
                    {unreadNotifications > 0 && (
                      <button onClick={markAllNotificationsAsRead} className="text-xs text-federal-400 hover:text-federal-300 font-medium">
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">Nenhuma notificação</div>
                    ) : (
                      notifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          className={clsx(
                            "w-full text-left p-3 flex items-start gap-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0",
                            !notif.read && "bg-slate-800/30"
                          )}
                        >
                          <div className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                            notif.color === 'red' ? 'bg-red-500/10 text-red-400' :
                            notif.color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          )}>
                            <notif.icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={clsx("text-sm font-medium", notif.read ? 'text-slate-400' : 'text-white')}>{notif.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{notif.time}</p>
                          </div>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-federal-500 flex-shrink-0 mt-2" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationsOpen(false); }}
                aria-label="Menu do usuário"
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-federal-500 to-federal-700 flex items-center justify-center font-bold text-xs border-2 border-slate-800 shadow-md overflow-hidden">
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url.startsWith('http') ? user.avatar_url : supabase.storage.from('avatars').getPublicUrl(user.avatar_url).data.publicUrl}
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentElement.innerText = getInitials(user?.username || user?.full_name);
                      }}
                    />
                  ) : (
                    getInitials(user?.username || user?.full_name)
                  )}
                </div>
                <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white truncate">{user?.full_name || user?.username || 'Agente'}</p>
                    <p className="text-xs text-federal-400">{user?.role || 'Agente'}</p>
                    {user?.passport_id && (
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">#{user.passport_id}</p>
                    )}
                  </div>
                  <div className="py-1">
                    <Link to="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <User size={16} /> Meu Perfil
                    </Link>
                    <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <SettingsIcon size={16} /> Configurações
                    </Link>
                  </div>
                  <div className="py-1 border-t border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors w-full text-left"
                    >
                      <LogOutIcon size={16} /> Encerrar Sessão
                    </button>
                  </div>
                </div>
              )}
            </div>
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
