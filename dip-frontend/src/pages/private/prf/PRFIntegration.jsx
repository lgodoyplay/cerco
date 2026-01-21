import React, { useState } from 'react';
import { Car, FileText, History } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import SeizureForm from './SeizureForm';
import FineForm from './FineForm';
import SeizureList from './SeizureList';
import FineList from './FineList';

const PRFIntegration = () => {
  const { can } = usePermissions();
  const canManage = can('prf_manage');
  const [activeTab, setActiveTab] = useState(canManage ? 'seizure' : 'history'); // Default to history if no manage permission

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Car className="text-blue-500" />
            Integração PRF
          </h1>
          <p className="text-slate-400 mt-1">Gestão de Apreensões e Multas Rodoviárias</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-800 w-full md:w-fit">
        {canManage && (
          <>
            <button
              onClick={() => setActiveTab('seizure')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none justify-center ${
                activeTab === 'seizure'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Car size={18} />
              Apreensão
            </button>
            <button
              onClick={() => setActiveTab('fine')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none justify-center ${
                activeTab === 'fine'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText size={18} />
              Multas
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none justify-center ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History size={18} />
          Histórico
        </button>
      </div>

      {/* Content */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        {canManage && activeTab === 'seizure' && <SeizureForm onSuccess={() => setActiveTab('history')} />}
        {canManage && activeTab === 'fine' && <FineForm onSuccess={() => setActiveTab('history')} />}
        {activeTab === 'history' && (
          <div className="space-y-8">
            <SeizureList />
            <div className="border-t border-slate-800 my-8" />
            <FineList />
          </div>
        )}
      </div>
    </div>
  );
};

export default PRFIntegration;
