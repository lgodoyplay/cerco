-- 1. Create system_settings table for storing dynamic roles and corporation settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policies for system_settings
-- Allow read access to all authenticated users
DROP POLICY IF EXISTS "Settings visible to authenticated users" ON public.system_settings;
CREATE POLICY "Settings visible to authenticated users" ON public.system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow write access to authenticated users (you might want to restrict this to admins later)
DROP POLICY IF EXISTS "Settings editable by authenticated users" ON public.system_settings;
CREATE POLICY "Settings editable by authenticated users" ON public.system_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Add permissions column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- 5. Allow admins (Diretor/Coordenador) to update any profile (including roles and permissions)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role ILIKE '%Diretor%' OR role ILIKE '%Coordenador%' OR role ILIKE '%Admin%')
    )
  );
