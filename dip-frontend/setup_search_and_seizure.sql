
-- Script de setup para Busca e Apreensão
-- Execute este script no SQL Editor do Supabase

-- Garantir que a extensão uuid-ossp está ativada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


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
-- Adicionar coluna para BO relacionado à prisão
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS bo_id UUID REFERENCES public.boletins(id);

-- Adicionar coluna para BO relacionado à procurado
ALTER TABLE public.procurados ADD COLUMN IF NOT EXISTS bo_id UUID REFERENCES public.boletins(id);

-- Adicionar colunas para policial responsável pela prisão em flagrante
ALTER TABLE public.boletins ADD COLUMN IF NOT EXISTS nome_policial_prisao TEXT;
ALTER TABLE public.boletins ADD COLUMN IF NOT EXISTS id_policial_prisao TEXT;

-- Criação da tabela de crimes
CREATE TABLE IF NOT EXISTS public.crimes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    article TEXT NOT NULL,
    name TEXT NOT NULL,
    penalty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.crimes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para crimes
DROP POLICY IF EXISTS "Crimes access" ON public.crimes;
CREATE POLICY "Crimes access" ON public.crimes FOR ALL TO authenticated USING (true);

-- Inserir todos os crimes fornecidos (sem duplicatas e ordenados)
INSERT INTO public.crimes (article, name, penalty) VALUES
('4', 'Vandalismo', '10 meses e multa de $10.000'),
('7', 'Resistência à Prisão', '10 meses e multa de $20.000'),
('8', 'Tentativa de Fuga', '10 meses e multa de $10.000'),
('9', 'Ameaça', '15 meses e multa de $20.000'),
('10', 'Lesão Corporal', '15 meses e multa de $30.000'),
('11', 'Desacato à Servidor Público', '15 meses e multa de $20.000'),
('12', 'Desobediência à Ordem Policial', '15 meses e multa de $20.000'),
('13', 'Tentativa de Suborno', '15 meses e multa de $10.000'),
('14', 'Falso Testemunho', '15 meses e multa de $20.000'),
('15', 'Falsidade Ideológica', '15 meses e multa de $20.000'),
('16', 'Obstrução de Justiça', '15 meses e multa de $20.000'),
('17', 'Omissão de Socorro', '15 meses e multa de $20.000'),
('18', 'Organização Criminosa', '40 meses e multa de $40.000'),
('19', 'Sequestro', '30 meses e multa de $30.000'),
('20', 'Lavagem de Dinheiro', '50 meses e multa de $50.000'),
('21', 'Tentativa de Homicídio', '100 meses e multa de $100.000'),
('22', 'Tentativa de Homicídio à Servidor', '100 meses e multa de $100.000'),
('23', 'Homicídio Culposo (Não há Intenção de Matar)', '100 meses e multa de $150.000'),
('24', 'Homicídio Doloso (Há Intenção de Matar)', '120 meses e multa de $200.000'),
('25', 'Homicídio Doloso à Servidor', '120 meses e multa de $200.000'),
('55', 'Dinheiro Sujo (10 Mil à 200 Mil)', '50 a 100 meses'),
('56', 'Formação de Quadrilha', '50 meses e multa de $50.000'),
('57', 'Porte Ilegal de Arma Leve (Pistola)', '30 meses e multa de $50.000'),
('58', 'Porte Ilegal de Arma Média (Submetralhadoras/Espingardas)', '80 meses e multa de $100.000'),
('59', 'Porte Ilegal de Arma Pesada (Fuzis)', '100 meses e multa de $150.000'),
('60', 'Porte Ilegal de Material Explosivo', '80 meses e multa de $200.000'),
('61', 'Posse de Colete Balístico, LockPick e Placa', '50 meses e multa de $50.000'),
('62', 'Tráfico de Drogas (101 à 200)', '30 a 80 meses'),
('65', 'Tráfico de Armas (101 à 200)', '30 a 80 meses')
ON CONFLICT DO NOTHING;

-- Criação da tabela de lives
CREATE TABLE IF NOT EXISTS public.live_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    links TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lives
DROP POLICY IF EXISTS "Live streams access" ON public.live_streams;
CREATE POLICY "Live streams access" ON public.live_streams FOR ALL TO authenticated USING (true);
-- Allow public to read live streams
DROP POLICY IF EXISTS "Live streams public read" ON public.live_streams;
CREATE POLICY "Live streams public read" ON public.live_streams FOR SELECT USING (true);

-- Adicionar tabela de denúncias da corregedoria
CREATE TABLE IF NOT EXISTS public.corregedoria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT,
    detalhes TEXT NOT NULL,
    arquivos TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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