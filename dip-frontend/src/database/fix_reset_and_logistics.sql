-- 1. CORREÇÃO DA LOGÍSTICA (Erro 400 no Dashboard)
-- Recria as tabelas de logística apontando para 'profiles' em vez de 'auth.users'
-- Isso permite que o frontend busque o nome dos usuários corretamente.

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

-- Habilitar RLS e criar políticas
ALTER TABLE logistics_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_custody ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Logistics Requisitions All" ON logistics_requisitions;
CREATE POLICY "Logistics Requisitions All" ON logistics_requisitions FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Logistics Custody All" ON logistics_custody;
CREATE POLICY "Logistics Custody All" ON logistics_custody FOR ALL TO authenticated USING (true);


-- 2. CORREÇÃO DO RESET DE SISTEMA (Erro 400 no RPC)
-- Cria uma função robusta que limpa todas as tabelas corretamente

CREATE OR REPLACE FUNCTION reset_system_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Limpa tabelas operacionais usando TRUNCATE CASCADE
  -- Isso remove dados de tabelas dependentes automaticamente
  -- Envolvemos em um bloco BEGIN/EXCEPTION para evitar falhas se alguma tabela não existir
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
    -- Se falhar o TRUNCATE em massa (ex: tabela faltando), tenta deletar uma por uma
    DELETE FROM public.prisoes;
    DELETE FROM public.procurados;
    DELETE FROM public.boletins;
    DELETE FROM public.investigacoes;
    DELETE FROM public.candidatos;
    DELETE FROM public.cursos;
    DELETE FROM public.system_logs;
    DELETE FROM public.system_settings;
    DELETE FROM public.logistics_requisitions;
    DELETE FROM public.logistics_custody;
  END;
  
  -- Nota: Não deletamos usuários (auth.users) nem perfis (profiles) para manter o acesso
END;
$$;

GRANT EXECUTE ON FUNCTION reset_system_data() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_system_data() TO service_role;
