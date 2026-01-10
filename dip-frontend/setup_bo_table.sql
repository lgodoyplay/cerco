-- Script para criar a tabela de Boletins de Ocorrência (BO)

-- 1. Criar tabela boletins
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

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.boletins ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS)

-- Todos os usuários autenticados podem ver os BOs
DROP POLICY IF EXISTS "Boletins visiveis para todos" ON public.boletins;
CREATE POLICY "Boletins visiveis para todos" ON public.boletins 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Usuários autenticados podem criar BOs
DROP POLICY IF EXISTS "Usuarios autenticados podem criar BOs" ON public.boletins;
CREATE POLICY "Usuarios autenticados podem criar BOs" ON public.boletins 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Opcional: Usuários podem editar seus próprios BOs
DROP POLICY IF EXISTS "Usuarios podem editar seus proprios BOs" ON public.boletins;
CREATE POLICY "Usuarios podem editar seus proprios BOs" ON public.boletins 
  FOR UPDATE USING (auth.uid() = created_by);
