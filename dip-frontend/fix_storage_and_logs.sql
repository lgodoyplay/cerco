-- 1. Create Storage Buckets
-- Note: We use INSERT into storage.buckets. 
-- If this fails with "relation storage.buckets does not exist", it means the storage extension is not enabled or we are not superuser.
-- Usually in Supabase SQL Editor this works.

-- Bucket: provas (Investigation Proofs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('provas', 'provas', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket: procurados (Wanted Posters/Photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('procurados', 'procurados', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket: prisoes (Arrest Photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('prisoes', 'prisoes', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket: avatars (User Profiles)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies (RLS)

-- Helper function to create policies if they don't exist could be complex in SQL.
-- We will DROP and CREATE to ensure they are up to date.

-- --- PROVAS ---
DROP POLICY IF EXISTS "Public Access Provas" ON storage.objects;
CREATE POLICY "Public Access Provas" ON storage.objects
FOR SELECT USING ( bucket_id = 'provas' );

DROP POLICY IF EXISTS "Authenticated Upload Provas" ON storage.objects;
CREATE POLICY "Authenticated Upload Provas" ON storage.objects
FOR INSERT WITH CHECK ( bucket_id = 'provas' AND auth.role() = 'authenticated' );

-- --- PROCURADOS ---
DROP POLICY IF EXISTS "Public Access Procurados" ON storage.objects;
CREATE POLICY "Public Access Procurados" ON storage.objects
FOR SELECT USING ( bucket_id = 'procurados' );

DROP POLICY IF EXISTS "Authenticated Upload Procurados" ON storage.objects;
CREATE POLICY "Authenticated Upload Procurados" ON storage.objects
FOR INSERT WITH CHECK ( bucket_id = 'procurados' AND auth.role() = 'authenticated' );

-- --- PRISOES ---
DROP POLICY IF EXISTS "Public Access Prisoes" ON storage.objects;
CREATE POLICY "Public Access Prisoes" ON storage.objects
FOR SELECT USING ( bucket_id = 'prisoes' );

DROP POLICY IF EXISTS "Authenticated Upload Prisoes" ON storage.objects;
CREATE POLICY "Authenticated Upload Prisoes" ON storage.objects
FOR INSERT WITH CHECK ( bucket_id = 'prisoes' AND auth.role() = 'authenticated' );

-- --- AVATARS ---
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
CREATE POLICY "Public Access Avatars" ON storage.objects
FOR SELECT USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
CREATE POLICY "Authenticated Upload Avatars" ON storage.objects
FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );


-- 3. Fix system_logs Foreign Key Relationship
-- This ensures that the query system_logs(*, profiles(*)) works correctly.

DO $$
BEGIN
    -- Check if the constraint exists, if not, or to be safe, drop and recreate
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'system_logs_user_id_fkey') THEN
        ALTER TABLE public.system_logs DROP CONSTRAINT system_logs_user_id_fkey;
    END IF;
    
    -- Re-add the constraint
    ALTER TABLE public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
END $$;

-- 4. Ensure RLS on system_logs allows reading
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view logs" ON public.system_logs;
CREATE POLICY "Authenticated users can view logs" ON public.system_logs
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.system_logs;
CREATE POLICY "Authenticated users can insert logs" ON public.system_logs
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
