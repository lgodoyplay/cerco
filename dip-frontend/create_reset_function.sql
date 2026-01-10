-- Function to reset the entire system (delete all operational data)
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.reset_system_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete data from operational tables
  -- Using TRUNCATE might be faster but DELETE is safer with cascades if FKs are tricky
  -- We use DELETE to ensure triggers fire if any (though currently mostly on auth)
  
  DELETE FROM public.prisoes;
  DELETE FROM public.procurados;
  DELETE FROM public.investigacoes; -- Cascades to provas
  DELETE FROM public.candidatos;
  DELETE FROM public.system_logs;
  DELETE FROM public.cursos; -- Cascades to cursos_policiais
  DELETE FROM public.system_settings;
  
  -- Note: We do NOT delete from 'profiles' to avoid locking out the current user.
  -- The admin remains active.
END;
$$;
