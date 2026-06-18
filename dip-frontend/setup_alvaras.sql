
-- ==============================================================================
-- SETUP ALVARÁS DE ESTABELECIMENTOS
-- ==============================================================================

-- 1. Criar tabela alvaras
CREATE TABLE IF NOT EXISTS public.alvaras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estabelecimento TEXT NOT NULL,
  endereco TEXT NOT NULL,
  foto_local TEXT,
  data_emissao DATE NOT NULL,
  data_validade DATE NOT NULL,
  status TEXT DEFAULT 'Ativo',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Adicionar trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_alvaras_updated ON public.alvaras;
CREATE TRIGGER on_alvaras_updated
  BEFORE UPDATE ON public.alvaras
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. RLS para alvaras
ALTER TABLE public.alvaras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alvaras visiveis para todos" ON public.alvaras;
CREATE POLICY "Alvaras visiveis para todos" ON public.alvaras FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios podem criar alvaras" ON public.alvaras;
CREATE POLICY "Usuarios podem criar alvaras" ON public.alvaras FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios podem atualizar alvaras" ON public.alvaras;
CREATE POLICY "Usuarios podem atualizar alvaras" ON public.alvaras FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Bucket 'alvaras'
INSERT INTO storage.buckets (id, name, public) VALUES ('alvaras', 'alvaras', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Imagens de alvaras são públicas" ON storage.objects;
CREATE POLICY "Imagens de alvaras são públicas" ON storage.objects FOR SELECT USING (bucket_id = 'alvaras');

DROP POLICY IF EXISTS "Usuarios podem fazer upload de alvaras" ON storage.objects;
CREATE POLICY "Usuarios podem fazer upload de alvaras" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'alvaras' AND auth.role() = 'authenticated');

