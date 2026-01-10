
-- CORREÇÃO COMPLETA DA TABELA PRISOES E STORAGE
-- Execute este script para garantir que a funcionalidade de registrar prisão funcione.

-- 1. Criar a tabela prisoes se não existir
CREATE TABLE IF NOT EXISTS public.prisoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  nome TEXT NOT NULL,
  documento TEXT,
  artigo TEXT,
  data_prisao TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'Preso',
  foto_principal TEXT,
  conduzido_por TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Garantir que todas as colunas existam (caso a tabela já exista mas esteja incompleta)
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS documento TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS artigo TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS data_prisao TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Preso';
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS foto_principal TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS conduzido_por TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 3. Habilitar RLS (Segurança por linha)
ALTER TABLE public.prisoes ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Acesso (Policies) para a tabela prisoes
-- Permitir leitura para todos os usuários autenticados
DROP POLICY IF EXISTS "Prisoes visiveis para todos" ON public.prisoes;
CREATE POLICY "Prisoes visiveis para todos" ON public.prisoes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserção para todos os usuários autenticados (policiais)
DROP POLICY IF EXISTS "Policiais podem registrar prisao" ON public.prisoes;
CREATE POLICY "Policiais podem registrar prisao" ON public.prisoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir atualização apenas para quem criou ou Diretores/Coordenadores
DROP POLICY IF EXISTS "Gerenciar prisoes" ON public.prisoes;
CREATE POLICY "Gerenciar prisoes" ON public.prisoes
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (lower(role) LIKE '%diretor%' OR lower(role) LIKE '%coordenador%')
    )
  );

-- 5. Configurar Storage para Imagens de Prisões (Bucket 'prisoes')
-- Inserir o bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('prisoes', 'prisoes', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para 'prisoes'
DROP POLICY IF EXISTS "Imagens de prisoes sao publicas" ON storage.objects;
CREATE POLICY "Imagens de prisoes sao publicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'prisoes');

DROP POLICY IF EXISTS "Policiais podem fazer upload de prisoes" ON storage.objects;
CREATE POLICY "Policiais podem fazer upload de prisoes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'prisoes' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Policiais podem deletar suas fotos de prisoes" ON storage.objects;
CREATE POLICY "Policiais podem deletar suas fotos de prisoes" ON storage.objects
  FOR DELETE USING (bucket_id = 'prisoes' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Policiais podem atualizar suas fotos de prisoes" ON storage.objects;
CREATE POLICY "Policiais podem atualizar suas fotos de prisoes" ON storage.objects
  FOR UPDATE USING (bucket_id = 'prisoes' AND auth.uid() = owner);
