
-- SCRIPT PARA HABILITAR INVESTIGAÇÕES FINANCEIRAS
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna 'categoria' na tabela 'investigacoes'
ALTER TABLE public.investigacoes 
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'criminal';

-- 2. Atualizar registros existentes para 'criminal' (caso sejam nulos)
UPDATE public.investigacoes 
SET categoria = 'criminal' 
WHERE categoria IS NULL;

-- 3. Criar índice para performance em filtros por categoria
CREATE INDEX IF NOT EXISTS idx_investigacoes_categoria ON public.investigacoes(categoria);
