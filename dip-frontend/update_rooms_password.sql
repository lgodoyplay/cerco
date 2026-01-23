-- Update communication_rooms table to support Jitsi passwords
ALTER TABLE public.communication_rooms 
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT true;

-- Ensure RLS allows reading passwords for authorized users (or everyone authenticated for now)
-- Assuming existing policy is broad enough, but let's check policies later if needed.
