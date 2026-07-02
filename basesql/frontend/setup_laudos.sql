
-- ==============================================================================
-- SETUP LAUDOS MÉDICOS
-- ==============================================================================

-- 1. Criar tabela laudos_medicos
CREATE TABLE IF NOT EXISTS public.laudos_medicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_nome TEXT NOT NULL,
  paciente_documento TEXT,
  tipo_laudo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar tabela laudo_arquivos
CREATE TABLE IF NOT EXISTS public.laudo_arquivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  laudo_id UUID REFERENCES public.laudos_medicos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Adicionar trigger para updated_at em laudos_medicos
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_laudos_medicos_updated ON public.laudos_medicos;
CREATE TRIGGER on_laudos_medicos_updated
  BEFORE UPDATE ON public.laudos_medicos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.laudos_medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laudo_arquivos ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para laudos_medicos
DROP POLICY IF EXISTS "Laudos visiveis para autenticados" ON public.laudos_medicos;
CREATE POLICY "Laudos visiveis para autenticados" ON public.laudos_medicos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios podem criar laudos" ON public.laudos_medicos;
CREATE POLICY "Usuarios podem criar laudos" ON public.laudos_medicos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios podem atualizar laudos" ON public.laudos_medicos;
CREATE POLICY "Usuarios podem atualizar laudos" ON public.laudos_medicos
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios podem deletar laudos" ON public.laudos_medicos;
CREATE POLICY "Usuarios podem deletar laudos" ON public.laudos_medicos
  FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Políticas RLS para laudo_arquivos
DROP POLICY IF EXISTS "Arquivos de laudo visiveis para autenticados" ON public.laudo_arquivos;
CREATE POLICY "Arquivos de laudo visiveis para autenticados" ON public.laudo_arquivos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios podem criar arquivos de laudo" ON public.laudo_arquivos;
CREATE POLICY "Usuarios podem criar arquivos de laudo" ON public.laudo_arquivos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios podem deletar arquivos de laudo" ON public.laudo_arquivos;
CREATE POLICY "Usuarios podem deletar arquivos de laudo" ON public.laudo_arquivos
  FOR DELETE USING (auth.role() = 'authenticated');

