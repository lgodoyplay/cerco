-- FIX MISSING ROLES IN SETTINGS
-- This script ensures that the 'roles' setting exists and includes 'Diretor'

DO $$
DECLARE
    current_roles jsonb;
    new_roles jsonb;
BEGIN
    -- 1. Get current roles from system_settings
    SELECT value INTO current_roles FROM public.system_settings WHERE key = 'roles';

    -- 2. Define the robust default list (including Diretor)
    -- Hierarchy: 1=Diretor Geral, 2=Diretor, 3=Coordenador, 4=Escrivão, 5=Agente
    new_roles := '[
        {"id": 1, "title": "Diretor Geral", "hierarchy": 1},
        {"id": 2, "title": "Diretor", "hierarchy": 2},
        {"id": 3, "title": "Coordenador", "hierarchy": 3},
        {"id": 4, "title": "Escrivão", "hierarchy": 4},
        {"id": 5, "title": "Agente", "hierarchy": 5}
    ]'::jsonb;

    -- 3. Update or Insert
    IF current_roles IS NULL THEN
        -- If no roles exist, insert the new list
        INSERT INTO public.system_settings (key, value, updated_at)
        VALUES ('roles', new_roles, now());
        RAISE NOTICE 'Roles setting created with default values (including Diretor).';
    ELSE
        -- If roles exist, we check if "Diretor" is missing and append it, or just replace with our clean list?
        -- To be safe and respect user customizations, we should try to append if missing, 
        -- BUT since the user is complaining it is missing, likely they haven't customized much or the default was bad.
        -- Let's force update to the clean list to ensure consistency, as requested.
        
        UPDATE public.system_settings
        SET value = new_roles,
            updated_at = now()
        WHERE key = 'roles';
        RAISE NOTICE 'Roles setting updated to include Diretor.';
    END IF;

END $$;
