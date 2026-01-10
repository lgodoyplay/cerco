-- Fix missing column in 'provas' table
ALTER TABLE public.provas 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Ensure RLS policies allow insertion
ALTER TABLE public.provas ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert proofs
DROP POLICY IF EXISTS "Authenticated Insert Provas" ON public.provas;
CREATE POLICY "Authenticated Insert Provas" ON public.provas
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow everyone (or at least authenticated) to view proofs
DROP POLICY IF EXISTS "Public Select Provas" ON public.provas;
CREATE POLICY "Public Select Provas" ON public.provas
FOR SELECT
USING (true);

-- Refresh schema cache (Supabase usually does this automatically on DDL, but good to know)
NOTIFY pgrst, 'reload config';
