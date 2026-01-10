
-- PERMISSÕES ESPECÍFICAS PARA PERFIL
-- Executar este script no SQL Editor do Supabase para corrigir erro ao salvar foto/perfil

-- 1. Permitir que cada usuário edite APENAS seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING ( id = auth.uid() );

-- 2. Permitir que todos usuários autenticados vejam todos os perfis (para listar na busca)
DROP POLICY IF EXISTS "Profiles visible to all authenticated" ON public.profiles;
CREATE POLICY "Profiles visible to all authenticated"
  ON public.profiles
  FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- 3. Garantir acesso ao Storage para Avatar (Upload e Leitura)
-- (Reforçando caso o script anterior tenha falhado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar Images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar Images are publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
