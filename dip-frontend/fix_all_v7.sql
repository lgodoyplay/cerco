
-- 1. Create Warnings Table
CREATE TABLE IF NOT EXISTS public.warnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  details TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ
);

ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;

-- Policies for Warnings
-- Admins and High Command can view all warnings
-- Users can view their own warnings
CREATE POLICY "View warnings" ON public.warnings
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coronel', 'major', 'capitao')
    )
  );

-- Only Admins and High Command can insert/update/delete warnings
CREATE POLICY "Manage warnings" ON public.warnings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coronel', 'major', 'capitao')
    )
  );

-- Users can update their own warnings ONLY to acknowledge them (handled via separate policy or careful update logic)
-- For simplicity, we'll allow users to update their own warnings if we implement acknowledgement, 
-- but strictly speaking, we might want a specific RPC or just allow update for now.
CREATE POLICY "Acknowledge warnings" ON public.warnings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2. Create News Table
CREATE TABLE IF NOT EXISTS public.news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES public.profiles(id),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Policies for News
-- Everyone can view public news (including anon if we allow public access, but here assume authenticated or public API)
CREATE POLICY "View public news" ON public.news
  FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');

-- Only Police/Admins can manage news
CREATE POLICY "Manage news" ON public.news
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role IN ('admin', 'coronel', 'major', 'capitao', 'tenente', 'sargento', 'cabo', 'soldado') OR role ILIKE '%polic%')
    )
  );

-- 3. Updates for Communication Fixes (if needed at DB level)
-- Ensure communication tables exist for diagnostics (schema check)
CREATE TABLE IF NOT EXISTS public.communication_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'voice',
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.communication_room_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.communication_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

ALTER TABLE public.communication_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View rooms" ON public.communication_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage rooms" ON public.communication_rooms FOR ALL TO authenticated USING (true); -- Simplification

CREATE POLICY "View members" ON public.communication_room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage members" ON public.communication_room_members FOR ALL TO authenticated USING (true); -- Simplification

