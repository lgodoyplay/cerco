
-- Verification Script: Role Sync between Frontend (simulated) and Auth/Profiles

-- 1. Simulate creating a new user with a Custom Role (as if coming from the Frontend)
-- The frontend calls 'create_user_command' with a role selected from the list.
-- Let's use a role that definitely doesn't exist by default: "Operador Tático K9"

DO $$
DECLARE
    new_user_id uuid;
    custom_role text := 'Operador Tático K9';
    check_profile_role text;
    check_meta_role text;
BEGIN
    RAISE NOTICE 'Starting Verification for Role: %', custom_role;

    -- Call the RPC function (simulating SettingsContext.jsx > addUser)
    -- Note: We use a random email to avoid conflicts if run multiple times
    new_user_id := public.create_user_command(
        p_email => 'k9_unit_' || floor(random() * 1000)::text || '@dip.system',
        p_password => 'senha123',
        p_full_name => 'Agente K9 Teste',
        p_passport_id => 'K9-001',
        p_role => custom_role,
        p_permissions => '["arrest_view", "operations_manage"]'::jsonb
    );

    RAISE NOTICE 'User Created with ID: %', new_user_id;

    -- 2. Verify public.profiles
    SELECT role INTO check_profile_role
    FROM public.profiles
    WHERE id = new_user_id;

    IF check_profile_role = custom_role THEN
        RAISE NOTICE 'SUCCESS: public.profiles has correct role: %', check_profile_role;
    ELSE
        RAISE EXCEPTION 'FAILURE: public.profiles has wrong role: % (Expected: %)', check_profile_role, custom_role;
    END IF;

    -- 3. Verify auth.users metadata
    SELECT raw_user_meta_data->>'role' INTO check_meta_role
    FROM auth.users
    WHERE id = new_user_id;

    IF check_meta_role = custom_role THEN
        RAISE NOTICE 'SUCCESS: auth.users metadata has correct role: %', check_meta_role;
    ELSE
        RAISE EXCEPTION 'FAILURE: auth.users metadata has wrong role: % (Expected: %)', check_meta_role, custom_role;
    END IF;

    -- Cleanup (Optional: remove the test user to keep DB clean)
    -- PERFORM public.delete_user_command(new_user_id);
    -- RAISE NOTICE 'Cleanup: Test user deleted.';

END $$;
