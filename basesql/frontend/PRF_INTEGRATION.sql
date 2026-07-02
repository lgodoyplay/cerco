-- Tabela de Apreensão de Veículos
CREATE TABLE IF NOT EXISTS public.prf_seizures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  officer_id UUID REFERENCES auth.users(id),
  officer_name TEXT,
  vehicle_model TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_color TEXT,
  reason TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'Apreendido', -- Apreendido, Liberado, Leilão
  notes TEXT
);

-- Tabela de Multas
CREATE TABLE IF NOT EXISTS public.prf_fines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  officer_id UUID REFERENCES auth.users(id),
  officer_name TEXT,
  vehicle_plate TEXT NOT NULL,
  vehicle_model TEXT,
  driver_name TEXT,
  driver_passport TEXT,
  violation_type TEXT NOT NULL,
  fine_amount NUMERIC,
  location TEXT,
  notes TEXT
);

-- Tabela de Fotos (Vinculada a Apreensões ou Multas)
CREATE TABLE IF NOT EXISTS public.prf_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  seizure_id UUID REFERENCES public.prf_seizures(id) ON DELETE CASCADE,
  fine_id UUID REFERENCES public.prf_fines(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT -- 'vehicle_condition', 'evidence', etc.
);

-- RLS Policies
ALTER TABLE public.prf_seizures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prf_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prf_photos ENABLE ROW LEVEL SECURITY;

-- Policies for Seizures
CREATE POLICY "Enable read access for authenticated users" ON public.prf_seizures
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.prf_seizures
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for creators and admins" ON public.prf_seizures
  FOR UPDATE USING (auth.uid() = officer_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'diretor')
  ));

-- Policies for Fines
CREATE POLICY "Enable read access for authenticated users" ON public.prf_fines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.prf_fines
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for Photos
CREATE POLICY "Enable read access for authenticated users" ON public.prf_photos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.prf_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Storage Bucket (Assuming 'evidence' bucket exists, if not, create it or use a new one)
-- You might need to create a bucket named 'prf-evidence' in the Supabase dashboard manually if not via SQL.
-- Inserting a row into storage.buckets is possible if you have permissions.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prf-evidence', 'prf-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Authenticated users can upload PRF evidence" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'prf-evidence' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view PRF evidence" ON storage.objects
  FOR SELECT USING (bucket_id = 'prf-evidence' AND auth.role() = 'authenticated');
