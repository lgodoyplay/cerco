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
    if (!canManage && canView) return 'list';
    return 'register';
  }, [canManage, canView, location.pathname, location.search]);

  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    const search = nextTab === 'list' ? '?tab=list' : '';
    navigate(`${location.pathname}${search}`, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Fluxo de BO
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.22)]">
                <FileText size={24} />
              </span>
              {title}
            </h2>
            <p className="text-slate-400 mt-2 max-w-2xl">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-2 shadow-[0_12px_28px_rgba(15,23,42,0.28)]">
        {canManage && (
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_10px_25px_rgba(16,185,129,0.28)]'
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
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-[0_10px_25px_rgba(37,99,235,0.2)]'
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
