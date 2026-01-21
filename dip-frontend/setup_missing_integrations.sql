
-- SCRIPT DE CORREÇÃO DE INTEGRAÇÕES (PRF E FINANCEIRO)
-- Execute este script no SQL Editor do Supabase para criar as tabelas faltantes.

-- ==============================================================================
-- 1. INTEGRAÇÃO PRF (POLÍCIA RODOVIÁRIA FEDERAL)
-- ==============================================================================

-- Tabela de Multas (prf_fines)
CREATE TABLE IF NOT EXISTS public.prf_fines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  officer_id UUID REFERENCES auth.users(id),
  officer_name TEXT,
  vehicle_plate TEXT NOT NULL,
  vehicle_model TEXT,
  driver_name TEXT,
  driver_passport TEXT,
  violation_type TEXT,
  fine_amount DECIMAL(10, 2),
  location TEXT,
  notes TEXT
);

-- Tabela de Apreensões (prf_seizures)
CREATE TABLE IF NOT EXISTS public.prf_seizures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  officer_id UUID REFERENCES auth.users(id),
  officer_name TEXT,
  vehicle_model TEXT,
  vehicle_plate TEXT,
  vehicle_color TEXT,
  reason TEXT,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Apreendido'
);

-- Tabela de Fotos da PRF (prf_photos)
-- Esta tabela serve tanto para multas quanto para apreensões
CREATE TABLE IF NOT EXISTS public.prf_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  fine_id UUID REFERENCES public.prf_fines(id) ON DELETE CASCADE,
  seizure_id UUID REFERENCES public.prf_seizures(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT -- 'evidence', 'vehicle_condition', etc.
);

-- Habilitar RLS para tabelas PRF
ALTER TABLE public.prf_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prf_seizures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prf_photos ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso PRF
-- Leitura: Permitir para usuários autenticados (policiais)
CREATE POLICY "Leitura de multas para autenticados" ON public.prf_fines FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de apreensoes para autenticados" ON public.prf_seizures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de fotos prf para autenticados" ON public.prf_photos FOR SELECT USING (auth.role() = 'authenticated');

-- Inserção: Permitir para usuários autenticados
CREATE POLICY "Insercao de multas para autenticados" ON public.prf_fines FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Insercao de apreensoes para autenticados" ON public.prf_seizures FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Insercao de fotos prf para autenticados" ON public.prf_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==============================================================================
-- 2. INTEGRAÇÃO FINANCEIRA (REVENUE)
-- ==============================================================================

-- Tabela de Registros Financeiros (financial_records)
CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  type TEXT CHECK (type IN ('PF', 'PJ')), -- Pessoa Física ou Jurídica
  player_name TEXT,
  company_name TEXT,
  cnpj TEXT,
  tax_status TEXT DEFAULT 'regular',
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de Ativos Financeiros (financial_assets)
CREATE TABLE IF NOT EXISTS public.financial_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  record_id UUID REFERENCES public.financial_records(id) ON DELETE CASCADE,
  asset_type TEXT, -- 'property', 'vehicle', 'bank_account', etc.
  description TEXT,
  value DECIMAL(15, 2) DEFAULT 0,
  is_declared BOOLEAN DEFAULT true
);

-- Habilitar RLS para tabelas financeiras
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_assets ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Financeiro
-- Leitura
CREATE POLICY "Leitura de registros financeiros" ON public.financial_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de ativos financeiros" ON public.financial_assets FOR SELECT USING (auth.role() = 'authenticated');

-- Inserção
CREATE POLICY "Insercao de registros financeiros" ON public.financial_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Insercao de ativos financeiros" ON public.financial_assets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Atualização
CREATE POLICY "Atualizacao de registros financeiros" ON public.financial_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Atualizacao de ativos financeiros" ON public.financial_assets FOR UPDATE USING (auth.role() = 'authenticated');

-- ==============================================================================
-- 3. INTEGRAÇÃO JUDICIÁRIA (PETITIONS & HEARINGS)
-- ==============================================================================

-- Tabela de Petições (petitions)
CREATE TABLE IF NOT EXISTS public.petitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  type TEXT NOT NULL,
  client_name TEXT NOT NULL,
  content TEXT NOT NULL,
  lawyer_id UUID REFERENCES auth.users(id),
  lawyer_name TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela de Audiências (hearings)
CREATE TABLE IF NOT EXISTS public.hearings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  case_number TEXT NOT NULL,
  target_name TEXT NOT NULL,
  type TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  judge_name TEXT
);

-- Tabela de Alvarás de Soltura (release_orders)
CREATE TABLE IF NOT EXISTS public.release_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  prisoner_name TEXT NOT NULL,
  prisoner_passport TEXT,
  case_number TEXT NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  status TEXT DEFAULT 'pending',
  judge_name TEXT,
  details TEXT
);

-- Habilitar RLS para tabelas judiciárias
ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_orders ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Simplificadas para autenticados)
CREATE POLICY "Acesso total a peticoes" ON public.petitions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total a audiencias" ON public.hearings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total a alvaras" ON public.release_orders FOR ALL USING (auth.role() = 'authenticated');
