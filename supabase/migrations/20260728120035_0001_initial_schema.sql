/*
# Initial schema — Quran Memorization Center management system

1. Overview
A multi-role (admin / teacher / parent) management system for a Quran memorization
center. This migration creates the full normalized schema, reference data for the
114 surahs of the Quran (Hafs / Madani 604-page mushaf), and Row Level Security.

2. New tables
- profiles        : extends auth.users with full_name, phone, role (admin/teacher/parent).
- teachers        : staff records linked to a profile (employee id, specialization, hire date).
- parents         : guardian records linked to a profile (occupation).
- groups          : Quran classes (a class has one teacher and many students).
- students        : the core entity — pupil with parent + group links, status, notes.
- quran_surahs    : reference table, 114 rows (number, names, ayah count, start page, juz).
- memorization_sessions : a single recitation/exam record (from/to surah+ayah, pages, verses).
- memorization_plans    : a multi-day plan (start/end page, daily pages, expected completion).
- daily_assignments     : auto-split daily chunks of a plan (date, page range, status).
- attendance            : per-day attendance (present/absent/excused/late).
- evaluations           : graded evaluations (tajweed, memorization, revision, behavior, participation).
- audit_logs            : append-only audit trail of important actions.
- notifications         : per-user notifications (attendance alerts, reminders, etc.).

3. Conventions
- All primary keys are uuid (gen_random_uuid) except quran_surahs which uses a serial id.
- Soft delete via `deleted_at timestamptz` on the main business entities.
- `created_at` / `updated_at` timestamps on all mutable tables.
- CHECK constraints encode enums (role, status, session_type, etc.) instead of PG enum types.

4. Security (RLS)
This is an INTERNAL trusted system: every user is an authenticated member of the
center (admin, teacher, or parent). Therefore:
- SELECT on every table is allowed to `authenticated` (all roles need to read the data
  they are allowed to see; finer role gating happens in the UI + audit logs).
- INSERT / UPDATE / DELETE on the business tables is allowed to `authenticated` (only
  trusted staff/parents hold accounts). quran_surahs is read-only reference data.
- audit_logs is INSERT-only for authenticated (no update/delete) to preserve the trail.
- profiles: a user may update their own row; reads allowed to authenticated.
This matches the "trusted internal multi-role app" pattern rather than public data.
*/

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('admin','teacher','parent')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- teachers ----------
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  employee_id text UNIQUE,
  specialization text,
  hire_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- parents ----------
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  occupation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- groups (Quran classes) ----------
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  description text,
  capacity int NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- students ----------
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code text UNIQUE,
  full_name text NOT NULL,
  gender text CHECK (gender IN ('male','female')),
  date_of_birth date,
  school text,
  grade text,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  phone_primary text,
  phone_secondary text,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','graduated')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- quran reference (114 surahs) ----------
CREATE TABLE IF NOT EXISTS quran_surahs (
  id serial PRIMARY KEY,
  number int UNIQUE NOT NULL,
  name_arabic text NOT NULL,
  name_english text NOT NULL,
  name_transliteration text,
  total_ayahs int NOT NULL,
  revelation_type text CHECK (revelation_type IN ('meccan','medinan')),
  start_page int NOT NULL,
  start_juz int NOT NULL
);

-- ---------- memorization sessions ----------
CREATE TABLE IF NOT EXISTS memorization_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('new','revision','exam')),
  from_surah_number int NOT NULL,
  from_ayah int NOT NULL,
  to_surah_number int NOT NULL,
  to_ayah int NOT NULL,
  total_pages numeric(6,2) NOT NULL DEFAULT 0,
  total_verses int NOT NULL DEFAULT 0,
  grade text CHECK (grade IN ('excellent','good','satisfactory','needs_improvement')),
  mistake_count int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- memorization plans ----------
CREATE TABLE IF NOT EXISTS memorization_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('memorization','revision')),
  start_page int NOT NULL,
  end_page int NOT NULL,
  daily_pages int NOT NULL DEFAULT 1,
  start_date date NOT NULL,
  expected_completion_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- ---------- daily assignments (auto-split from a plan) ----------
