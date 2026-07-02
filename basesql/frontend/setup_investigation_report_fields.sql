-- Script de setup para campos do relatório final de inquérito
-- Execute este script no SQL Editor do Supabase

ALTER TABLE public.investigacoes
  ADD COLUMN IF NOT EXISTS delegacia_responsavel TEXT,
  ADD COLUMN IF NOT EXISTS nome_investigado TEXT,
  ADD COLUMN IF NOT EXISTS cpf_investigado TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS endereco_investigado TEXT,
  ADD COLUMN IF NOT EXISTS telefone_investigado TEXT,
  ADD COLUMN IF NOT EXISTS nome_delegado TEXT;

COMMENT ON COLUMN public.investigacoes.delegacia_responsavel IS 'Delegacia responsavel pelo inquerito';
COMMENT ON COLUMN public.investigacoes.nome_investigado IS 'Nome completo do investigado';
COMMENT ON COLUMN public.investigacoes.cpf_investigado IS 'CPF ou documento principal do investigado';
COMMENT ON COLUMN public.investigacoes.data_nascimento IS 'Data de nascimento do investigado';
COMMENT ON COLUMN public.investigacoes.endereco_investigado IS 'Endereco do investigado';
COMMENT ON COLUMN public.investigacoes.telefone_investigado IS 'Telefone do investigado';
COMMENT ON COLUMN public.investigacoes.nome_delegado IS 'Delegado responsavel pela conclusao do inquerito';
