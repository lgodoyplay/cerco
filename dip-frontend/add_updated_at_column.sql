
-- ADICIONAR COLUNA UPDATED_AT NA TABELA PROFILES
-- Executar este script para corrigir o erro: "Could not find the 'updated_at' column"

-- 1. Adicionar a coluna updated_at se ela não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Criar uma função para atualizar automaticamente essa data
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar o gatilho (trigger) que chama a função acima toda vez que o perfil for editado
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
