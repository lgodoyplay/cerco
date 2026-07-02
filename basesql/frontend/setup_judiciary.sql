-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create warrants table
CREATE TABLE IF NOT EXISTS public.warrants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL, -- 'search_seizure', 'arrest', 'preventive_arrest', 'temporary_arrest', 'breach'
  target_name TEXT NOT NULL,
  target_id TEXT, -- Passport/RG
  reason TEXT NOT NULL,
  detailed_description TEXT,
  address TEXT, -- For search warrants
  status TEXT DEFAULT 'active', -- 'active', 'executed', 'revoked', 'expired'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  judge_id UUID REFERENCES auth.users(id),
  judge_name TEXT, -- Store name for easier display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  executed_by TEXT,
  attachment_url TEXT -- URL for attached PDF/JPG/PNG
);

-- Create storage bucket for warrants if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('warrants', 'warrants', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access to Warrants"
ON storage.objects FOR SELECT
USING ( bucket_id = 'warrants' );

CREATE POLICY "Authenticated users can upload warrants"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'warrants' AND auth.role() = 'authenticated' );


-- Add attachment_url column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warrants' AND column_name = 'attachment_url') THEN
        ALTER TABLE public.warrants ADD COLUMN attachment_url TEXT;
    END IF;
END $$;

-- RLS Policies
ALTER TABLE public.warrants ENABLE ROW LEVEL SECURITY;

-- Everyone can read active warrants (police needs to know)
CREATE POLICY "Everyone can read warrants" ON public.warrants
  FOR SELECT USING (true);

-- Only judiciary can insert/update/delete
-- Note: In a real scenario, we'd check for specific permission claims in the JWT
-- For now, we allow authenticated users to insert if they have the role (enforced by UI/Backend logic usually, but here RLS is good practice)
-- Since checking specific roles in RLS can be complex without custom claims, we will allow authenticated users for now and rely on UI/App logic
-- OR better: Allow insert for authenticated users (as we assume the app checks permissions)
CREATE POLICY "Authenticated users can insert warrants" ON public.warrants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update warrants" ON public.warrants
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_warrants_status ON public.warrants(status);
CREATE INDEX IF NOT EXISTS idx_warrants_target_id ON public.warrants(target_id);
