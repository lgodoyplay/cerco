-- Create system_settings table if not exists
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy for viewing settings (authenticated users)
DROP POLICY IF EXISTS "Allow view settings for authenticated users" ON system_settings;
CREATE POLICY "Allow view settings for authenticated users" 
ON system_settings FOR SELECT 
TO authenticated 
USING (true);

-- Policy for updating settings (authenticated users)
DROP POLICY IF EXISTS "Allow update settings for authenticated users" ON system_settings;
CREATE POLICY "Allow update settings for authenticated users" 
ON system_settings FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Insert default corporation settings if not exists
INSERT INTO system_settings (key, value)
VALUES (
  'corporation', 
  '{
    "departments": ["Departamento de Investigações", "DRE", "DELEFAZ"],
    "divisions": ["Narcóticos", "Homicídios", "Crimes Cibernéticos"],
    "sectors": ["Inteligência", "Operacional", "Administrativo"]
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Insert default roles if not exists
INSERT INTO system_settings (key, value)
VALUES (
  'roles',
  '[
    {"id": 1, "title": "Diretor Geral", "hierarchy": 1},
    {"id": 2, "title": "Coordenador", "hierarchy": 2},
    {"id": 3, "title": "Escrivão", "hierarchy": 3},
    {"id": 4, "title": "Agente", "hierarchy": 4}
  ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
