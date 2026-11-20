GRANT USAGE ON SCHEMA public TO authenticated;

-- Função para atualizar email de usuário (Admin)
CREATE OR REPLACE FUNCTION public.admin_update_user_email(target_user_id uuid, new_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Verifica se quem chama é admin/diretor (opcional, mas recomendado)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      lower(COALESCE(role, '')) LIKE '%admin%'
      OR lower(COALESCE(role, '')) LIKE '%diretor%'
      OR lower(COALESCE(role, '')) LIKE '%comandante%'
      OR lower(COALESCE(role, '')) LIKE '%superuser%'
      OR lower(COALESCE(role, '')) LIKE '%developer%'
      OR lower(COALESCE(permissions::text, '')) LIKE '%admin_access%'
      OR lower(COALESCE(permissions::text, '')) LIKE '%superuser%'
      OR lower(COALESCE(permissions::text, '')) LIKE '%developer%'
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE auth.users
  SET email = new_email,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      email_change = '',
      email_change_token_new = '',
      email_change_confirm_status = 0
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_email(uuid, text) TO authenticated;

-- Função para redefinir senha de usuário (Admin)
CREATE OR REPLACE FUNCTION public.admin_update_user_password(target_user_id uuid, new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF new_password IS NULL OR length(trim(new_password)) < 6 THEN
    RAISE EXCEPTION 'A senha deve ter pelo menos 6 caracteres';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      lower(COALESCE(role, '')) LIKE '%admin%'
      OR lower(COALESCE(role, '')) LIKE '%diretor%'
      OR lower(COALESCE(role, '')) LIKE '%comandante%'
      OR lower(COALESCE(role, '')) LIKE '%superuser%'
      OR lower(COALESCE(role, '')) LIKE '%developer%'
      OR lower(COALESCE(permissions::text, '')) LIKE '%admin_access%'
      OR lower(COALESCE(permissions::text, '')) LIKE '%superuser%'
      OR lower(COALESCE(permissions::text, '')) LIKE '%developer%'
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  UPDATE public.profiles
  SET must_change_password = false
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) TO authenticated;

-- Função segura para atualizar perfil e cargo sem apagar permissões
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  target_user_id uuid,
  new_full_name text DEFAULT NULL,
  new_role text DEFAULT NULL,
  new_avatar_url text DEFAULT NULL,
  new_passport_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_current_role text;
  v_current_permissions jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      lower(COALESCE(role, '')) LIKE '%admin%'
      OR lower(COALESCE(role, '')) LIKE '%diretor%'
      OR lower(COALESCE(role, '')) LIKE '%comandante%'
      OR lower(COALESCE(role, '')) LIKE '%superuser%'
      OR lower(COALESCE(role, '')) LIKE '%developer%'
      OR lower(COALESCE(permissions::text, '')) LIKE '%admin_access%'
      OR lower(COALESCE(permissions::text, '')) LIKE '%superuser%'
      OR lower(COALESCE(permissions::text, '')) LIKE '%developer%'
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT role, permissions
  INTO v_current_role, v_current_permissions
  FROM public.profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(new_full_name, full_name),
    role = COALESCE(new_role, role),
    avatar_url = COALESCE(new_avatar_url, avatar_url),
    passport_id = COALESCE(new_passport_id, passport_id)
  WHERE id = target_user_id;

  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(COALESCE(new_role, v_current_role)),
      true
    ),
    '{full_name}',
    to_jsonb(COALESCE(new_full_name, (
      SELECT full_name FROM public.profiles WHERE id = target_user_id
    ))),
    true
  ),
  raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(COALESCE(new_role, v_current_role)),
    true
  ),
  updated_at = now()
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, text, text, text, text) TO authenticated;
