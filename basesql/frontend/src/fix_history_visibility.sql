-- Enable RLS for logistics_custody if not already enabled
ALTER TABLE logistics_custody ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to view custody items
CREATE POLICY "Enable read access for all users" ON "public"."logistics_custody"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Policy to allow authenticated users to insert custody items
CREATE POLICY "Enable insert for authenticated users" ON "public"."logistics_custody"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy to allow authenticated users to update custody items
CREATE POLICY "Enable update for authenticated users" ON "public"."logistics_custody"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true);

-- Ensure weapon_licenses policies exist
ALTER TABLE weapon_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."weapon_licenses"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "public"."weapon_licenses"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON "public"."weapon_licenses"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true);

-- Fix foreign key for logistics_custody if missing (optional/commented out to avoid errors if table structure differs)
-- ALTER TABLE logistics_custody ADD CONSTRAINT logistics_custody_officer_id_fkey FOREIGN KEY (officer_id) REFERENCES auth.users(id);
