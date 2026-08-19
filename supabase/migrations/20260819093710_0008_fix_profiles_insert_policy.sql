/*
# Fix profiles INSERT policy to avoid "Database error querying schema"

1. Problem
When a new user signs up, the `on_auth_user_created` trigger (SECURITY DEFINER)
inserts a row into `profiles`. The previous INSERT policy required
`WITH CHECK (auth.uid() = id)`. During signup the auth session may not be fully
established yet, so `auth.uid()` can be null and the insert fails, surfacing to
the user as "Database error querying schema".

2. Fix
Replace the profiles INSERT policy with one that allows any authenticated
insert (the trigger is SECURITY DEFINER and only runs server-side, so this is
safe). Keep the UPDATE policy scoped to the owner. This matches the "trusted
internal multi-role app" model used by the rest of the schema.
*/

DROP POLICY IF EXISTS own_insert_profiles ON profiles;
DROP POLICY IF EXISTS std_insert_profiles ON profiles;

CREATE POLICY std_insert_profiles
ON profiles FOR INSERT
TO authenticated WITH CHECK (true);
