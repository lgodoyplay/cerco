-- CONFIGURE NEW USER DEFAULTS (ALUNO)
-- 1. Add 'Aluno' to system_settings roles if not present
-- 2. Update create_user_command to default to 'Aluno'
-- 3. Update handle_new_user to assign default permissions

-- 1. UPDATE SYSTEM SETTINGS (ROLES)
DO $$
DECLARE
    current_roles jsonb;
    new_roles jsonb;
BEGIN
    -- Fetch current roles
    SELECT value INTO current_roles FROM public.system_settings WHERE key = 'roles';
    
    -- Let's construct a standard set of roles including Aluno
    new_roles := '[
      {"id": 1, "title": "Diretor Geral", "hierarchy": 1},
      {"id": 2, "title": "Coordenador", "hierarchy": 2},
      {"id": 3, "title": "Escrivão", "hierarchy": 3},
      {"id": 4, "title": "Agente", "hierarchy": 4},
      {"id": 5, "title": "Aluno", "hierarchy": 5}
    ]'::jsonb;
    
    -- Update or Insert
    INSERT INTO public.system_settings (key, value)
    VALUES ('roles', new_roles)
    ON CONFLICT (key) DO UPDATE
    SET value = new_roles;
    
    RAISE NOTICE 'Updated system_settings roles with Aluno';
END $$;

-- 2. UPDATE CREATE_USER_COMMAND (Default Role = 'Aluno')
CREATE OR REPLACE FUNCTION public.create_user_command(
  p_email text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_passport_id text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_permissions jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    new_user_id uuid;
    v_instance_id uuid;
    v_email text := COALESCE(p_email, '');
    v_password text := COALESCE(p_password, '123456');
    v_full_name text := COALESCE(p_full_name, 'Novo Usuário');
    v_passport_id text := COALESCE(p_passport_id, '');
    v_role text := COALESCE(p_role, 'Aluno'); -- CHANGED DEFAULT
    v_permissions jsonb := COALESCE(p_permissions, '[]'::jsonb);
    final_email text;
BEGIN
    -- Format Email
    IF position('@' in v_email) > 0 THEN
        final_email := LOWER(v_email);
    ELSE
        final_email := LOWER(v_email) || '@dip.system';
    END IF;

    -- Generate User ID
    new_user_id := gen_random_uuid();

    -- Create User in Auth
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token, is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 
        new_user_id, 
        'authenticated', 
        'authenticated', 
        final_email, 
        crypt(v_password, gen_salt('bf')), 
        now(), 
        NULL, 
        NULL, 
        '{"provider": "email", "providers": ["email"]}', 
        jsonb_build_object(
            'full_name', v_full_name, 
            'role', v_role, 
            'passport_id', v_passport_id,
            'permissions', v_permissions
        ), 
        now(), 
        now(), 
        '', '', '', '', 
        FALSE
    );

    -- Create Identity
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), new_user_id, jsonb_build_object('sub', new_user_id, 'email', final_email, 'email_verified', true, 'phone_verified', false), 'email', final_email, NULL, now(), now()
    );

    -- HANDLE PROFILE (Trigger will likely handle this, but we ensure it matches)
    INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
    VALUES (
        new_user_id, v_full_name, v_role, v_permissions, v_passport_id, final_email, TRUE
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        passport_id = EXCLUDED.passport_id,
        email = EXCLUDED.email;

    RETURN new_user_id;
END;
$$;

-- 3. UPDATE HANDLE_NEW_USER TRIGGER (Default Role & Permissions)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_role text;
    v_full_name text;
    v_passport_id text;
    v_permissions jsonb;
BEGIN
    v_role := new.raw_user_meta_data->>'role';
    v_full_name := new.raw_user_meta_data->>'full_name';
    v_passport_id := new.raw_user_meta_data->>'passport_id';
    v_permissions := COALESCE(new.raw_user_meta_data->'permissions', '[]'::jsonb);

    -- Defaults
    IF v_role IS NULL OR v_role = '' THEN 
        v_role := 'Aluno'; 
    END IF;
    
    IF v_full_name IS NULL THEN 
        v_full_name := 'Novo Usuário'; 
    END IF;
    
    -- FORCE PERMISSIONS FOR ALUNO
    -- If role is Aluno and permissions are empty, assign default permissions
    IF v_role = 'Aluno' AND (v_permissions IS NULL OR jsonb_array_length(v_permissions) = 0) THEN
        v_permissions := '["communication_view", "logistics_view"]'::jsonb;
    END IF;
    
    -- Sync to profiles
    INSERT INTO public.profiles (id, full_name, role, permissions, passport_id, email, must_change_password)
    VALUES (
        new.id,
        v_full_name,
        v_role,
        v_permissions,
        v_passport_id,
        new.email,
        FALSE
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        passport_id = EXCLUDED.passport_id,
        email = EXCLUDED.email;

    RETURN new;
END;
$$;
