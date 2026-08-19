/*
# Add unique constraints on teachers.profile_id and parents.profile_id

1. Changes
- Add UNIQUE constraints on teachers.profile_id and parents.profile_id so each
  profile maps to at most one teacher / parent row. This makes the seed upserts
  (ON CONFLICT (profile_id)) valid and prevents duplicate staff/parent records.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='teachers_profile_id_key') THEN
    ALTER TABLE teachers ADD CONSTRAINT teachers_profile_id_key UNIQUE (profile_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='parents_profile_id_key') THEN
    ALTER TABLE parents ADD CONSTRAINT parents_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;
