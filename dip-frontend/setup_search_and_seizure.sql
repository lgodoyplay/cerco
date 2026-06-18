
-- Script de setup para Busca e Apreensão
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna categoria na tabela investigacoes
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'criminal';

-- 2. Adicionar colunas específicas para busca e apreensão
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS tipo_entidade TEXT; -- 'organizacao' or 'pessoa'
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS nome_entidade TEXT;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS documento_pessoa TEXT;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS foto_rosto TEXT;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS documento_ordem TEXT;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS quantidade_casas INTEGER DEFAULT 0;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS quantidade_carros INTEGER DEFAULT 0;
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS nomes_carros TEXT[]; -- Array de nomes dos carros
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS casas JSONB DEFAULT '[]'::jsonb; -- Dados das casas (objetos, fotos)
ALTER TABLE public.investigacoes ADD COLUMN IF NOT EXISTS carros JSONB DEFAULT '[]'::jsonb; -- Dados dos carros (objetos, fotos)

-- Adicionar coluna para prisões conduzidas por outra polícia
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS conduzido_por_outra_policia BOOLEAN DEFAULT FALSE;

-- 3. Garantir que a categoria pode ser 'search_and_seizure'
-- Noop - já permite qualquer texto

-- 4. Criar bucket para busca_e_apreensao no Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('busca_e_apreensao', 'busca_e_apreensao', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Policies para o bucket
DROP POLICY IF EXISTS "Imagens de busca e apreensao são publicas" ON storage.objects;
CREATE POLICY "Imagens de busca e apreensao são publicas" ON storage.objects
FOR SELECT USING (bucket_id = 'busca_e_apreensao');

DROP POLICY IF EXISTS "Policiais podem fazer upload de busca e apreensao" ON storage.objects;
CREATE POLICY "Policiais podem fazer upload de busca e apreensao" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'busca_e_apreensao' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Policiais podem deletar fotos de busca e apreensao" ON storage.objects;
CREATE POLICY "Policiais podem deletar fotos de busca e apreensao" ON storage.objects
FOR DELETE USING (bucket_id = 'busca_e_apreensao' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Policiais podem atualizar fotos de busca e apreensao" ON storage.objects;
CREATE POLICY "Policiais podem atualizar fotos de busca e apreensao" ON storage.objects
FOR UPDATE USING (bucket_id = 'busca_e_apreensao' AND auth.uid() = owner);
