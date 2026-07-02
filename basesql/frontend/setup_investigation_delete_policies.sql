-- Corrige exclusao de investigacoes, provas e arquivos do bucket "provas"
-- Execute este script no SQL Editor do Supabase

ALTER TABLE public.investigacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Excluir investigações" ON public.investigacoes;
CREATE POLICY "Excluir investigações"
ON public.investigacoes
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Excluir provas" ON public.provas;
CREATE POLICY "Excluir provas"
ON public.provas
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Agentes podem deletar provas" ON storage.objects;
CREATE POLICY "Agentes podem deletar provas"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'provas' AND auth.role() = 'authenticated');
