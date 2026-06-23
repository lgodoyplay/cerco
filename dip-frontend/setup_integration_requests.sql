CREATE TABLE IF NOT EXISTS public.integration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  passport_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  desired_login TEXT NOT NULL,
  discord_name TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.integration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integration_requests_public_insert" ON public.integration_requests;
CREATE POLICY "integration_requests_public_insert"
ON public.integration_requests
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "integration_requests_authenticated_select" ON public.integration_requests;
CREATE POLICY "integration_requests_authenticated_select"
ON public.integration_requests
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "integration_requests_authenticated_update" ON public.integration_requests;
CREATE POLICY "integration_requests_authenticated_update"
ON public.integration_requests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "integration_requests_authenticated_delete" ON public.integration_requests;
CREATE POLICY "integration_requests_authenticated_delete"
ON public.integration_requests
FOR DELETE
TO authenticated
USING (true);
