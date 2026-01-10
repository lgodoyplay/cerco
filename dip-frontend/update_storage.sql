-- Criar bucket 'avatars' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Todos podem ver avatares (Público)
CREATE POLICY "Avatar Images are publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Política: Usuários autenticados podem fazer upload de avatares
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Política: Usuários podem atualizar seus próprios avatares (ou admins podem atualizar qualquer um)
-- Simplificação: Todos autenticados podem atualizar qualquer arquivo no bucket avatars (para facilitar gestão)
CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Política: Usuários podem deletar avatares
CREATE POLICY "Authenticated users can delete avatars"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Adicionar coluna avatar_url na tabela profiles se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Notificar recarregamento do schema
NOTIFY pgrst, 'reload schema';
