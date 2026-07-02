-- TEST SIMULATION (Verify Fix)
-- Run this AFTER running 'fix_login_and_roles_final.sql'
-- This script simulates the exact call the Frontend makes.

DO $$
DECLARE
  v_user_id uuid;
  -- Generate a random email to avoid collision in repeated tests
  v_rand_suffix text := floor(random()*100000)::text;
  v_email text := 'test_sim_' || v_rand_suffix || '@dip.local';
  v_passport text := '99' || v_rand_suffix; -- Unique Passport ID
BEGIN
  RAISE NOTICE '---------------------------------------------------';
  RAISE NOTICE 'STARTING FRONTEND SIMULATION TEST';
  RAISE NOTICE 'Target Email: %', v_email;
  RAISE NOTICE 'Target Passport: %', v_passport;
  RAISE NOTICE '---------------------------------------------------';
  
  -- 1. CALL FUNCTION WITH FRONTEND PARAMS (p_*)
  -- This mimics: supabase.rpc('create_user_command', { p_email: ..., p_role: ... })
  v_user_id := public.create_user_command(
    p_email := v_email,
    p_password := 'senha123',
    p_full_name := 'Usuario Teste Painel',
    p_passport_id := v_passport,
    p_role := 'Diretor',
    p_permissions := '[]'::jsonb
  );
  
  RAISE NOTICE '✅ User Created Successfully! ID: %', v_user_id;
  
  -- 2. VERIFY ROLE WAS SAVED IN PROFILES
  PERFORM 1 FROM public.profiles 
  WHERE id = v_user_id AND role = 'Diretor';
  
  IF FOUND THEN
    RAISE NOTICE '✅ ROLE VERIFICATION PASSED: Role is "Diretor"';
  ELSE
    RAISE EXCEPTION '❌ ROLE VERIFICATION FAILED: Role was NOT saved correctly.';
  END IF;

  -- 3. VERIFY LOGIN CAPABILITY (Smart Login)
  DECLARE
    v_login_email text;
  BEGIN
    v_login_email := public.get_email_by_identifier(v_passport);
    IF v_login_email = v_email THEN
        RAISE NOTICE '✅ LOGIN VERIFICATION PASSED: Smart Login found email %', v_login_email;
    ELSE
        RAISE EXCEPTION '❌ LOGIN VERIFICATION FAILED: Smart Login could not find user by passport_id (Found: %, Expected: %)', v_login_email, v_email;
    END IF;
  END;

  -- 4. VERIFY PASSWORD HASH
  DECLARE
    v_stored_hash text;
  BEGIN
    SELECT encrypted_password INTO v_stored_hash FROM auth.users WHERE id = v_user_id;
    
    -- Verify if the stored hash matches the password 'senha123'
    -- Note: We use the same crypt function. If this fails, the hash is wrong or crypt is behaving differently.
    IF v_stored_hash = crypt('senha123', v_stored_hash) THEN
        RAISE NOTICE '✅ PASSWORD VERIFICATION PASSED: Hash matches.';
    ELSE
        RAISE EXCEPTION '❌ PASSWORD VERIFICATION FAILED: Hash does not match. Password is corrupted.';
    END IF;
  END;

  -- 5. VERIFY AUTH.IDENTITIES (Crucial for Login)
  BEGIN
    PERFORM 1 FROM auth.identities 
    WHERE user_id = v_user_id AND provider = 'email';
    
    IF FOUND THEN
        RAISE NOTICE '✅ IDENTITY VERIFICATION PASSED: User has an email identity.';
    ELSE
        RAISE EXCEPTION '❌ IDENTITY VERIFICATION FAILED: User was created but has NO identity linked. Login will fail.';
    END IF;
  END;

  RAISE NOTICE '---------------------------------------------------';
  RAISE NOTICE 'ALL TESTS PASSED - SYSTEM IS WORKING';
  RAISE NOTICE '---------------------------------------------------';

END $$;
