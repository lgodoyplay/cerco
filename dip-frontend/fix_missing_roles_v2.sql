-- FIX MISSING ROLES IN SETTINGS (V2 - SAFE)
-- This script ensures that the 'roles' setting exists and includes 'Diretor'
-- It also handles the case where 'updated_at' column might be missing

DO $$
DECLARE
    current_roles jsonb;
    new_roles jsonb;
BEGIN
    -- 0. Check if updated_at column exists in system_settings, if not create it
    BEGIN
        ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    EXCEPTION
        WHEN OTHERS THEN 
            RAISE NOTICE 'Could not add updated_at column (might be a view or permission issue), proceeding without it.';
    END;

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
        -- We try to insert with updated_at, if it fails we fallback
        BEGIN
            INSERT INTO public.system_settings (key, value, updated_at)
            VALUES ('roles', new_roles, now());
        EXCEPTION WHEN undefined_column THEN
             INSERT INTO public.system_settings (key, value)
             VALUES ('roles', new_roles);
        END;
        
        RAISE NOTICE 'Roles setting created with default values (including Diretor).';
    ELSE
        -- Update existing
        BEGIN
            UPDATE public.system_settings
            SET value = new_roles,
                updated_at = now()
            WHERE key = 'roles';
        EXCEPTION WHEN undefined_column THEN
            UPDATE public.system_settings
            SET value = new_roles
            WHERE key = 'roles';
        END;
        
        RAISE NOTICE 'Roles setting updated to include Diretor.';
    END IF;

END $$;
