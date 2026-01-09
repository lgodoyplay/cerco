import React, { useState } from 'react';
import { Database, Download, Upload, RefreshCw, AlertOctagon, CheckCircle, Loader } from 'lucide-react';
import { useSettings } from '../../../hooks/useSettings';

const BackupSettings = () => {
  const { logAction } = useSettings();
  const [status, setStatus] = useState({ type: null, message: null });
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = (action, message) => {
    setIsLoading(true);
    setStatus({ type: null, message: null });

    setTimeout(() => {
      setIsLoading(false);
      setStatus({ type: 'success', message: message });
      logAction(`Ação de sistema executada: ${action}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatus({ type: null, message: null }), 3000);
    }, 1500);
  };

  const handleExport = () => handleAction('Exportação de Dados', 'Backup realizado com sucesso. O download iniciará em breve.');
  const handleImport = () => handleAction('Importação de Dados', 'Dados importados com sucesso. O sistema foi atualizado.');
  
  const handleReset = () => {
    if (window.confirm('ATENÇÃO: Esta ação apagará TODOS os dados do sistema e restaurará as configurações de fábrica. Tem certeza?')) {
      handleAction('Reset de Sistema', 'Sistema restaurado para os padrões de fábrica.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="text-federal-500" size={28} />
          Backup & Dados
        </h2>
        <p className="text-slate-400 mt-1">Gerencie a exportação, importação e integridade dos dados do sistema.</p>
      </div>

      <div className="grid gap-6">
        {/* Export/Import */}
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Gerenciamento de Dados</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-federal-500/50 transition-colors group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-federal-500/10 text-federal-500 rounded-lg group-hover:bg-federal-500 group-hover:text-white transition-colors">
                  <Download size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white">Exportar Backup</h4>
                  <p className="text-sm text-slate-400">Baixar cópia completa do banco de dados (JSON/SQL)</p>
                </div>
              </div>
              <button 
                onClick={handleExport}
                disabled={isLoading}
                className="w-full py-2 bg-slate-800 hover:bg-federal-600 text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Processando...' : 'Iniciar Exportação'}
              </button>
            </div>

            <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-federal-500/50 transition-colors group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Upload size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white">Importar Dados</h4>
                  <p className="text-sm text-slate-400">Restaurar sistema a partir de um arquivo de backup</p>
                </div>
              </div>
              <button 
                onClick={handleImport}
                disabled={isLoading}
                className="w-full py-2 bg-slate-800 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Processando...' : 'Selecionar Arquivo'}
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-950/10 border border-red-900/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4 text-red-500">
            <AlertOctagon size={24} />
            <h3 className="text-lg font-bold">Zona de Perigo</h3>
          </div>
          
          <div className="flex items-center justify-between p-6 bg-red-950/20 rounded-xl border border-red-900/20">
            <div>
              <h4 className="font-bold text-white">Resetar Sistema</h4>
              <p className="text-sm text-red-300/70">
                Apaga todos os registros, usuários e configurações. Esta ação é irreversível.
              </p>
            </div>
            <button 
              onClick={handleReset}
              disabled={isLoading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-red-900/20"
            >
              Resetar Tudo
            </button>
          </div>
        </section>

        {/* Status Message */}
        {status.message && (
          <div className={`fixed bottom-8 right-8 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up ${
            status.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
          }`}>
            {status.type === 'success' ? <CheckCircle size={24} /> : <Loader className="animate-spin" size={24} />}
            <span className="font-medium">{status.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupSettings;