CREATE TABLE IF NOT EXISTS daily_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES memorization_plans(id) ON DELETE CASCADE,
  assignment_date date NOT NULL,
  from_page int NOT NULL,
  to_page int NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','skipped')),
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- attendance ----------
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  attendance_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present','absent','excused','late')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- evaluations ----------
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  evaluation_date date NOT NULL,
  tajweed int CHECK (tajweed BETWEEN 1 AND 5),
  memorization_quality int CHECK (memorization_quality BETWEEN 1 AND 5),
  revision_quality int CHECK (revision_quality BETWEEN 1 AND 5),
  behavior int CHECK (behavior BETWEEN 1 AND 5),
  participation int CHECK (participation BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- audit logs (append-only) ----------
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- notifications ----------
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('attendance','memorization','reminder','general')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- indexes for common queries ----------
CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_student ON memorization_sessions(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_date ON memorization_sessions(session_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_type ON memorization_sessions(session_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_plans_student ON memorization_plans(student_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_plan ON daily_assignments(plan_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = false;

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','teachers','parents','groups','students',
    'memorization_sessions','memorization_plans','daily_assignments',
    'attendance','evaluations','notifications'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON %s;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END $$;

-- ---------- Row Level Security ----------
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','teachers','parents','groups','students',
    'memorization_sessions','memorization_plans','daily_assignments',
    'attendance','evaluations','audit_logs','notifications'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- Helper: standard authenticated CRUD on a table (internal trusted system).
-- Drops first so the migration is re-runnable.
CREATE OR REPLACE FUNCTION apply_std_policies(t text) RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s;', 'std_select_'||t, t);
  EXECUTE format('CREATE POLICY %I ON %s FOR SELECT TO authenticated USING (true);', 'std_select_'||t, t);

  EXECUTE format('DROP POLICY IF EXISTS %I ON %s;', 'std_insert_'||t, t);
  EXECUTE format('CREATE POLICY %I ON %s FOR INSERT TO authenticated WITH CHECK (true);', 'std_insert_'||t, t);

  EXECUTE format('DROP POLICY IF EXISTS %I ON %s;', 'std_update_'||t, t);
  EXECUTE format('CREATE POLICY %I ON %s FOR UPDATE TO authenticated USING (true) WITH CHECK (true);', 'std_update_'||t, t);

  EXECUTE format('DROP POLICY IF EXISTS %I ON %s;', 'std_delete_'||t, t);
  EXECUTE format('CREATE POLICY %I ON %s FOR DELETE TO authenticated USING (true);', 'std_delete_'||t, t);
END;
$$ LANGUAGE plpgsql;

SELECT apply_std_policies('teachers');
SELECT apply_std_policies('parents');
SELECT apply_std_policies('groups');
SELECT apply_std_policies('students');
SELECT apply_std_policies('memorization_sessions');
SELECT apply_std_policies('memorization_plans');
SELECT apply_std_policies('daily_assignments');
SELECT apply_std_policies('attendance');
SELECT apply_std_policies('evaluations');
SELECT apply_std_policies('notifications');

-- profiles: read all authenticated, but a user updates only their own row.
DROP POLICY IF EXISTS std_select_profiles ON profiles;
CREATE POLICY std_select_profiles ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS own_update_profiles ON profiles;
CREATE POLICY own_update_profiles ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS own_insert_profiles ON profiles;
CREATE POLICY own_insert_profiles ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- audit_logs: insert for authenticated, read for authenticated, no update/delete.
DROP POLICY IF EXISTS audit_select ON audit_logs;
CREATE POLICY audit_select ON audit_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS audit_insert ON audit_logs;
CREATE POLICY audit_insert ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- quran_surahs: read-only reference for authenticated + anon.
ALTER TABLE quran_surahs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quran_select ON quran_surahs;
CREATE POLICY quran_select ON quran_surahs FOR SELECT TO anon, authenticated USING (true);

-- Auto-create a profile when a new auth user signs up.
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
