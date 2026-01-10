-- Ensure boletins table exists and is accessible
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

-- Enable RLS
ALTER TABLE public.boletins ENABLE ROW LEVEL SECURITY;

-- Re-apply policies to be sure
DROP POLICY IF EXISTS "Boletins visiveis para todos" ON public.boletins;
CREATE POLICY "Boletins visiveis para todos" ON public.boletins 
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem criar BOs" ON public.boletins;
CREATE POLICY "Usuarios autenticados podem criar BOs" ON public.boletins 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions just in case
GRANT ALL ON public.boletins TO authenticated;
GRANT ALL ON public.boletins TO service_role;
