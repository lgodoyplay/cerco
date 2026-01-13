-- Adiciona coluna para armazenar a pontuação do quiz na tabela candidatos
ALTER TABLE public.candidatos 
ADD COLUMN IF NOT EXISTS pontuacao_quiz INTEGER DEFAULT 0;

-- Atualiza as políticas de segurança (se necessário) para permitir inserção dessa coluna
-- (Geralmente a política é por tabela, então se já permite insert, deve funcionar)
