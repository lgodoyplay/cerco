-- 1. Ensure system_settings table exists
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

-- Allow write access to authenticated users
DROP POLICY IF EXISTS "Settings editable by authenticated users" ON public.system_settings;
CREATE POLICY "Settings editable by authenticated users" ON public.system_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Create 'avatars' bucket for logo upload if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policies for 'avatars'
-- Allow public access to view files
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
CREATE POLICY "Public Access Avatars" ON storage.objects
FOR SELECT USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
CREATE POLICY "Authenticated Upload Avatars" ON storage.objects
FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 6. Insert default appearance settings if not exists
INSERT INTO public.system_settings (key, value)
VALUES (
  'appearance', 
  '{"theme": "dark", "primaryColor": "blue", "compactMode": false, "logoUrl": null}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
