-- SCRIPT PARA CORREÇÃO DE AVISOS DE SEGURANÇA DO SUPABASE
-- Execute este script no SQL Editor do Supabase.

-- ==============================================================================
-- 1. CORREÇÃO DE FUNÇÕES (SEARCH_PATH MUTÁVEL)
-- Adiciona 'SET search_path = ''' para prevenir sequestro de funções.
-- ==============================================================================

-- 1.1 admin_update_user_email
CREATE OR REPLACE FUNCTION public.admin_update_user_email(target_user_id uuid, new_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verifica se quem chama é admin/diretor
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Instrutor')
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE auth.users
  SET email = new_email,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      email_change = '',
      email_change_token_new = '',
      email_change_confirm_status = 0
  WHERE id = target_user_id;
END;
$$;

-- 1.2 reset_system_data
CREATE OR REPLACE FUNCTION public.reset_system_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Tentativa de limpeza em massa
  BEGIN
    TRUNCATE TABLE
      public.license_attachments,
      public.weapon_licenses,
      public.logistics_custody,
      public.logistics_requisitions,
      public.financial_assets,
      public.financial_records,
      public.prf_photos,
      public.prf_seizures,
      public.prf_fines,
      public.hearings,
      public.release_orders,
      public.petitions,
      public.provas,
      public.cursos_policiais,
      public.investigacoes,
      public.prisoes,
      public.procurados,
      public.boletins,
      public.candidatos,
      public.cursos,
      public.denuncias,
      public.notifications,
      public.system_logs,
      public.system_settings
    CASCADE;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback para deleção individual
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

-- 1.3 get_officer_by_code
CREATE OR REPLACE FUNCTION public.get_officer_by_code(p_code TEXT)
RETURNS TABLE (full_name TEXT, role TEXT, codigo_funcional TEXT, avatar_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT p.full_name, p.role, p.codigo_funcional, p.avatar_url
  FROM public.profiles p
  WHERE p.codigo_funcional = p_code;
END;
$$;

-- 1.4 handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 2. CORREÇÃO DE POLÍTICAS (RLS PERMISSIVA)
-- Substitui policies 'USING (true)' por regras baseadas em roles.
-- ==============================================================================

-- 2.1 Cursos
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cursos access" ON public.cursos;

-- Leitura: Todos autenticados podem ver cursos
CREATE POLICY "Cursos - Leitura" ON public.cursos
FOR SELECT TO authenticated USING (true);

-- Escrita: Apenas Admins/Diretores/Instrutores podem gerenciar cursos
CREATE POLICY "Cursos - Gerenciamento" ON public.cursos
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Instrutor')
  )
);

-- 2.2 Cursos Policiais (Vinculação)
ALTER TABLE public.cursos_policiais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cursos policiais access" ON public.cursos_policiais;

-- Leitura: O próprio policial ou Admins podem ver
CREATE POLICY "Cursos Policiais - Leitura" ON public.cursos_policiais
FOR SELECT TO authenticated
USING (
  policial_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Instrutor')
  )
);

-- Escrita: Apenas Admins/Diretores/Instrutores podem atribuir cursos
CREATE POLICY "Cursos Policiais - Gerenciamento" ON public.cursos_policiais
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Instrutor')
  )
);

-- 2.3 Candidatos (Formulário Faça Parte)
-- Garante que a tabela existe
CREATE TABLE IF NOT EXISTS public.candidatos (
  id bigint generated by default as identity primary key,
  nome text not null,
  email text,
  telefone text,
  mensagem text,
  status text default 'Pendente',
  created_at timestamp with time zone default now()
);

ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DROP POLICY IF EXISTS "Candidatos policy" ON public.candidatos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.candidatos;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.candidatos;

-- INSERT: Permitir anônimos (public) e autenticados
CREATE POLICY "Candidatos - Cadastro Público" ON public.candidatos
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- SELECT/UPDATE: Apenas Admins/Diretores
CREATE POLICY "Candidatos - Acesso Administrativo" ON public.candidatos
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Recrutador')
  )
);
