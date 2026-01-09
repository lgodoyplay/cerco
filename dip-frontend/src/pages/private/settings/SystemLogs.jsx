import React from 'react';
import { Scroll, Search, Download, Trash2, Clock, User } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';

const SystemLogs = () => {
  const { logs } = useSettings();

  const handleExport = () => {
    const content = JSON.stringify(logs, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Scroll className="text-federal-500" size={28} />
            Logs do Sistema
          </h2>
          <p className="text-slate-400 mt-1">Registro de auditoria de todas as ações administrativas.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <Download size={18} />
            Exportar Logs
          </button>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar nos logs..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-federal-500"
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Scroll size={48} className="mb-4 opacity-50" />
              <p>Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-900/50 transition-colors flex items-start gap-4">
                  <div className="mt-1 p-2 bg-slate-900 rounded-lg text-federal-400">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white text-sm">{log.action}</h4>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <User size={12} />
                      <span>Usuário: <span className="text-federal-300">{log.user}</span></span>
                      <span>•</span>
                      <span className="font-mono text-slate-600">ID: {log.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border-t border-slate-800 p-3 text-xs text-slate-500 text-center">
          Exibindo {logs.length} registros
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
