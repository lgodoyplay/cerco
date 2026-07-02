-- Sistema de Comunicação (Salas, Membros, Mensagens)

-- 1. Tabelas

-- Salas
CREATE TABLE IF NOT EXISTS public.communication_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    discord_call_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membros das Salas
CREATE TABLE IF NOT EXISTS public.communication_room_members (
    room_id UUID REFERENCES public.communication_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);

-- Mensagens
CREATE TABLE IF NOT EXISTS public.communication_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.communication_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (Row Level Security)

ALTER TABLE public.communication_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para communication_rooms
-- Todos podem ver as salas listadas
CREATE POLICY "Salas visíveis para autenticados" 
    ON public.communication_rooms FOR SELECT 
    TO authenticated 
    USING (true);

-- Qualquer autenticado pode criar sala
CREATE POLICY "Autenticados podem criar salas" 
    ON public.communication_rooms FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = owner_id);

-- Apenas o dono pode deletar a sala
CREATE POLICY "Dono pode deletar sala" 
    ON public.communication_rooms FOR DELETE 
    TO authenticated 
    USING (auth.uid() = owner_id);

-- Políticas para communication_room_members
-- Todos podem ver quem está nas salas (para listar contagem ou avatares)
CREATE POLICY "Membros visíveis para autenticados" 
    ON public.communication_room_members FOR SELECT 
    TO authenticated 
    USING (true);

-- Usuário pode entrar na sala (inserir seu próprio registro)
CREATE POLICY "Usuários podem entrar em salas" 
    ON public.communication_room_members FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- Usuário pode sair (deletar seu registro) ou Dono da sala pode remover
CREATE POLICY "Usuários podem sair ou ser removidos pelo dono" 
    ON public.communication_room_members FOR DELETE 
    TO authenticated 
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.communication_rooms 
            WHERE id = communication_room_members.room_id 
            AND owner_id = auth.uid()
        )
    );

-- Políticas para communication_messages
-- Apenas membros da sala podem ver mensagens
CREATE POLICY "Membros podem ver mensagens" 
    ON public.communication_messages FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.communication_room_members 
            WHERE room_id = communication_messages.room_id 
            AND user_id = auth.uid()
        )
    );

-- Apenas membros da sala podem enviar mensagens
CREATE POLICY "Membros podem enviar mensagens" 
    ON public.communication_messages FOR INSERT 
    TO authenticated 
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.communication_room_members 
            WHERE room_id = communication_messages.room_id 
            AND user_id = auth.uid()
        )
    );

-- 3. Realtime
-- Habilitar replicação para realtime (Supabase precisa disso para o subscribe funcionar)
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_messages;
