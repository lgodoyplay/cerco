-- MÓDULO DE MEDIDA PROTETIVA
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.protective_measures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  status TEXT DEFAULT 'active',

  victim_name TEXT NOT NULL,
  victim_passport TEXT NOT NULL,
  victim_phone TEXT,

  aggressor_name TEXT NOT NULL,
  aggressor_passport TEXT NOT NULL,

  authority TEXT,
  restrictions TEXT,
  details TEXT,

  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,

  created_by UUID REFERENCES auth.users(id),
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  withdrawn_by UUID REFERENCES auth.users(id),
  withdrawn_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.protective_measure_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  measure_id UUID REFERENCES public.protective_measures(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.protective_measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protective_measure_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PM view measures" ON public.protective_measures;
CREATE POLICY "PM view measures" ON public.protective_measures
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "PM insert measures" ON public.protective_measures;
CREATE POLICY "PM insert measures" ON public.protective_measures
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "PM update measures" ON public.protective_measures;
CREATE POLICY "PM update measures" ON public.protective_measures
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "PM view measure attachments" ON public.protective_measure_attachments;
CREATE POLICY "PM view measure attachments" ON public.protective_measure_attachments
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "PM insert measure attachments" ON public.protective_measure_attachments;
CREATE POLICY "PM insert measure attachments" ON public.protective_measure_attachments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

INSERT INTO storage.buckets (id, name, public)
VALUES ('protective-measure-docs', 'protective-measure-docs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Protective measure docs public read" ON storage.objects;
CREATE POLICY "Protective measure docs public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'protective-measure-docs');

DROP POLICY IF EXISTS "Protective measure docs authenticated upload" ON storage.objects;
CREATE POLICY "Protective measure docs authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'protective-measure-docs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Protective measure docs authenticated update" ON storage.objects;
CREATE POLICY "Protective measure docs authenticated update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'protective-measure-docs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Protective measure docs authenticated delete" ON storage.objects;
CREATE POLICY "Protective measure docs authenticated delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'protective-measure-docs' AND auth.role() = 'authenticated');

