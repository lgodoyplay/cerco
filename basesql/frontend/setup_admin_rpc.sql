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

  UPDATE public.profiles
  SET must_change_password = false
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) TO authenticated;
