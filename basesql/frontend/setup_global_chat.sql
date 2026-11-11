-- Criação da tabela de chat global para todos os usuários autenticados
CREATE TABLE IF NOT EXISTS public.global_chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  user_name TEXT,
  user_avatar_url TEXT,
  user_role TEXT,
  user_role_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.global_chat_messages
  ADD COLUMN IF NOT EXISTS user_role_color TEXT;

ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_for_chat_delete()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        lower(COALESCE(p.role, '')) ~ '(admin|administrador|administradora|diretor|diretora|comandante|superuser|developer)'
        OR lower(COALESCE(p.permissions::text, '')) ~ '(admin_access|admin|superuser|developer|diretor|comandante)'
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_for_chat_delete() TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_global_chat_message(message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  IF message_id IS NULL THEN
    RETURN false;
  END IF;

  DELETE FROM public.global_chat_messages AS gcm
  WHERE gcm.id = message_id
    AND (
      gcm.user_id = auth.uid()
      OR public.is_admin_for_chat_delete()
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_global_chat_message(uuid) TO authenticated;

DROP POLICY IF EXISTS "Global chat read for authenticated users" ON public.global_chat_messages;
CREATE POLICY "Global chat read for authenticated users"
  ON public.global_chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Global chat insert for authenticated users" ON public.global_chat_messages;
CREATE POLICY "Global chat insert for authenticated users"
  ON public.global_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Global chat update for authenticated users" ON public.global_chat_messages;
CREATE POLICY "Global chat update for authenticated users"
  ON public.global_chat_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Global chat delete for authenticated users" ON public.global_chat_messages;
CREATE POLICY "Global chat delete for authenticated users"
  ON public.global_chat_messages
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin_for_chat_delete()
  );
