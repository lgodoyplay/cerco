import React, { useState } from 'react';
import { 
  Package, 
  Box, 
  Shield, 
  ClipboardList 
} from 'lucide-react';
import RequisitionPanel from './RequisitionPanel';
import CustodyPanel from './CustodyPanel';

const LogisticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('requisition');

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 pt-8 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-federal-600/20 border border-federal-500/30 flex items-center justify-center">
              <ClipboardList className="text-federal-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Logística e Custódia</h1>
              <p className="text-slate-400 text-sm">Gerenciamento de arsenal e apreensões</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-950/50 p-1 rounded-xl w-fit border border-slate-800/50">
            <button
              onClick={() => setActiveTab('requisition')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'requisition'
                  ? 'bg-federal-600 text-white shadow-lg shadow-federal-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Package size={18} />
              Requisição de Equipamentos
            </button>
            <button
              onClick={() => setActiveTab('custody')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'custody'
                  ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Box size={18} />
              Custódia de Bens
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'requisition' ? <RequisitionPanel /> : <CustodyPanel />}
      </div>
    </div>
  );
};

export default LogisticsDashboard;
