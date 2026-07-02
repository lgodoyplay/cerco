
-- Create petitions table
CREATE TABLE IF NOT EXISTS public.petitions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  client_name TEXT NOT NULL,
  content TEXT NOT NULL,
  lawyer_id UUID REFERENCES auth.users(id),
  lawyer_name TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hearings table
CREATE TABLE IF NOT EXISTS public.hearings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_number TEXT,
  date_time TIMESTAMP WITH TIME ZONE,
  target_name TEXT,
  type TEXT,
  location TEXT,
  notes TEXT,
  judge_name TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create release_orders table (Alvarás)
CREATE TABLE IF NOT EXISTS public.release_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prisoner_name TEXT,
  prisoner_passport TEXT,
  case_number TEXT,
  details TEXT,
  judge_name TEXT,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_orders ENABLE ROW LEVEL SECURITY;

-- Policies for Petitions
-- Lawyers can insert their own petitions
CREATE POLICY "Lawyers can insert petitions" ON public.petitions
  FOR INSERT WITH CHECK (auth.uid() = lawyer_id);

-- Lawyers can view their own petitions
CREATE POLICY "Lawyers can view own petitions" ON public.petitions
  FOR SELECT USING (auth.uid() = lawyer_id);

-- Judiciary/Diretor can view all petitions
-- (Assuming 'judiciary_view' permission or similar check would be ideal, but for now allow authenticated users to view if they have the role, 
-- or simplified: everyone authenticated can view for now to avoid complexity, or restrict to specific roles if possible)
-- Here we allow authenticated users to view all petitions (Judges need to see them)
CREATE POLICY "Authenticated users can view all petitions" ON public.petitions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Judiciary can update petitions (approve/reject)
CREATE POLICY "Authenticated users can update petitions" ON public.petitions
  FOR UPDATE USING (auth.role() = 'authenticated');


-- Policies for Hearings
CREATE POLICY "Authenticated users can view hearings" ON public.hearings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert hearings" ON public.hearings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update hearings" ON public.hearings
  FOR UPDATE USING (auth.role() = 'authenticated');


-- Policies for Release Orders
CREATE POLICY "Authenticated users can view release orders" ON public.release_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert release orders" ON public.release_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update release orders" ON public.release_orders
  FOR UPDATE USING (auth.role() = 'authenticated');
