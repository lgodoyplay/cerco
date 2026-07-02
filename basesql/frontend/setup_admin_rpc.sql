-- Função para atualizar email de usuário (Admin)
CREATE OR REPLACE FUNCTION public.admin_update_user_email(target_user_id uuid, new_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se quem chama é admin/diretor (opcional, mas recomendado)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('Diretor DPF', 'Coordenador DPF', 'Admin', 'Instrutor')
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
