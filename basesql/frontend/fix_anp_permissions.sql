-- SCRIPT DE CORREÇÃO DE PERMISSÕES ANP (Erro 403)
-- Este script corrige as políticas de segurança (RLS) da tabela user_anp_progress
-- para permitir que Diretores, Coordenadores e Instrutores (independente do nome exato do cargo)
-- possam gerenciar o progresso dos alunos.

-- 1. Habilitar RLS (garantia)
ALTER TABLE public.user_anp_progress ENABLE ROW LEVEL SECURITY;

-- 2. Remover política restritiva antiga
DROP POLICY IF EXISTS "Instrutores e Admins gerenciam progresso" ON public.user_anp_progress;
DROP POLICY IF EXISTS "Ver próprio progresso ou admin" ON public.user_anp_progress;

-- 3. Criar novas políticas mais flexíveis

-- Leitura: O próprio usuário pode ver seu progresso, OU qualquer superior (Diretor/Coord/Instrutor/Admin)
CREATE POLICY "Leitura de Progresso ANP" ON public.user_anp_progress
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      role ILIKE '%Diretor%' OR 
      role ILIKE '%Coordenador%' OR 
      role ILIKE '%Instrutor%' OR 
      role ILIKE '%Admin%' OR
      role = 'Corregedor'
    )
  )
);

-- Escrita (Insert/Update/Delete): Apenas superiores podem alterar
CREATE POLICY "Gerenciamento de Progresso ANP" ON public.user_anp_progress
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      role ILIKE '%Diretor%' OR 
      role ILIKE '%Coordenador%' OR 
      role ILIKE '%Instrutor%' OR 
      role ILIKE '%Admin%' OR
      role = 'Corregedor'
    )
  )
);

-- 4. Garantir que a tabela anp_stages seja visível
ALTER TABLE public.anp_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver etapas ANP" ON public.anp_stages;
CREATE POLICY "Todos podem ver etapas ANP" ON public.anp_stages
FOR SELECT TO authenticated
USING (true);

-- Permitir gestão de etapas (opcional, para admins)
DROP POLICY IF EXISTS "Gestão de etapas ANP" ON public.anp_stages;
CREATE POLICY "Gestão de etapas ANP" ON public.anp_stages
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      role ILIKE '%Diretor%' OR 
      role ILIKE '%Coordenador%' OR 
      role ILIKE '%Admin%'
    )
  )
);
