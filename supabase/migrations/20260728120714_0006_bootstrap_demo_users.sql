/*
# Bootstrap demo auth users + profiles via SQL (pgcrypto)

1. Purpose
Creates 7 demo accounts (1 admin, 3 teachers, 3 parents) in auth.users with
crypt() passwords so they can sign in. The existing `on_auth_user_created`
trigger creates the matching `profiles` row automatically.

2. Demo credentials (all password = demo1234)
- admin@qurancenter.test       (Center Administrator)
- teacher1@qurancenter.test    (Ustadh Abdulrahman)
- teacher2@qurancenter.test    (Ustadha Khadija)
- teacher3@qurancenter.test    (Ustadh Bilal)
- parent1@qurancenter.test     (Mahmoud Al-Rashid)
- parent2@qurancenter.test     (Layla Al-Zahra)
- parent3@qurancenter.test     (Omar Ibn Adam)

3. Idempotency
Each insert guarded by `WHERE NOT EXISTS`. confirmed_at is a generated column
so it is omitted.
*/

DO $$
DECLARE
  pw text := crypt('demo1234', gen_salt('bf'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='admin@qurancenter.test') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@qurancenter.test', pw, now(), '', '', '', jsonb_build_object('full_name','Center Administrator','role','admin'), jsonb_build_object('role','admin'), now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='teacher1@qurancenter.test') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'teacher1@qurancenter.test', pw, now(), '', '', '', jsonb_build_object('full_name','Ustadh Abdulrahman','role','teacher'), jsonb_build_object('role','teacher'), now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='teacher2@qurancenter.test') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'teacher2@qurancenter.test', pw, now(), '', '', '', jsonb_build_object('full_name','Ustadha Khadija','role','teacher'), jsonb_build_object('role','teacher'), now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='teacher3@qurancenter.test') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'teacher3@qurancenter.test', pw, now(), '', '', '', jsonb_build_object('full_name','Ustadh Bilal','role','teacher'), jsonb_build_object('role','teacher'), now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='parent1@qurancenter.test') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'parent1@qurancenter.test', pw, now(), '', '', '', jsonb_build_object('full_name','Mahmoud Al-Rashid','role','parent'), jsonb_build_object('role','parent'), now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='parent2@qurancenter.test') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'parent2@qurancenter.test', pw, now(), '', '', '', jsonb_build_object('full_name','Layla Al-Zahra','role','parent'), jsonb_build_object('role','parent'), now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email='parent3@qurancenter.test') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'parent3@qurancenter.test', pw, now(), '', '', '', jsonb_build_object('full_name','Omar Ibn Adam','role','parent'), jsonb_build_object('role','parent'), now(), now());
  END IF;
END $$;
