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
    'release_orders',
    'warnings',
    'news',
    'communication_room_members'
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
        // Use select('*') instead of 'id' because some tables (like system_settings) don't have an 'id' column
        // limit(1) ensures we don't fetch too much data
        const { error: tableError } = await supabase.from(table).select('*').limit(1);
        
        // Error code 42P01 is "undefined_table"
        // Error 404 can also happen if RLS blocks everything or table missing
        if (tableError && (tableError.code === '42P01' || tableError.message?.includes('does not exist') || tableError.code === '404')) {
          results.tables[table] = 'missing';
        } else if (tableError) {
           console.warn(`Health check error for ${table}:`, tableError);
           // If it's a 400 error, it might be a column issue, but usually implies table exists. 
           // We'll mark as OK if it's just a column permission thing, but 'error' otherwise.
           // Actually, for system_settings, select('*') should work if table exists.
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
    const sql = `-- SCRIPT DE CORREÇÃO COMPLETA DO BANCO DE DADOS (ATUALIZADO v7)
-- Execute este script no SQL Editor do Supabase para corrigir todos os erros.

-- 0. Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CORREÇÃO DA LOGÍSTICA
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

DROP TABLE IF EXISTS logistics_custody CASCADE;
CREATE TABLE logistics_custody (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  officer_id UUID REFERENCES public.profiles(id) NOT NULL,
  item_description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  category TEXT NOT NULL,
  case_reference TEXT,
  location TEXT,
  status TEXT DEFAULT 'in_custody',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE logistics_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_custody ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Logistics Requisitions All" ON logistics_requisitions;
CREATE POLICY "Logistics Requisitions All" ON logistics_requisitions FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Logistics Custody All" ON logistics_custody;
CREATE POLICY "Logistics Custody All" ON logistics_custody FOR ALL TO authenticated USING (true);

-- 2. CRIAÇÃO DE TABELAS FALTANTES

-- Warnings (Advertências)
CREATE TABLE IF NOT EXISTS public.warnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  details TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ
);
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Warnings access" ON public.warnings;
CREATE POLICY "Warnings access" ON public.warnings FOR ALL TO authenticated USING (true);

-- News (Notícias)
CREATE TABLE IF NOT EXISTS public.news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES public.profiles(id),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "News access" ON public.news;
CREATE POLICY "News access" ON public.news FOR ALL TO authenticated USING (true);

-- Communication Rooms
CREATE TABLE IF NOT EXISTS public.communication_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'voice',
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.communication_room_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.communication_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);
ALTER TABLE public.communication_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_room_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comm Rooms access" ON public.communication_rooms;
CREATE POLICY "Comm Rooms access" ON public.communication_rooms FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Comm Members access" ON public.communication_room_members;
CREATE POLICY "Comm Members access" ON public.communication_room_members FOR ALL TO authenticated USING (true);

-- Tabela Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- Tabela System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings access" ON public.system_settings;
CREATE POLICY "Settings access" ON public.system_settings FOR ALL TO authenticated USING (true);

-- Tabela System Logs
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Logs access" ON public.system_logs;
CREATE POLICY "Logs access" ON public.system_logs FOR ALL TO authenticated USING (true);

-- Tabela Cursos
CREATE TABLE IF NOT EXISTS public.cursos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cursos access" ON public.cursos;
CREATE POLICY "Cursos access" ON public.cursos FOR ALL TO authenticated USING (true);

-- Tabela Cursos Policiais
CREATE TABLE IF NOT EXISTS public.cursos_policiais (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    policial_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    atribuido_por UUID REFERENCES auth.users(id),
    certificado_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cursos_policiais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cursos policiais access" ON public.cursos_policiais;
CREATE POLICY "Cursos policiais access" ON public.cursos_policiais FOR ALL TO authenticated USING (true);

-- 3. CORREÇÃO DA FUNÇÃO DE RESET (RPC)
CREATE OR REPLACE FUNCTION reset_system_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    TRUNCATE TABLE
      license_attachments, weapon_licenses, logistics_custody, logistics_requisitions,
      financial_assets, financial_records, prf_photos, prf_seizures, prf_fines,
      hearings, release_orders, petitions, provas, cursos_policiais, investigacoes,
      prisoes, procurados, boletins, candidatos, cursos, denuncias, notifications,
      system_logs, system_settings, warnings, news
    CASCADE;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback para delete individual
    DELETE FROM public.license_attachments;
    DELETE FROM public.weapon_licenses;
    DELETE FROM public.logistics_custody;
    DELETE FROM public.logistics_requisitions;
    DELETE FROM public.financial_assets;
    DELETE FROM public.financial_records;
    DELETE FROM public.prf_photos;
    DELETE FROM public.prf_seizures;
    DELETE FROM public.prf_fines;
    DELETE FROM public.hearings;
    DELETE FROM public.release_orders;
    DELETE FROM public.petitions;
    DELETE FROM public.provas;
    DELETE FROM public.cursos_policiais;
    DELETE FROM public.investigacoes;
    DELETE FROM public.prisoes;
    DELETE FROM public.procurados;
    DELETE FROM public.boletins;
    DELETE FROM public.candidatos;
    DELETE FROM public.cursos;
    DELETE FROM public.denuncias;
    DELETE FROM public.notifications;
    DELETE FROM public.system_logs;
    DELETE FROM public.system_settings;
    DELETE FROM public.warnings;
    DELETE FROM public.news;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_system_data() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_system_data() TO service_role;
`;
    
    navigator.clipboard.writeText(sql);
    alert('SQL COMPLETO copiado! Vá para o Supabase e execute para corrigir todos os problemas.');
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
