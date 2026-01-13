-- FIX: Reset System Data Function and Cascading Constraints
-- Run this entire script in the Supabase SQL Editor to fix the "Reset System" error (400 Bad Request).

-- 1. Ensure Foreign Keys have ON DELETE CASCADE for clean deletion
DO $$
BEGIN
    -- Check and fix 'provas' dependency on 'investigacoes'
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'provas_investigacao_id_fkey') THEN
        ALTER TABLE public.provas DROP CONSTRAINT provas_investigacao_id_fkey;
        ALTER TABLE public.provas ADD CONSTRAINT provas_investigacao_id_fkey 
            FOREIGN KEY (investigacao_id) REFERENCES public.investigacoes(id) ON DELETE CASCADE;
    END IF;

    -- Check and fix 'cursos_policiais' dependency on 'cursos' (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cursos_policiais') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cursos_policiais_curso_id_fkey') THEN
            ALTER TABLE public.cursos_policiais DROP CONSTRAINT cursos_policiais_curso_id_fkey;
            ALTER TABLE public.cursos_policiais ADD CONSTRAINT cursos_policiais_curso_id_fkey 
                FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 2. Drop the existing function (to ensure clean recreation)
DROP FUNCTION IF EXISTS public.reset_system_data();

-- 3. Create the function with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.reset_system_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete from operational tables (order matters to minimize FK checks, though CASCADE helps)
  
  -- Delete Investigations (cascades to provas)
  DELETE FROM public.investigacoes;
  
  -- Delete Arrests and Wanted
  DELETE FROM public.prisoes;
  DELETE FROM public.procurados;
  
  -- Delete Police Reports (BO)
  DELETE FROM public.boletins;
  
  -- Delete Candidates/Forms
  DELETE FROM public.candidatos;
  
  -- Delete Courses (cascades to assignments)
  DELETE FROM public.cursos;
  
  -- Delete Logs and Settings (Factory Reset)
  DELETE FROM public.system_logs;
  DELETE FROM public.system_settings;
  
  -- Note: We do NOT delete users (auth.users) or profiles to maintain access.
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.reset_system_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_system_data() TO service_role;
