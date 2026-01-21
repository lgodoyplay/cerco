-- Fix for financial_records table to ensure columns are nullable where appropriate or defaults are set
-- Run this in Supabase SQL Editor

ALTER TABLE public.financial_records 
ALTER COLUMN type SET NOT NULL,
ALTER COLUMN tax_status SET DEFAULT 'regular';

-- Ensure player_name can be null if type is PJ
ALTER TABLE public.financial_records 
ALTER COLUMN player_name DROP NOT NULL;

-- Ensure company_name and cnpj can be null if type is PF
ALTER TABLE public.financial_records 
ALTER COLUMN company_name DROP NOT NULL;

ALTER TABLE public.financial_records 
ALTER COLUMN cnpj DROP NOT NULL;

-- Verify Policies (ensure authenticated users can insert)
DROP POLICY IF EXISTS "Insercao de registros financeiros" ON public.financial_records;
CREATE POLICY "Insercao de registros financeiros" ON public.financial_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
