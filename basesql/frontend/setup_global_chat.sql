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
