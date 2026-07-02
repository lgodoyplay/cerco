
-- MÓDULO DE PORTE DE ARMAS
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela Principal de Licenças/Solicitações
CREATE TABLE IF NOT EXISTS public.weapon_licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  -- Dados do Solicitante
  full_name TEXT NOT NULL,
  passport_id TEXT NOT NULL, -- ID do Passaporte no jogo
  phone TEXT NOT NULL,
  reason TEXT NOT NULL,
  
  -- Controle de Status
  status TEXT DEFAULT 'pending', 
  -- Estados: 
  -- 'pending' (Solicitação enviada)
  -- 'processing' (Em análise/Aceito pelo policial)
  -- 'approved' (Concluído/Porte Ativo)
  -- 'rejected' (Negado)
  -- 'revoked' (Revogado)
  -- 'expired' (Vencido)
  
  -- Datas importantes
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Policial Responsável
  assigned_to UUID REFERENCES auth.users(id)
);

-- 2. Tabela de Anexos (Documentos e Provas)
CREATE TABLE IF NOT EXISTS public.license_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID REFERENCES public.weapon_licenses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT, -- 'document', 'image', etc.
  uploaded_by UUID REFERENCES auth.users(id), -- NULL se for upload público na solicitação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Habilitar RLS
ALTER TABLE public.weapon_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Policies para weapon_licenses

-- Leitura: Policiais veem tudo. Público não vê lista (segurança).
DROP POLICY IF EXISTS "Policiais veem todas as licencas" ON public.weapon_licenses;
CREATE POLICY "Policiais veem todas as licencas" ON public.weapon_licenses
  FOR SELECT USING (auth.role() = 'authenticated');

-- Inserção: Público pode criar solicitação
DROP POLICY IF EXISTS "Publico pode solicitar licenca" ON public.weapon_licenses;
CREATE POLICY "Publico pode solicitar licenca" ON public.weapon_licenses
  FOR INSERT WITH CHECK (true);

-- Atualização: Apenas Policiais
DROP POLICY IF EXISTS "Policiais gerenciam licencas" ON public.weapon_licenses;
CREATE POLICY "Policiais gerenciam licencas" ON public.weapon_licenses
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Policies para license_attachments

-- Leitura: Policiais veem anexos
DROP POLICY IF EXISTS "Policiais veem anexos" ON public.license_attachments;
CREATE POLICY "Policiais veem anexos" ON public.license_attachments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Inserção: Público (na solicitação) e Policiais
DROP POLICY IF EXISTS "Todos podem enviar anexos" ON public.license_attachments;
CREATE POLICY "Todos podem enviar anexos" ON public.license_attachments
  FOR INSERT WITH CHECK (true);

-- 6. Configuração de Storage (Bucket)
INSERT INTO storage.buckets (id, name, public) VALUES ('license-docs', 'license-docs', true) ON CONFLICT (id) DO NOTHING;

-- Policies do Storage
DROP POLICY IF EXISTS "Documentos de licenca sao publicos para leitura" ON storage.objects;
CREATE POLICY "Documentos de licenca sao publicos para leitura" ON storage.objects
  FOR SELECT USING (bucket_id = 'license-docs');

DROP POLICY IF EXISTS "Upload publico de documentos de licenca" ON storage.objects;
CREATE POLICY "Upload publico de documentos de licenca" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'license-docs');

DROP POLICY IF EXISTS "Policiais gerenciam documentos de licenca" ON storage.objects;
CREATE POLICY "Policiais gerenciam documentos de licenca" ON storage.objects
  FOR UPDATE USING (bucket_id = 'license-docs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Policiais deletam documentos de licenca" ON storage.objects;
CREATE POLICY "Policiais deletam documentos de licenca" ON storage.objects
  FOR DELETE USING (bucket_id = 'license-docs' AND auth.role() = 'authenticated');
