-- Function to reset system data
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION reset_system_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Truncate tables with CASCADE to handle foreign keys automatically
  -- This is much faster and cleaner than DELETE
  TRUNCATE TABLE
    license_attachments,
    weapon_licenses,
    logistics_custody,
    logistics_requisitions,
    financial_assets,
    financial_records,
    prf_photos,
    prf_seizures,
    prf_fines,
    hearings,
    release_orders,
    petitions,
    provas,
    cursos_policiais,
    investigacoes,
    prisoes,
    procurados,
    boletins,
    candidatos,
    cursos,
    denuncias,
    notifications,
    system_logs
  CASCADE;

  -- Optional: Reset system settings but keep keys (if needed)
  -- DELETE FROM system_settings WHERE key != 'PLACEHOLDER_KEY';
  
  -- Note: We do NOT delete from auth.users or public.profiles to preserve accounts
END;
$$;

-- Grant execute permission to authenticated users (or service_role only if you prefer)
GRANT EXECUTE ON FUNCTION reset_system_data() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_system_data() TO service_role;
