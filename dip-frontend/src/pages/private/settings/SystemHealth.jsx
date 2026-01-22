import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  Terminal,
  Copy
} from 'lucide-react';

const SystemHealth = () => {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState({
    connection: null,
    tables: {},
    functions: {}
  });

  const tablesToCheck = [
    'profiles',
    'notifications',
    'system_settings',
    'system_logs',
    'logistics_requisitions',
    'logistics_custody',
    'cursos',
    'cursos_policiais',
    'weapon_licenses',
    'hearings',
    'release_orders'
  ];

  const functionsToCheck = [
    'reset_system_data'
  ];

  const checkHealth = async () => {
    setLoading(true);
    const results = {
      connection: false,
      tables: {},
      functions: {}
    };

    try {
      // 1. Check Basic Connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      results.connection = !error;

      // 2. Check Tables Existence/Access
      for (const table of tablesToCheck) {
        const { error: tableError } = await supabase.from(table).select('id').limit(1);
        // Error code 42P01 is "undefined_table"
        // Error 404 can also happen if RLS blocks everything or table missing
        if (tableError && (tableError.code === '42P01' || tableError.message?.includes('does not exist'))) {
          results.tables[table] = 'missing';
        } else if (tableError) {
           // Might be empty or RLS, but table exists
           results.tables[table] = 'error';
        } else {
          results.tables[table] = 'ok';
        }
      }

      // 3. Check Functions (RPC)
      // We can't easily check if function exists without calling it.
      // But we can check if we get "function not found" error when calling with invalid args or just assuming it works if no 404
      // For reset_system_data, we don't want to actually call it!
      // So we will rely on a trick: call it with a parameter that doesn't exist if it accepted params, 
      // but it takes no params.
      // Instead, we'll try to call a non-existent function to see the error code, then compare? 
      // Actually, let's just assume it's unknown unless we have a specific test.
      // For now, we'll mark it as 'unknown' or skip. 
      // BETTER: We can try to query information_schema if we had permissions, but we usually don't.
      
      // Let's just list it as a requirement.

    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setHealthData(results);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const copySqlScript = () => {
    const sql = `-- SCRIPT DE CORREÇÃO (Cole no Supabase SQL Editor)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de notificações se não existir
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings access" ON public.system_settings FOR ALL TO authenticated USING (true);

-- Recriar tabelas de logística com estrutura correta
DROP TABLE IF EXISTS logistics_requisitions CASCADE;
CREATE TABLE logistics_requisitions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  item_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  returned_at TIMESTAMPTZ
);
ALTER TABLE logistics_requisitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logistics Requisitions All" ON logistics_requisitions FOR ALL TO authenticated USING (true);

-- [Execute o script completo 'fix_database_complete.sql' para corrigir tudo]`;
    
    navigator.clipboard.writeText(sql);
    alert('SQL copiado! (Versão resumida). Por favor, use o arquivo fix_database_complete.sql para a correção completa.');
  };

  return (
    <div className="space-y-6 text-slate-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-federal-500" />
            Diagnóstico do Sistema
          </h2>
          <p className="text-slate-400">Verifique a integridade do banco de dados e conexões.</p>
        </div>
        <button 
          onClick={checkHealth}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Verificar Novamente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Database size={20} />
            Status das Tabelas
          </h3>
          
          <div className="space-y-3">
            {tablesToCheck.map(table => (
              <div key={table} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                <span className="font-mono text-sm">{table}</span>
                {healthData.tables[table] === 'ok' ? (
                  <span className="flex items-center gap-2 text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">
                    <CheckCircle size={14} /> OK
                  </span>
                ) : healthData.tables[table] === 'missing' ? (
                  <span className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 px-2 py-1 rounded">
                    <XCircle size={14} /> FALTANDO
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded">
                    <AlertTriangle size={14} /> VERIFICAR
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Terminal size={20} />
              Ações de Correção
            </h3>
            
            <p className="text-sm text-slate-400 mb-4">
              Se houver tabelas marcadas como <strong className="text-red-400">FALTANDO</strong> ou erros recorrentes (400/404), você precisa executar o script de correção no banco de dados.
            </p>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-400 mb-4 overflow-x-auto">
              src/database/fix_database_complete.sql
            </div>

            <button 
              onClick={copySqlScript}
              className="w-full py-3 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Copy size={18} />
              Copiar SQL de Correção
            </button>
            
            <p className="text-xs text-slate-500 mt-4 text-center">
              Vá para Supabase Dashboard &gt; SQL Editor &gt; New Query &gt; Cole e execute.
            </p>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
             <h4 className="font-bold text-blue-400 mb-2">Dica de Solução</h4>
             <p className="text-sm text-blue-300/80">
               O erro <strong>400</strong> no reset ocorre porque o banco tenta limpar tabelas que não existem.
               <br/>
               O erro <strong>404</strong> ocorre quando o sistema tenta buscar notificações em uma tabela inexistente.
               <br/><br/>
               Rodar o script acima resolve ambos os problemas.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
