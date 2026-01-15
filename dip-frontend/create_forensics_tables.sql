-- Criação da tabela de Perícias
CREATE TABLE IF NOT EXISTS public.pericias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'Pessoa', 'Local', 'Veículo'
    youtube_link TEXT,
    created_by UUID REFERENCES public.profiles(id)
);

-- Habilitar RLS para pericias
ALTER TABLE public.pericias ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para pericias (simplificado: todos logados podem ver/criar)
CREATE POLICY "Permitir leitura de pericias para usuários autenticados"
ON public.pericias FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção de pericias para usuários autenticados"
ON public.pericias FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir atualização de pericias para usuários autenticados"
ON public.pericias FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Permitir exclusão de pericias para usuários autenticados"
ON public.pericias FOR DELETE
TO authenticated
USING (true);


-- Criação da tabela de Fotos da Perícia
CREATE TABLE IF NOT EXISTS public.pericia_fotos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pericia_id UUID REFERENCES public.pericias(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    description TEXT
);

-- Habilitar RLS para pericia_fotos
ALTER TABLE public.pericia_fotos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para pericia_fotos
CREATE POLICY "Permitir leitura de fotos para usuários autenticados"
ON public.pericia_fotos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserção de fotos para usuários autenticados"
ON public.pericia_fotos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de fotos para usuários autenticados"
ON public.pericia_fotos FOR DELETE
TO authenticated
USING (true);

-- Storage Policy (assumindo bucket 'evidence' existente ou criando novo)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', true) ON CONFLICT DO NOTHING;
-- CREATE POLICY "Give public access to evidence" ON storage.objects FOR SELECT USING (bucket_id = 'evidence');
-- CREATE POLICY "Allow authenticated uploads to evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidence' AND auth.role() = 'authenticated');
