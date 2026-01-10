-- Create 'denuncias' table
CREATE TABLE IF NOT EXISTS public.denuncias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  descricao TEXT NOT NULL,
  localizacao TEXT NOT NULL,
  contato TEXT DEFAULT 'Anônimo',
  status TEXT DEFAULT 'Pendente', -- Pendente, Em Análise, Concluída
  user_id UUID REFERENCES auth.users(id) -- Optional, if user is logged in
);

-- Enable RLS
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone (including anonymous) to insert
CREATE POLICY "Public Insert Denuncias"
ON public.denuncias FOR INSERT
WITH CHECK (true);

-- Allow authenticated users (police) to select/view all
CREATE POLICY "Authenticated Select Denuncias"
ON public.denuncias FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to update (change status)
CREATE POLICY "Authenticated Update Denuncias"
ON public.denuncias FOR UPDATE
USING (auth.role() = 'authenticated');
