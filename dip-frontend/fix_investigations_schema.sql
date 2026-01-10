-- CORREÇÃO DE SCHEMA - INVESTIGAÇÕES E PROVAS
-- Execute este script no SQL Editor do Supabase para corrigir os erros de "Column not found"

-- 1. Adicionar colunas faltantes na tabela investigacoes
ALTER TABLE public.investigacoes 
ADD COLUMN IF NOT EXISTS envolvidos TEXT,
ADD COLUMN IF NOT EXISTS data_fim TIMESTAMP WITH TIME ZONE;

-- 2. Adicionar colunas faltantes na tabela provas
-- O erro anterior indicava falta da coluna 'url'
ALTER TABLE public.provas 
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- 3. Garantir permissões corretas (reforço)
GRANT ALL ON public.investigacoes TO authenticated;
GRANT ALL ON public.investigacoes TO service_role;
GRANT ALL ON public.provas TO authenticated;
GRANT ALL ON public.provas TO service_role;

-- 4. Atualizar policies para permitir update na coluna data_fim e envolvidos se necessário
-- (As policies existentes geralmente cobrem updates na linha toda, mas bom verificar se não há restrição de colunas)
