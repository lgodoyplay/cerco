ALTER TABLE public.prisoes
ADD COLUMN IF NOT EXISTS motivo_prisao TEXT;

ALTER TABLE public.prisoes
ADD COLUMN IF NOT EXISTS midias_json JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.procurados
ADD COLUMN IF NOT EXISTS midias_json JSONB NOT NULL DEFAULT '[]'::jsonb;
