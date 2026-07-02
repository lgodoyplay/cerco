-- Atualizações para o Sistema do Judiciário e Receita Federal

-- 1. Tabela de Audiências
CREATE TABLE IF NOT EXISTS hearings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date_time TIMESTAMPTZ NOT NULL,
  target_name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'custody', 'instruction', 'judgment', 'other'
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'concluded', 'cancelled'
  notes TEXT,
  judge_id UUID REFERENCES auth.users(id),
  judge_name TEXT
);

-- 2. Tabela de Alvarás de Soltura
CREATE TABLE IF NOT EXISTS release_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  prisoner_name TEXT NOT NULL,
  prisoner_id TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'executed'
  judge_id UUID REFERENCES auth.users(id),
  judge_name TEXT,
  document_url TEXT
);

-- 3. Atualizações na Tabela de Registros Financeiros (Receita)
-- Adicionar colunas para suporte a CNPJ e tipo de pessoa
ALTER TABLE financial_records 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'PF', -- 'PF' (Pessoa Física) ou 'PJ' (Pessoa Jurídica)
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS tax_status TEXT DEFAULT 'regular'; -- 'regular', 'irregular', 'pending'

-- Habilitar RLS (Row Level Security) para as novas tabelas (Exemplo básico)
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_orders ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Simplificadas para permitir leitura/escrita autenticada)
CREATE POLICY "Enable read access for authenticated users" ON hearings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON hearings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON hearings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON release_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON release_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON release_orders FOR UPDATE TO authenticated USING (true);
