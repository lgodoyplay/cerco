-- Policy to allow authenticated users to delete received forms (candidates)
-- This fixes the issue where the "Delete" button in FormsSettings would fail due to permission denied.

DROP POLICY IF EXISTS "Authenticated users can delete candidates" ON public.candidatos;

CREATE POLICY "Authenticated users can delete candidates" ON public.candidatos
  FOR DELETE USING (auth.role() = 'authenticated');
