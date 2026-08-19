/*
# Helper SQL functions — dashboard stats, page/verse math, assignment generation

1. Functions added
- get_page_for_surah_ayah(p_surah int, p_ayah int) -> int
    Returns the 604-page mushaf page containing the given surah+ayah.
- count_verses_between(from_surah, from_ayah, to_surah, to_ayah) -> int
    Inclusive verse count between two coordinates.
- generate_daily_assignments(plan_uuid uuid) -> void
    Splits a plan into daily assignments, skipping Fridays, sets expected completion date.
- get_dashboard_stats(p_role text, p_user_id uuid) -> jsonb
    Role-aware dashboard statistics.

2. Notes
- SECURITY DEFINER so functions can read reference + business tables under RLS.
- Re-runnable (CREATE OR REPLACE).
*/

CREATE OR REPLACE FUNCTION get_page_for_surah_ayah(p_surah int, p_ayah int)
RETURNS int AS $$
DECLARE
  s_start_page int;
  s_total_ayahs int;
  next_start_page int;
  span_pages int;
  per_page numeric;
BEGIN
  SELECT start_page, total_ayahs INTO s_start_page, s_total_ayahs
  FROM quran_surahs WHERE number = p_surah;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT start_page INTO next_start_page
  FROM quran_surahs WHERE number = p_surah + 1;
  IF NOT FOUND THEN next_start_page := 605; END IF;

  span_pages := GREATEST(next_start_page - s_start_page, 1);
  per_page := s_total_ayahs::numeric / span_pages;
  RETURN LEAST(s_start_page + FLOOR((p_ayah - 1) * per_page)::int, next_start_page - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_verses_between(from_surah int, from_ayah int, to_surah int, to_ayah int)
RETURNS int AS $$
DECLARE
  total int := 0;
  cur_surah int;
  cur_ayah int;
  surah_ayahs int;
BEGIN
  cur_surah := from_surah; cur_ayah := from_ayah;
  WHILE cur_surah < to_surah OR (cur_surah = to_surah AND cur_ayah <= to_ayah) LOOP
    SELECT total_ayahs INTO surah_ayahs FROM quran_surahs WHERE number = cur_surah;
    IF cur_surah = to_surah THEN
      total := total + (to_ayah - cur_ayah + 1);
      EXIT;
    ELSE
      total := total + (surah_ayahs - cur_ayah + 1);
      cur_surah := cur_surah + 1;
      cur_ayah := 1;
    END IF;
  END LOOP;
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_daily_assigngments_fn(plan_uuid uuid)
RETURNS void AS $$
DECLARE
  p_start_page int;
  p_end_page int;
  p_daily int;
  p_start_date date;
  cur_date date;
  cur_page int;
  to_page int;
  done boolean := false;
BEGIN
  SELECT start_page, end_page, daily_pages, start_date
  INTO p_start_page, p_end_page, p_daily, p_start_date
  FROM memorization_plans WHERE id = plan_uuid;
  IF NOT FOUND THEN RETURN; END IF;

  DELETE FROM daily_assignments WHERE plan_id = plan_uuid;

  cur_date := p_start_date;
  cur_page := p_start_page;

  WHILE cur_page <= p_end_page AND NOT done LOOP
    IF EXTRACT(DOW FROM cur_date)::int <> 5 THEN
      to_page := LEAST(cur_page + p_daily - 1, p_end_page);
      INSERT INTO daily_assignments (plan_id, assignment_date, from_page, to_page, status)
      VALUES (plan_uuid, cur_date, cur_page, to_page, 'pending');
      cur_page := to_page + 1;
    END IF;
    cur_date := cur_date + 1;
    IF cur_page > p_end_page THEN done := true; END IF;
  END LOOP;

  UPDATE memorization_plans
  SET expected_completion_date = cur_date - 1
  WHERE id = plan_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_role text, p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  my_teacher_id uuid;
  my_parent_id uuid;
BEGIN
  IF p_role = 'admin' THEN
    SELECT jsonb_build_object(
      'total_students', (SELECT count(*) FROM students WHERE deleted_at IS NULL),
      'active_teachers', (SELECT count(*) FROM teachers WHERE status='active' AND deleted_at IS NULL),
      'active_groups', (SELECT count(*) FROM groups WHERE status='active' AND deleted_at IS NULL),
      'sessions_30d', (SELECT count(*) FROM memorization_sessions WHERE deleted_at IS NULL AND session_date >= CURRENT_DATE - 30),
      'attendance_present_30d', (SELECT count(*) FROM attendance WHERE status='present' AND attendance_date >= CURRENT_DATE - 30),
      'attendance_total_30d', (SELECT count(*) FROM attendance WHERE attendance_date >= CURRENT_DATE - 30),
      'new_students_30d', (SELECT count(*) FROM students WHERE deleted_at IS NULL AND enrollment_date >= CURRENT_DATE - 30),
      'graduated', (SELECT count(*) FROM students WHERE status='graduated' AND deleted_at IS NULL),
      'recent_sessions', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', id, 'student_id', student_id, 'session_date', session_date,
          'session_type', session_type, 'total_pages', total_pages, 'total_verses', total_verses
        ))
        FROM (SELECT * FROM memorization_sessions WHERE deleted_at IS NULL ORDER BY session_date DESC LIMIT 8) sub
      ), '[]'::jsonb)
    ) INTO result;

  ELSIF p_role = 'teacher' THEN
    SELECT id INTO my_teacher_id FROM teachers WHERE profile_id = p_user_id AND deleted_at IS NULL LIMIT 1;
    SELECT jsonb_build_object(
      'teacher_id', my_teacher_id,
      'my_students', (SELECT count(*) FROM students s WHERE s.deleted_at IS NULL AND s.group_id IN (SELECT id FROM groups WHERE teacher_id = my_teacher_id)),
      'my_groups', (SELECT count(*) FROM groups WHERE teacher_id = my_teacher_id AND deleted_at IS NULL),
      'today_sessions', (SELECT count(*) FROM memorization_sessions WHERE teacher_id = my_teacher_id AND session_date = CURRENT_DATE AND deleted_at IS NULL),
      'today_attendance', (SELECT count(*) FROM attendance WHERE teacher_id = my_teacher_id AND attendance_date = CURRENT_DATE),
      'sessions_7d', (SELECT count(*) FROM memorization_sessions WHERE teacher_id = my_teacher_id AND session_date >= CURRENT_DATE - 7 AND deleted_at IS NULL),
      'pending_plans', (SELECT count(*) FROM memorization_plans WHERE teacher_id = my_teacher_id AND status='active' AND deleted_at IS NULL),
      'recent_sessions', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', id, 'student_id', student_id, 'session_date', session_date,
          'session_type', session_type, 'total_pages', total_pages, 'total_verses', total_verses
        ))
        FROM (SELECT * FROM memorization_sessions WHERE teacher_id = my_teacher_id AND deleted_at IS NULL ORDER BY session_date DESC LIMIT 8) sub
      ), '[]'::jsonb)
    ) INTO result;

  ELSIF p_role = 'parent' THEN
    SELECT id INTO my_parent_id FROM parents WHERE profile_id = p_user_id AND deleted_at IS NULL LIMIT 1;
    SELECT jsonb_build_object(
      'parent_id', my_parent_id,
      'my_children', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', s.id, 'name', s.full_name, 'group', g.name, 'status', s.status
        ))
        FROM (SELECT s.id, s.full_name, g.name, s.status FROM students s LEFT JOIN groups g ON g.id = s.group_id
              WHERE s.parent_id = my_parent_id AND s.deleted_at IS NULL) sub
      ), '[]'::jsonb),
      'children_sessions_30d', (SELECT count(*) FROM memorization_sessions ms
         JOIN students s ON s.id = ms.student_id
         WHERE s.parent_id = my_parent_id AND ms.session_date >= CURRENT_DATE - 30 AND ms.deleted_at IS NULL),
      'children_attendance_present', (SELECT count(*) FROM attendance a
         JOIN students s ON s.id = a.student_id
         WHERE s.parent_id = my_parent_id AND a.status='present'),
      'children_attendance_total', (SELECT count(*) FROM attendance a
         JOIN students s ON s.id = a.student_id
         WHERE s.parent_id = my_parent_id)
    ) INTO result;
  ELSE
    result := jsonb_build_object('error','unknown_role');
  END IF;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
