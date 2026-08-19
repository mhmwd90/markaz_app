/*
# Make handle_new_user trigger idempotent (fix "Database error querying schema")

1. Problem
The `on_auth_user_created` trigger calls `handle_new_user()` which does a plain
INSERT into `profiles`. If the row already exists (e.g. user was created via
SQL bootstrap before the trigger ran, or re-invoked), the INSERT raises a
primary-key violation. Supabase surfaces this generic error to the client as
"Database error querying schema" — even on login, because auth events can
re-fire the trigger.

2. Fix
Rewrite `handle_new_user()` to use `INSERT ... ON CONFLICT (id) DO NOTHING`,
so a duplicate profile row is silently skipped instead of raising an error.
Also set a explicit search_path for security (clears the advisor warning).
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
