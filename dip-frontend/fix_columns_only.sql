-- SCRIPT DE CORREÇÃO SIMPLIFICADO
-- Execute este script no SQL Editor do Supabase para adicionar as colunas faltantes.
-- Este script NÃO tenta criar usuários, evitando erros de chave duplicada.

-- 1. Corrigir Tabela de Investigações (Adicionar colunas se não existirem)
ALTER TABLE public.investigacoes 
ADD COLUMN IF NOT EXISTS envolvidos TEXT;

ALTER TABLE public.investigacoes 
ADD COLUMN IF NOT EXISTS data_fim TIMESTAMP WITH TIME ZONE;

-- 2. Corrigir Tabela de Provas
ALTER TABLE public.provas 
ADD COLUMN IF NOT EXISTS url TEXT;

ALTER TABLE public.provas 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- 3. Corrigir Tabela de Perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS badge TEXT;

-- 4. Tentar criar vínculo entre Investigação e Perfil (para o futuro, se possível)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_investigacoes_profiles') THEN
        BEGIN
            ALTER TABLE public.investigacoes ADD CONSTRAINT fk_investigacoes_profiles FOREIGN KEY (created_by) REFERENCES public.profiles(id);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Aviso: Não foi possível criar FK fk_investigacoes_profiles. Isso é normal se houver dados antigos sem profile correspondente.';
        END;
    END IF;
END $$;

-- 5. Garantir Permissões Básicas
GRANT ALL ON public.investigacoes TO authenticated;
GRANT ALL ON public.investigacoes TO service_role;
GRANT ALL ON public.provas TO authenticated;
GRANT ALL ON public.provas TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
