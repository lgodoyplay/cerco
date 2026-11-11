-- Criação da tabela de chat global para todos os usuários autenticados
CREATE TABLE IF NOT EXISTS public.global_chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  user_name TEXT,
  user_avatar_url TEXT,
  user_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;

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
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          lower(COALESCE(p.role, '')) LIKE '%admin%'
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(COALESCE(p.permissions, '[]'::jsonb)) AS permission(value)
            WHERE permission.value = 'admin_access'
          )
        )
    )
  );
