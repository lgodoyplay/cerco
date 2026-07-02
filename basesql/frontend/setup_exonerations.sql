-- MODULO DE EXONERACAO
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.exonerations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  status TEXT DEFAULT 'catalogado',

  full_name TEXT NOT NULL,
  passport_id TEXT NOT NULL,
  role_name TEXT,
  department TEXT,

  reason TEXT NOT NULL,
  notes TEXT,
  decision_date TIMESTAMP WITH TIME ZONE NOT NULL,

  created_by UUID REFERENCES auth.users(id),
  finalized_at TIMESTAMP WITH TIME ZONE,
  finalized_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.exoneration_proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exoneration_id UUID REFERENCES public.exonerations(id) ON DELETE CASCADE,
  proof_type TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  file_name TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.exonerations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exoneration_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Exonerations authenticated read" ON public.exonerations;
CREATE POLICY "Exonerations authenticated read" ON public.exonerations
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Exonerations authenticated insert" ON public.exonerations;
CREATE POLICY "Exonerations authenticated insert" ON public.exonerations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Exonerations authenticated update" ON public.exonerations;
CREATE POLICY "Exonerations authenticated update" ON public.exonerations
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Exoneration proofs authenticated read" ON public.exoneration_proofs;
CREATE POLICY "Exoneration proofs authenticated read" ON public.exoneration_proofs
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Exoneration proofs authenticated insert" ON public.exoneration_proofs;
CREATE POLICY "Exoneration proofs authenticated insert" ON public.exoneration_proofs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

INSERT INTO storage.buckets (id, name, public)
VALUES ('exoneration-proofs', 'exoneration-proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Exoneration proofs public read" ON storage.objects;
CREATE POLICY "Exoneration proofs public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'exoneration-proofs');

DROP POLICY IF EXISTS "Exoneration proofs authenticated upload" ON storage.objects;
CREATE POLICY "Exoneration proofs authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exoneration-proofs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Exoneration proofs authenticated update" ON storage.objects;
CREATE POLICY "Exoneration proofs authenticated update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'exoneration-proofs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Exoneration proofs authenticated delete" ON storage.objects;
CREATE POLICY "Exoneration proofs authenticated delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'exoneration-proofs' AND auth.role() = 'authenticated');

