-- SCRIPT DE CORREÇÃO COMPLETA DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase para corrigir todos os erros de Reset, Logística e Configurações.

-- 0. Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CORREÇÃO DA LOGÍSTICA (Recria tabelas com relacionamentos corretos)
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


-- 2. CRIAÇÃO DE TABELAS QUE PODEM ESTAR FALTANDO (Erro 404/400)

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

-- Tabela Cursos (se não existir)
CREATE TABLE IF NOT EXISTS public.cursos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cursos access" ON public.cursos;
CREATE POLICY "Cursos access" ON public.cursos FOR ALL TO authenticated USING (true);

-- Tabela Cursos Policiais (Vinculação)
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
-- Agora a função é capaz de lidar com erros e garantir a limpeza
CREATE OR REPLACE FUNCTION reset_system_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tentativa de limpeza em massa (mais rápida)
  BEGIN
    TRUNCATE TABLE
      license_attachments,
      weapon_licenses,
      logistics_custody,
      logistics_requisitions,
      financial_assets,
      financial_records,
      prf_photos,
      prf_seizures,
      prf_fines,
      hearings,
      release_orders,
      petitions,
      provas,
      cursos_policiais,
      investigacoes,
      prisoes,
      procurados,
      boletins,
      candidatos,
      cursos,
      denuncias,
      notifications,
      system_logs,
      system_settings
    CASCADE;
  EXCEPTION WHEN OTHERS THEN
    -- Se falhar (ex: alguma tabela não existe), tenta deletar individualmente
    -- Usamos blocos BEGIN/EXCEPTION individuais para garantir que uma falha não pare as outras
    BEGIN DELETE FROM public.license_attachments; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.weapon_licenses; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.logistics_custody; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.logistics_requisitions; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.financial_assets; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.financial_records; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.prf_photos; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.prf_seizures; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.prf_fines; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.hearings; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.release_orders; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.petitions; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.provas; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.cursos_policiais; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.investigacoes; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.prisoes; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.procurados; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.boletins; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.candidatos; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.cursos; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.denuncias; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.notifications; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.system_logs; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.system_settings; EXCEPTION WHEN OTHERS THEN NULL; END;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_system_data() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_system_data() TO service_role;
