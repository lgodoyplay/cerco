-- FIX: Recreate reset_system_data function with correct permissions and cascading logic
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.reset_system_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Disable triggers temporarily if needed, but usually not required for simple deletes
  
  -- Delete data from operational tables in correct order to avoid FK issues
  
  -- 1. Dependent tables (if not set to cascade)
  DELETE FROM public.prisoes;
  DELETE FROM public.procurados;
  
  -- 2. Main operational tables
  DELETE FROM public.investigacoes; -- Should cascade to provas if configured, but let's be safe
  -- If cascade is missing, we might need: DELETE FROM public.provas;
  
  DELETE FROM public.candidatos;
  
  -- 3. Logs and Settings
  DELETE FROM public.system_logs;
  DELETE FROM public.system_settings;
  
  -- 4. Auxiliary tables
  DELETE FROM public.cursos; -- Cascades to cursos_policiais?
  
  -- Note: We do NOT delete from 'profiles' or 'auth.users' to keep the current user active.
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.reset_system_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_system_data() TO service_role;

-- Ensure FKs are cascading where expected (Safety Check)
DO $$
BEGIN
    -- Check investigacao_id in provas
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'provas_investigacao_id_fkey') THEN
        ALTER TABLE public.provas DROP CONSTRAINT provas_investigacao_id_fkey;
        ALTER TABLE public.provas ADD CONSTRAINT provas_investigacao_id_fkey FOREIGN KEY (investigacao_id) REFERENCES public.investigacoes(id) ON DELETE CASCADE;
    END IF;
END $$;
