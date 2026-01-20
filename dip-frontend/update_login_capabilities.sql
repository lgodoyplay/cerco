-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Function to sync emails from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_emails_to_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
  AND (p.email IS NULL OR p.email != u.email);
END;
$$;

-- Run the sync immediately
SELECT public.sync_emails_to_profiles();

-- 3. Trigger to keep email synced on auth.users update
CREATE OR REPLACE FUNCTION public.handle_user_email_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;
CREATE TRIGGER on_auth_user_email_update
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_email_sync();

-- 4. Update handle_new_user to include email
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id, 
    new.raw_user_meta_data->>'name', 
    'Agente DPF',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- 5. Enable RLS on email column (implicitly covered by existing policies, but ensure public read is okay for login resolution?)
-- Actually, for login resolution (finding email by passport_id), we need to be able to read profiles WITHOUT being authenticated (if we do it client side).
-- BUT RLS usually blocks public access.
-- So we need a Postgres Function to resolve the email, bypassing RLS.

CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
DECLARE
  found_email text;
BEGIN
  SELECT email INTO found_email
  FROM public.profiles
  WHERE passport_id = identifier
     OR email = identifier
  LIMIT 1;
  
  RETURN found_email;
END;
$$;

-- Grant execute to public/anon so they can call it before login
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_identifier(text) TO service_role;
