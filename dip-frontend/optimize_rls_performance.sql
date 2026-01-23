-- SCRIPT DE OTIMIZAÇÃO DE PERFORMANCE RLS
-- Resolve o aviso: "Admins can update any profile that re-evaluates current_setting() or auth.<function>() for each row"
-- A solução é envolver chamadas de função auth em (SELECT ...), permitindo que o Postgres faça cache do resultado por transação/query.

-- ==============================================================================
-- 1. PROFILES: Otimizar política de Admin
-- ==============================================================================

-- Remove a política antiga (que causa o aviso)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Recria com otimização (SELECT auth.uid())
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) -- OTIMIZADO
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Instrutor')
  )
);

-- ==============================================================================
-- 2. OUTRAS TABELAS: Aplicar mesma otimização preventivamente
-- ==============================================================================

-- 2.1 Cursos
DROP POLICY IF EXISTS "Cursos - Gerenciamento" ON public.cursos;
CREATE POLICY "Cursos - Gerenciamento" ON public.cursos
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) -- OTIMIZADO
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Instrutor')
  )
);

-- 2.2 Cursos Policiais
DROP POLICY IF EXISTS "Cursos Policiais - Leitura" ON public.cursos_policiais;
CREATE POLICY "Cursos Policiais - Leitura" ON public.cursos_policiais
FOR SELECT TO authenticated
USING (
  policial_id = (SELECT auth.uid()) OR -- OTIMIZADO
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) -- OTIMIZADO
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Instrutor')
  )
);

DROP POLICY IF EXISTS "Cursos Policiais - Gerenciamento" ON public.cursos_policiais;
CREATE POLICY "Cursos Policiais - Gerenciamento" ON public.cursos_policiais
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) -- OTIMIZADO
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Instrutor')
  )
);

-- 2.3 Candidatos
DROP POLICY IF EXISTS "Candidatos - Acesso Administrativo" ON public.candidatos;
CREATE POLICY "Candidatos - Acesso Administrativo" ON public.candidatos
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) -- OTIMIZADO
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Recrutador')
  )
);
