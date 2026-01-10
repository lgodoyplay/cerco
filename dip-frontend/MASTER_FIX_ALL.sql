-- MASTER FIX SCRIPT
-- Run this ENTIRE script in Supabase SQL Editor to fix all issues.

-- 1. Create Storage Buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public) VALUES ('provas', 'provas', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('procurados', 'procurados', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('prisoes', 'prisoes', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies (Allow public read, authenticated upload)
DO $$
BEGIN
    -- Provas
    DROP POLICY IF EXISTS "Public Access Provas" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload Provas" ON storage.objects;
    CREATE POLICY "Public Access Provas" ON storage.objects FOR SELECT USING ( bucket_id = 'provas' );
    CREATE POLICY "Authenticated Upload Provas" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'provas' AND auth.role() = 'authenticated' );

    -- Procurados
    DROP POLICY IF EXISTS "Public Access Procurados" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload Procurados" ON storage.objects;
    CREATE POLICY "Public Access Procurados" ON storage.objects FOR SELECT USING ( bucket_id = 'procurados' );
    CREATE POLICY "Authenticated Upload Procurados" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'procurados' AND auth.role() = 'authenticated' );

    -- Prisoes
    DROP POLICY IF EXISTS "Public Access Prisoes" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload Prisoes" ON storage.objects;
    CREATE POLICY "Public Access Prisoes" ON storage.objects FOR SELECT USING ( bucket_id = 'prisoes' );
    CREATE POLICY "Authenticated Upload Prisoes" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'prisoes' AND auth.role() = 'authenticated' );
    
    -- Avatars
    DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
    CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
    CREATE POLICY "Authenticated Upload Avatars" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
END $$;

-- 3. Fix 'provas' table (add uploaded_by if missing)
ALTER TABLE public.provas ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- 4. Fix 'provas' RLS policies
ALTER TABLE public.provas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated Insert Provas" ON public.provas;
CREATE POLICY "Authenticated Insert Provas" ON public.provas FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public Select Provas" ON public.provas;
CREATE POLICY "Public Select Provas" ON public.provas FOR SELECT USING (true);

-- 5. Fix 'system_logs' relationship
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'system_logs_user_id_fkey') THEN
        ALTER TABLE public.system_logs DROP CONSTRAINT system_logs_user_id_fkey;
    END IF;
    ALTER TABLE public.system_logs ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
END $$;

-- 6. Create 'denuncias' table (if not exists)
CREATE TABLE IF NOT EXISTS public.denuncias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  descricao TEXT NOT NULL,
  localizacao TEXT NOT NULL,
  contato TEXT DEFAULT 'Anônimo',
  status TEXT DEFAULT 'Pendente',
  user_id UUID REFERENCES auth.users(id)
);
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Insert Denuncias" ON public.denuncias;
CREATE POLICY "Public Insert Denuncias" ON public.denuncias FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated Select Denuncias" ON public.denuncias;
CREATE POLICY "Authenticated Select Denuncias" ON public.denuncias FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Ensure 'boletins' table exists
CREATE TABLE IF NOT EXISTS public.boletins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  comunicante TEXT NOT NULL,
  descricao TEXT NOT NULL,
  localizacao TEXT NOT NULL,
  data_fato TIMESTAMP WITH TIME ZONE NOT NULL,
  policial_responsavel TEXT,
  status TEXT DEFAULT 'Registrado',
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.boletins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated Select Boletins" ON public.boletins;
CREATE POLICY "Authenticated Select Boletins" ON public.boletins FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated Insert Boletins" ON public.boletins;
CREATE POLICY "Authenticated Insert Boletins" ON public.boletins FOR INSERT WITH CHECK (auth.role() = 'authenticated');

NOTIFY pgrst, 'reload config';
