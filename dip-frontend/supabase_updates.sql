-- Create hearings table
CREATE TABLE IF NOT EXISTS hearings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_number TEXT NOT NULL,
  target_name TEXT NOT NULL,
  type TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  judge_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create release_orders table
CREATE TABLE IF NOT EXISTS release_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prisoner_name TEXT NOT NULL,
  prisoner_passport TEXT,
  case_number TEXT NOT NULL,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  judge_name TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to financial_records if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_records' AND column_name = 'type') THEN
        ALTER TABLE financial_records ADD COLUMN type TEXT DEFAULT 'PF';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_records' AND column_name = 'company_name') THEN
        ALTER TABLE financial_records ADD COLUMN company_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_records' AND column_name = 'cnpj') THEN
        ALTER TABLE financial_records ADD COLUMN cnpj TEXT;
    END IF;
END $$;
