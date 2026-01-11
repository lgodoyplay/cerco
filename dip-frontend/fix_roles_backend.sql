-- Ensure system_settings table exists
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage settings (for now, to ensure it works)
DROP POLICY IF EXISTS "Manage settings" ON public.system_settings;
CREATE POLICY "Manage settings" ON public.system_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions just in case
GRANT ALL ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
