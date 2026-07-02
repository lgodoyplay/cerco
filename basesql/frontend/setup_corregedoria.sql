-- MODULO DA CORREGEDORIA
-- Execute este script no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.corregedoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  detalhes TEXT NOT NULL,
  arquivos TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.corregedoria
  ALTER COLUMN nome SET NOT NULL;

ALTER TABLE public.corregedoria
  ALTER COLUMN arquivos SET DEFAULT '{}'::text[];

ALTER TABLE public.corregedoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Corregedoria public insert" ON public.corregedoria;
CREATE POLICY "Corregedoria public insert" ON public.corregedoria
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Corregedoria authenticated read" ON public.corregedoria;
CREATE POLICY "Corregedoria authenticated read" ON public.corregedoria
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Corregedoria authenticated delete" ON public.corregedoria;
CREATE POLICY "Corregedoria authenticated delete" ON public.corregedoria
  FOR DELETE
  USING (auth.role() = 'authenticated');

