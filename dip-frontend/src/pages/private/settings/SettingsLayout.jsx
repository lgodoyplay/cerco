import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import { 
  Users, 
  Building, 
  BadgeCheck, 
  Gavel, 
  FileText, 
  Palette, 
  Shield, 
  Database, 
  ScrollText,
  Settings,
  Inbox,
  BookOpen,
  Share2,
  CheckSquare,
  Activity,
  AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';

const SettingsLayout = () => {
  const { can } = usePermissions();

  const menuItems = [
    { to: '/dashboard/settings/users', icon: Users, label: 'Usuários & Permissões' },
    { to: '/dashboard/settings/warnings', icon: AlertTriangle, label: 'Advertências', permission: 'warnings_manage' },
    { to: '/dashboard/settings/courses', icon: BookOpen, label: 'Gestão de Cursos', permission: 'courses_view' },
    { to: '/dashboard/settings/webhooks', icon: Share2, label: 'Webhooks & Integrações' },
    { to: '/dashboard/settings/forms', icon: Inbox, label: 'Formulários Recebidos' },
    { to: '/dashboard/settings/exams', icon: CheckSquare, label: 'Resultados de Prova' },
    { to: '/dashboard/settings/corporation', icon: Building, label: 'Estrutura da Corporação' },
    { to: '/dashboard/settings/roles', icon: BadgeCheck, label: 'Cargos & Patentes' },
    { to: '/dashboard/settings/crimes', icon: Gavel, label: 'Tipos de Crimes' },
    { to: '/dashboard/settings/templates', icon: FileText, label: 'Modelos de Documentos' },
    { to: '/dashboard/settings/appearance', icon: Palette, label: 'Aparência' },
    { to: '/dashboard/settings/security', icon: Shield, label: 'Segurança' },
    { to: '/dashboard/settings/backup', icon: Database, label: 'Backup & Dados' },
    { to: '/dashboard/settings/health', icon: Activity, label: 'Diagnóstico do Sistema' },
    { to: '/dashboard/settings/logs', icon: ScrollText, label: 'Logs do Sistema' },
  ];

  const filteredItems = menuItems.filter(item => !item.permission || can(item.permission));

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 pb-6">
      
      {/* Sidebar Menu */}
      <div className="w-full md:w-72 flex-shrink-0">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-full overflow-y-auto">
          <div className="flex items-center gap-3 px-4 py-4 mb-4 border-b border-slate-800">
            <div className="bg-federal-600 p-2 rounded-lg">
              <Settings className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Painel Admin</h2>
              <p className="text-xs text-slate-500 mt-1">Configurações Gerais</p>
            </div>
          </div>

          <nav className="space-y-1">
            {filteredItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive 
                    ? "bg-federal-600 text-white shadow-lg shadow-federal-900/50" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsLayout;
