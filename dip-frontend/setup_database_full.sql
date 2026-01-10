
-- SCRIPT DE CONFIGURAÇÃO TOTAL DO BANCO DE DADOS (CORREÇÃO DE ERROS)
-- Execute este script completo no SQL Editor do Supabase para corrigir:
-- 1. Erro de "Bucket not found" (Prisões e Procurados)
-- 2. Erro de "Column updated_at not found" (Perfis)
-- 3. Permissões de Diretores/Coordenadores

-- ==============================================================================
-- PARTE 1: CORREÇÃO DE PERFIS (PROFILES)
-- ==============================================================================

-- 1. Adicionar coluna updated_at na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Gatilho para profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- PARTE 2: TABELA DE PRISÕES (PRISOES) E BUCKET
-- ==============================================================================

-- 1. Criar tabela prisoes
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

-- 2. Garantir colunas
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS documento TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS artigo TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS data_prisao TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Preso';
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS foto_principal TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS conduzido_por TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.prisoes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 3. RLS para Prisoes
ALTER TABLE public.prisoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prisoes visiveis para todos" ON public.prisoes;
CREATE POLICY "Prisoes visiveis para todos" ON public.prisoes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Policiais podem registrar prisao" ON public.prisoes;
CREATE POLICY "Policiais podem registrar prisao" ON public.prisoes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

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

-- 4. Bucket 'prisoes'
INSERT INTO storage.buckets (id, name, public) VALUES ('prisoes', 'prisoes', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Imagens de prisoes sao publicas" ON storage.objects;
CREATE POLICY "Imagens de prisoes sao publicas" ON storage.objects FOR SELECT USING (bucket_id = 'prisoes');

DROP POLICY IF EXISTS "Policiais podem fazer upload de prisoes" ON storage.objects;
CREATE POLICY "Policiais podem fazer upload de prisoes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prisoes' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Policiais podem deletar suas fotos de prisoes" ON storage.objects;
CREATE POLICY "Policiais podem deletar suas fotos de prisoes" ON storage.objects FOR DELETE USING (bucket_id = 'prisoes' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Policiais podem atualizar suas fotos de prisoes" ON storage.objects;
CREATE POLICY "Policiais podem atualizar suas fotos de prisoes" ON storage.objects FOR UPDATE USING (bucket_id = 'prisoes' AND auth.uid() = owner);


-- ==============================================================================
-- PARTE 3: TABELA DE PROCURADOS (PROCURADOS) E BUCKET
-- ==============================================================================

-- 1. Criar tabela procurados
CREATE TABLE IF NOT EXISTS public.procurados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  nome TEXT NOT NULL,
  documento TEXT,
  motivo TEXT,
  periculosidade TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'Procurado',
  foto_principal TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Garantir colunas
ALTER TABLE public.procurados ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.procurados ADD COLUMN IF NOT EXISTS documento TEXT;
ALTER TABLE public.procurados ADD COLUMN IF NOT EXISTS motivo TEXT;
ALTER TABLE public.procurados ADD COLUMN IF NOT EXISTS periculosidade TEXT;
ALTER TABLE public.procurados ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.procurados ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Procurado';
ALTER TABLE public.procurados ADD COLUMN IF NOT EXISTS foto_principal TEXT;
ALTER TABLE public.procurados ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 3. RLS para Procurados
ALTER TABLE public.procurados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Procurados visiveis para todos" ON public.procurados;
CREATE POLICY "Procurados visiveis para todos" ON public.procurados FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Policiais podem registrar procurados" ON public.procurados;
CREATE POLICY "Policiais podem registrar procurados" ON public.procurados FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Gerenciar procurados" ON public.procurados;
CREATE POLICY "Gerenciar procurados" ON public.procurados
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (lower(role) LIKE '%diretor%' OR lower(role) LIKE '%coordenador%')
    )
  );

-- 4. Bucket 'procurados'
INSERT INTO storage.buckets (id, name, public) VALUES ('procurados', 'procurados', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Imagens de procurados sao publicas" ON storage.objects;
CREATE POLICY "Imagens de procurados sao publicas" ON storage.objects FOR SELECT USING (bucket_id = 'procurados');

DROP POLICY IF EXISTS "Policiais podem fazer upload de procurados" ON storage.objects;
CREATE POLICY "Policiais podem fazer upload de procurados" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'procurados' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Policiais podem deletar fotos de procurados" ON storage.objects;
CREATE POLICY "Policiais podem deletar fotos de procurados" ON storage.objects FOR DELETE USING (bucket_id = 'procurados' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Policiais podem atualizar fotos de procurados" ON storage.objects;
CREATE POLICY "Policiais podem atualizar fotos de procurados" ON storage.objects FOR UPDATE USING (bucket_id = 'procurados' AND auth.uid() = owner);

-- ==============================================================================
-- PARTE 4: BUCKET DE AVATARES (PERFIL)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can update their own avatar" ON storage.objects;
CREATE POLICY "Anyone can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- ==============================================================================
-- PARTE 5: TABELA DE BOLETINS DE OCORRÊNCIA (BO)
-- ==============================================================================

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

-- 2. Habilitar RLS
ALTER TABLE public.boletins ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS)

-- Todos os usuários autenticados podem ver os BOs
DROP POLICY IF EXISTS "Boletins visiveis para todos" ON public.boletins;
CREATE POLICY "Boletins visiveis para todos" ON public.boletins FOR SELECT USING (auth.role() = 'authenticated');

-- Policiais (usuários autenticados) podem registrar boletins
DROP POLICY IF EXISTS "Policiais podem registrar boletins" ON public.boletins;
CREATE POLICY "Policiais podem registrar boletins" ON public.boletins FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Apenas quem criou ou admins podem editar (opcional, por enquanto manter simples)
DROP POLICY IF EXISTS "Gerenciar boletins" ON public.boletins;
CREATE POLICY "Gerenciar boletins" ON public.boletins
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (lower(role) LIKE '%diretor%' OR lower(role) LIKE '%coordenador%')
    )
  );
