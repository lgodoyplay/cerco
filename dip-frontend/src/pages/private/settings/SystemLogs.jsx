import React, { useState, useEffect } from 'react';
import { Scroll, Search, Download, Clock, FileText, ShieldAlert, TriangleAlert, User, CheckCircle2 } from 'lucide-react';
import { useSettingsContext } from '../../../context/SettingsContext';

const SystemLogs = () => {
  const { logs, markLogsAsRead } = useSettingsContext();
  const [searchTerm, setSearchTerm] = useState('');

  // Marcar logs como lidos quando a página for acessada
  useEffect(() => {
    markLogsAsRead();
  }, [markLogsAsRead]);

  const getActionIcon = (action) => {
    if (action.includes('CREATE') || action.includes('REGISTRAR')) {
      return <FileText className="text-emerald-400" />;
    }
    if (action.includes('DELETE') || action.includes('REMOVER')) {
      return <ShieldAlert className="text-red-400" />;
    }
    if (action.includes('UPDATE') || action.includes('EDITAR')) {
      return <TriangleAlert className="text-slate-400" />;
    }
    if (action.includes('LOGIN')) {
      return <User className="text-blue-400" />;
    }
    return <CheckCircle2 className="text-federal-400" />;
  };

  const getActionBg = (action) => {
    if (action.includes('CREATE') || action.includes('REGISTRAR')) {
      return 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/20';
    }
    if (action.includes('DELETE') || action.includes('REMOVER')) {
      return 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/20';
    }
    if (action.includes('UPDATE') || action.includes('EDITAR')) {
      return 'bg-gradient-to-br from-slate-500/20 to-slate-600/10 border-slate-500/20';
    }
    return 'bg-gradient-to-br from-federal-500/20 to-federal-600/10 border-federal-500/20';
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  const filteredLogs = logs.filter(log => 
    (log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Data', 'Ação', 'Usuário', 'Tabela', 'Registro ID'].join(','),
      ...filteredLogs.map(log => [
        log.id,
        log.created_at,
        `"${log.action?.replace(/"/g, '""')}"`,
        `"${log.user_name?.replace(/"/g, '""')}"`,
        log.table_name,
        log.record_id
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Scroll className="text-federal-500" size={28} />
            Atividade Recente
          </h2>
          <p className="text-slate-400 mt-1">Registro de auditoria de todas as ações.</p>
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

      <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-federal-500 to-federal-700 rounded-xl">
              <Clock className="text-white" size={20} />
            </div>
            <h3 className="font-bold text-lg md:text-xl text-white">Atividade Recente</h3>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar nos logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-federal-500"
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Scroll size={48} className="mb-4 opacity-50" />
              <p>Nenhum registro encontrado</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div 
                key={log.id} 
                className={`flex items-start gap-4 p-4 md:p-5 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-federal-500/40 hover:bg-slate-900/60 transition-all duration-300 animate-in slide-in-from-left-4 ${!log.is_read ? 'bg-federal-900/20 border-federal-800/30' : ''}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={`mt-0.5 p-3 rounded-xl flex-shrink-0 border ${getActionBg(log.action)}`}>
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm md:text-base font-bold text-slate-200 truncate pr-2">
                      {log.action?.replace('CREATE_', 'Criado: ').replace('UPDATE_', 'Atualizado: ').replace('DELETE_', 'Removido: ')}
                      {log.table_name && ` (${log.table_name})`}
                    </h4>
                    <span className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-full">
                      <Clock size={10} />
                      {formatTimeAgo(log.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                    {log.new_data && Object.keys(log.new_data).length > 0 
                      ? `Dados: ${JSON.stringify(log.new_data).substring(0, 150)}...`
                      : log.action}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-3 font-semibold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    Por: {log.user_name}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 text-xs text-slate-500 text-center">
          Exibindo {filteredLogs.length} de {logs.length} registros
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
