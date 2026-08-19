/*
# Fix demo user password hash cost factor

1. Problem
Demo users were created via SQL with crypt('demo1234', gen_salt('bf')) which
produces a bcrypt hash with cost factor 6 ($2a$06$). Supabase GoTrue expects
bcrypt cost factor 10 ($2a$10$). The mismatch causes password verification to
fail, surfacing to the user as "Database error querying schema".

2. Fix
Regenerate all demo user password hashes with cost factor 10 using
gen_salt('bf', 10). This is the same algorithm GoTrue uses internally, so
password verification will succeed.
*/

DO $$
DECLARE
  pw text := crypt('demo1234', gen_salt('bf', 10));
BEGIN
  UPDATE auth.users SET encrypted_password = pw WHERE email = 'admin@qurancenter.test';
  UPDATE auth.users SET encrypted_password = pw WHERE email = 'teacher1@qurancenter.test';
  UPDATE auth.users SET encrypted_password = pw WHERE email = 'teacher2@qurancenter.test';
  UPDATE auth.users SET encrypted_password = pw WHERE email = 'teacher3@qurancenter.test';
  UPDATE auth.users SET encrypted_password = pw WHERE email = 'parent1@qurancenter.test';
  UPDATE auth.users SET encrypted_password = pw WHERE email = 'parent2@qurancenter.test';
  UPDATE auth.users SET encrypted_password = pw WHERE email = 'parent3@qurancenter.test';
END $$;
