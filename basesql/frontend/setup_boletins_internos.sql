-- Script para criar a tabela separada de Boletins Internos
CREATE TABLE IF NOT EXISTS public.boletins_internos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  comunicante TEXT NOT NULL,
  descricao TEXT NOT NULL,
  localizacao TEXT NOT NULL,
  data_fato TIMESTAMP WITH TIME ZONE NOT NULL,
  policial_responsavel TEXT,
  status TEXT DEFAULT 'Registrado',
  created_by UUID REFERENCES auth.users(id),
  comunicantes_json JSONB,
  denunciados_json JSONB
);

ALTER TABLE public.boletins_internos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Boletins internos visiveis para todos" ON public.boletins_internos;
CREATE POLICY "Boletins internos visiveis para todos" ON public.boletins_internos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios autenticados podem criar boletins internos" ON public.boletins_internos;
CREATE POLICY "Usuarios autenticados podem criar boletins internos" ON public.boletins_internos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios podem editar boletins internos" ON public.boletins_internos;
CREATE POLICY "Usuarios podem editar boletins internos" ON public.boletins_internos
  FOR UPDATE USING (auth.uid() = created_by OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios podem deletar boletins internos" ON public.boletins_internos;
CREATE POLICY "Usuarios podem deletar boletins internos" ON public.boletins_internos
  FOR DELETE USING (auth.uid() = created_by OR auth.role() = 'authenticated');
