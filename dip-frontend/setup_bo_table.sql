
-- SCRIPT PARA CRIAR TABELA DE BOLETINS DE OCORRÊNCIA (BO)

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

-- Policiais (usuários autenticados) podem criar BOs
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

-- 4. Criar Bucket para anexos de BO (se necessário no futuro, por enquanto não)
