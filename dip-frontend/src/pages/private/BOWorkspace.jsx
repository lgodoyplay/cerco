import { useMemo, useState } from 'react';
import { Plus, Search, FileText, ListChecks } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import RegisterBO from './RegisterBO';
import BOList from './BOList';
import { usePermissions } from '../../hooks/usePermissions';

const BOWorkspace = ({ variant = 'default' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermissions();
  const canManage = can('bo_manage');
  const canView = can('bo_view');
  const isInternal = variant === 'internal';
  const title = isInternal ? 'Boletim Interno' : 'Boletim de Ocorrência';
  const description = isInternal
    ? 'Registre e consulte boletins internos em um módulo independente.'
    : 'Registre e consulte boletins em um único módulo.';

  const initialTab = useMemo(() => {
    if (location.search.includes('tab=list') || location.pathname.includes('/bo-list')) return 'list';
    return 'register';
  }, [location.pathname, location.search]);

  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    const search = nextTab === 'list' ? '?tab=list' : '';
    navigate(`${location.pathname}${search}`, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-emerald-500" size={28} />
            {title}
          </h2>
          <p className="text-slate-400 mt-1">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2">
        {canManage && (
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'register'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Plus size={16} />
            Registro
          </button>
        )}

        {canView && (
          <button
            type="button"
            onClick={() => handleTabChange('list')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Search size={16} />
            Consulta
          </button>
        )}
      </div>

      {activeTab === 'register' && canManage ? (
        <RegisterBO embedded variant={variant} />
      ) : null}

      {activeTab === 'list' && canView ? (
        <BOList embedded variant={variant} />
      ) : null}
    </div>
  );
};

export default BOWorkspace;
