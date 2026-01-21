-- Adiciona coluna para controlar se o usuário concluiu os módulos do curso (definido manualmente por instrutor)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS curso_modulos_concluidos BOOLEAN DEFAULT FALSE;

-- Garante que a coluna esteja visível
COMMENT ON COLUMN public.profiles.curso_modulos_concluidos IS 'Indica se o usuário concluiu os módulos do curso de formação e pode fazer a prova.';
