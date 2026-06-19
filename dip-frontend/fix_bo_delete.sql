-- Script para consertar exclusão de BO e adicionar coluna tipo_crime

-- 1. Adicionar coluna tipo_crime se não existir
ALTER TABLE public.boletins ADD COLUMN IF NOT EXISTS tipo_crime TEXT;

-- 2. Adicionar política para excluir BOs
DROP POLICY IF EXISTS "Usuarios autenticados podem excluir BOs" ON public.boletins;
CREATE POLICY "Usuarios autenticados podem excluir BOs" ON public.boletins 
  FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Atualizar política de UPDATE para todos os usuários (opcional, mais flexível)
DROP POLICY IF EXISTS "Usuarios podem editar seus proprios BOs" ON public.boletins;
CREATE POLICY "Usuarios autenticados podem editar BOs" ON public.boletins 
  FOR UPDATE USING (auth.role() = 'authenticated');
