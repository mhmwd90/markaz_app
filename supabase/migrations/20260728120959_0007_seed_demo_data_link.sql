/*
# Re-link demo seed data (cleanup orphan rows, then re-insert correctly)

1. Purpose
The earlier seed migration partially committed some rows with NULL profile_id
because the demo auth users did not exist yet. Now that profiles exist, we:
  - delete orphan teacher/parent rows (profile_id IS NULL)
  - re-insert teachers/parents linked to real profiles
  - create groups, students, sessions, attendance, evaluations, plans
*/

DO $$
DECLARE
  t1_id uuid; t2_id uuid; t3_id uuid;
  p1_id uuid; p2_id uuid; p3_id uuid;
  teacher1_id uuid; teacher2_id uuid; teacher3_id uuid;
  parent1_id uuid; parent2_id uuid; parent3_id uuid;
  g1_id uuid; g2_id uuid; g3_id uuid;
  s1 uuid; s2 uuid; s3 uuid; s4 uuid; s5 uuid; s6 uuid;
  s7 uuid; s8 uuid; s9 uuid; s10 uuid; s11 uuid; s12 uuid;
BEGIN
  -- remove orphan rows from the partial commit
  DELETE FROM teachers WHERE profile_id IS NULL;
  DELETE FROM parents WHERE profile_id IS NULL;

  SELECT id INTO t1_id  FROM profiles WHERE email='teacher1@qurancenter.test';
  SELECT id INTO t2_id  FROM profiles WHERE email='teacher2@qurancenter.test';
  SELECT id INTO t3_id  FROM profiles WHERE email='teacher3@qurancenter.test';
  SELECT id INTO p1_id  FROM profiles WHERE email='parent1@qurancenter.test';
  SELECT id INTO p2_id  FROM profiles WHERE email='parent2@qurancenter.test';
  SELECT id INTO p3_id  FROM profiles WHERE email='parent3@qurancenter.test';

  INSERT INTO teachers (profile_id, employee_id, specialization, hire_date, status)
  VALUES (t1_id,'EMP-001','Tajweed & Memorization','2023-09-01','active')
  ON CONFLICT (profile_id) DO UPDATE SET specialization=EXCLUDED.specialization
  RETURNING id INTO teacher1_id;
  INSERT INTO teachers (profile_id, employee_id, specialization, hire_date, status)
  VALUES (t2_id,'EMP-002','Revision Specialist','2023-09-01','active')
  ON CONFLICT (profile_id) DO UPDATE SET specialization=EXCLUDED.specialization
  RETURNING id INTO teacher2_id;
  INSERT INTO teachers (profile_id, employee_id, specialization, hire_date, status)
  VALUES (t3_id,'EMP-003','Beginners / Qaida','2024-01-15','active')
  ON CONFLICT (profile_id) DO UPDATE SET specialization=EXCLUDED.specialization
  RETURNING id INTO teacher3_id;

  INSERT INTO parents (profile_id, occupation) VALUES (p1_id,'Engineer')
  ON CONFLICT (profile_id) DO UPDATE SET occupation=EXCLUDED.occupation RETURNING id INTO parent1_id;
  INSERT INTO parents (profile_id, occupation) VALUES (p2_id,'Doctor')
  ON CONFLICT (profile_id) DO UPDATE SET occupation=EXCLUDED.occupation RETURNING id INTO parent2_id;
  INSERT INTO parents (profile_id, occupation) VALUES (p3_id,'Teacher')
  ON CONFLICT (profile_id) DO UPDATE SET occupation=EXCLUDED.occupation RETURNING id INTO parent3_id;

  INSERT INTO groups (name, teacher_id, description, capacity, status)
  SELECT 'Advanced Memorization', teacher1_id, 'Senior students memorizing new juz', 25, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM groups WHERE name='Advanced Memorization') RETURNING id INTO g1_id;
  IF g1_id IS NULL THEN SELECT id INTO g1_id FROM groups WHERE name='Advanced Memorization'; END IF;

  INSERT INTO groups (name, teacher_id, description, capacity, status)
  SELECT 'Revision Circle', teacher2_id, 'Focused revision of memorized portions', 20, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM groups WHERE name='Revision Circle') RETURNING id INTO g2_id;
  IF g2_id IS NULL THEN SELECT id INTO g2_id FROM groups WHERE name='Revision Circle'; END IF;

  INSERT INTO groups (name, teacher_id, description, capacity, status)
  SELECT 'Beginners Group', teacher3_id, 'Qaida and short surahs', 30, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM groups WHERE name='Beginners Group') RETURNING id INTO g3_id;
  IF g3_id IS NULL THEN SELECT id INTO g3_id FROM groups WHERE name='Beginners Group'; END IF;

  SELECT id INTO s1 FROM students WHERE student_code='STU-1001';
  IF s1 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1001','Ahmed Al-Rashid','male','2014-03-12','Al-Noor School','Grade 5', g1_id, parent1_id,'+966555000111','2024-09-01','active') RETURNING id INTO s1; END IF;
  SELECT id INTO s2 FROM students WHERE student_code='STU-1002';
  IF s2 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1002','Fatima Al-Zahra','female','2015-07-22','Al-Noor School','Grade 4', g1_id, parent2_id,'+966555000112','2024-09-05','active') RETURNING id INTO s2; END IF;
  SELECT id INTO s3 FROM students WHERE student_code='STU-1003';
  IF s3 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1003','Yusuf Ibn Adam','male','2013-11-30','Dar Al-Huda','Grade 6', g2_id, parent3_id,'+966555000113','2024-08-20','active') RETURNING id INTO s3; END IF;
  SELECT id INTO s4 FROM students WHERE student_code='STU-1004';
  IF s4 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1004','Maryam Al-Siddiqa','female','2015-02-14','Dar Al-Huda','Grade 4', g2_id, parent1_id,'+966555000114','2024-09-10','active') RETURNING id INTO s4; END IF;
  SELECT id INTO s5 FROM students WHERE student_code='STU-1005';
  IF s5 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1005','Ibrahim Al-Mansour','male','2016-05-08','Al-Fajr School','Grade 3', g3_id, parent2_id,'+966555000115','2025-01-10','active') RETURNING id INTO s5; END IF;
  SELECT id INTO s6 FROM students WHERE student_code='STU-1006';
  IF s6 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1006','Khadija Al-Batool','female','2016-09-19','Al-Fajr School','Grade 3', g3_id, parent3_id,'+966555000116','2025-01-12','active') RETURNING id INTO s6; END IF;
  SELECT id INTO s7 FROM students WHERE student_code='STU-1007';
  IF s7 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1007','Omar Al-Farooq','male','2014-12-03','Al-Noor School','Grade 5', g1_id, parent1_id,'+966555000117','2024-09-15','active') RETURNING id INTO s7; END IF;
  SELECT id INTO s8 FROM students WHERE student_code='STU-1008';
  IF s8 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1008','Aisha Al-Tahira','female','2015-04-27','Al-Noor School','Grade 4', g2_id, parent2_id,'+966555000118','2024-09-18','active') RETURNING id INTO s8; END IF;
  SELECT id INTO s9 FROM students WHERE student_code='STU-1009';
  IF s9 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1009','Ali Al-Murtada','male','2013-08-15','Dar Al-Huda','Grade 6', g1_id, parent3_id,'+966555000119','2024-08-25','active') RETURNING id INTO s9; END IF;
  SELECT id INTO s10 FROM students WHERE student_code='STU-1010';
  IF s10 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1010','Hafsa Al-Ansari','female','2016-01-30','Al-Fajr School','Grade 3', g3_id, parent1_id,'+966555000120','2025-01-15','active') RETURNING id INTO s10; END IF;
  SELECT id INTO s11 FROM students WHERE student_code='STU-1011';
  IF s11 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1011','Zayd Al-Harith','male','2014-06-21','Al-Noor School','Grade 5', g2_id, parent2_id,'+966555000121','2024-09-20','active') RETURNING id INTO s11; END IF;
  SELECT id INTO s12 FROM students WHERE student_code='STU-1012';
  IF s12 IS NULL THEN INSERT INTO students (student_code, full_name, gender, date_of_birth, school, grade, group_id, parent_id, phone_primary, enrollment_date, status) VALUES ('STU-1012','Sumayya Al-Ghafara','female','2015-10-11','Dar Al-Huda','Grade 4', g3_id, parent3_id,'+966555000122','2025-01-20','inactive') RETURNING id INTO s12; END IF;

  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s1, teacher1_id, CURRENT_DATE - 1, 'new', 2, 1, 2, 10, 0.25, 10, 'good', 1, 'Good start on Al-Baqarah'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s1 AND session_date=CURRENT_DATE - 1);
  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s2, teacher1_id, CURRENT_DATE - 1, 'revision', 1, 1, 1, 7, 0.5, 7, 'excellent', 0, 'Excellent revision'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s2 AND session_date=CURRENT_DATE - 1);
  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s3, teacher2_id, CURRENT_DATE - 2, 'exam', 18, 1, 18, 20, 0.5, 20, 'good', 2, 'Solid exam performance'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s3 AND session_date=CURRENT_DATE - 2);
  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s7, teacher1_id, CURRENT_DATE - 3, 'new', 3, 1, 3, 15, 0.5, 15, 'satisfactory', 3, 'Needs more practice'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s7 AND session_date=CURRENT_DATE - 3);
  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s9, teacher1_id, CURRENT_DATE - 4, 'revision', 36, 1, 36, 30, 0.75, 30, 'good', 1, 'Confident recitation'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s9 AND session_date=CURRENT_DATE - 4);
  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s4, teacher2_id, CURRENT_DATE - 5, 'new', 67, 1, 67, 15, 0.5, 15, 'good', 2, 'Steady progress'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s4 AND session_date=CURRENT_DATE - 5);
  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s8, teacher2_id, CURRENT_DATE - 6, 'exam', 78, 1, 78, 40, 1.0, 40, 'excellent', 0, 'Outstanding exam'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s8 AND session_date=CURRENT_DATE - 6);
  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s11, teacher2_id, CURRENT_DATE - 7, 'revision', 55, 1, 55, 20, 0.5, 20, 'needs_improvement', 5, 'Struggled with tajweed rules'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s11 AND session_date=CURRENT_DATE - 7);
  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s5, teacher3_id, CURRENT_DATE - 1, 'new', 1, 1, 1, 7, 0.5, 7, 'good', 1, 'Good first effort'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s5 AND session_date=CURRENT_DATE - 1);
  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s6, teacher3_id, CURRENT_DATE - 2, 'revision', 112, 1, 112, 4, 0.25, 4, 'excellent', 0, 'Clean recitation'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s6 AND session_date=CURRENT_DATE - 2);
  INSERT INTO memorization_sessions (student_id, teacher_id, session_date, session_type, from_surah_number, from_ayah, to_surah_number, to_ayah, total_pages, total_verses, grade, mistake_count, notes)
  SELECT s10, teacher3_id, CURRENT_DATE - 3, 'new', 113, 1, 113, 5, 0.25, 5, 'satisfactory', 2, 'Improving'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_sessions WHERE student_id=s10 AND session_date=CURRENT_DATE - 3);

  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s1, g1_id, teacher1_id, CURRENT_DATE - 1, 'present', NULL WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s1 AND attendance_date=CURRENT_DATE - 1);
  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s2, g1_id, teacher1_id, CURRENT_DATE - 1, 'present', NULL WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s2 AND attendance_date=CURRENT_DATE - 1);
  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s7, g1_id, teacher1_id, CURRENT_DATE - 1, 'late', 'Arrived 15 min late' WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s7 AND attendance_date=CURRENT_DATE - 1);
  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s9, g1_id, teacher1_id, CURRENT_DATE - 1, 'absent', 'No notice' WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s9 AND attendance_date=CURRENT_DATE - 1);
  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s3, g2_id, teacher2_id, CURRENT_DATE - 2, 'present', NULL WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s3 AND attendance_date=CURRENT_DATE - 2);
  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s4, g2_id, teacher2_id, CURRENT_DATE - 2, 'excused', 'Medical appointment' WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s4 AND attendance_date=CURRENT_DATE - 2);
  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s8, g2_id, teacher2_id, CURRENT_DATE - 2, 'present', NULL WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s8 AND attendance_date=CURRENT_DATE - 2);
  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s11, g2_id, teacher2_id, CURRENT_DATE - 2, 'present', NULL WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s11 AND attendance_date=CURRENT_DATE - 2);
  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s5, g3_id, teacher3_id, CURRENT_DATE - 1, 'present', NULL WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s5 AND attendance_date=CURRENT_DATE - 1);
  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s6, g3_id, teacher3_id, CURRENT_DATE - 1, 'present', NULL WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s6 AND attendance_date=CURRENT_DATE - 1);
  INSERT INTO attendance (student_id, group_id, teacher_id, attendance_date, status, notes)
  SELECT s10, g3_id, teacher3_id, CURRENT_DATE - 1, 'excused', 'Family travel' WHERE NOT EXISTS (SELECT 1 FROM attendance WHERE student_id=s10 AND attendance_date=CURRENT_DATE - 1);

  INSERT INTO evaluations (student_id, teacher_id, evaluation_date, tajweed, memorization_quality, revision_quality, behavior, participation, notes)
  SELECT s1, teacher1_id, CURRENT_DATE - 3, 5, 4, 4, 5, 4, 'Consistent and motivated' WHERE NOT EXISTS (SELECT 1 FROM evaluations WHERE student_id=s1 AND evaluation_date=CURRENT_DATE - 3);
  INSERT INTO evaluations (student_id, teacher_id, evaluation_date, tajweed, memorization_quality, revision_quality, behavior, participation, notes)
  SELECT s2, teacher1_id, CURRENT_DATE - 3, 5, 5, 5, 5, 5, 'Excellent all round' WHERE NOT EXISTS (SELECT 1 FROM evaluations WHERE student_id=s2 AND evaluation_date=CURRENT_DATE - 3);
  INSERT INTO evaluations (student_id, teacher_id, evaluation_date, tajweed, memorization_quality, revision_quality, behavior, participation, notes)
  SELECT s7, teacher1_id, CURRENT_DATE - 4, 3, 3, 3, 4, 3, 'Can improve with focus' WHERE NOT EXISTS (SELECT 1 FROM evaluations WHERE student_id=s7 AND evaluation_date=CURRENT_DATE - 4);
  INSERT INTO evaluations (student_id, teacher_id, evaluation_date, tajweed, memorization_quality, revision_quality, behavior, participation, notes)
  SELECT s3, teacher2_id, CURRENT_DATE - 5, 4, 4, 5, 5, 4, 'Strong revision skills' WHERE NOT EXISTS (SELECT 1 FROM evaluations WHERE student_id=s3 AND evaluation_date=CURRENT_DATE - 5);

  INSERT INTO memorization_plans (student_id, teacher_id, plan_type, start_page, end_page, daily_pages, start_date, expected_completion_date, status)
  SELECT s1, teacher1_id, 'memorization', 2, 20, 1, CURRENT_DATE, CURRENT_DATE + 18, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_plans WHERE student_id=s1 AND status='active');
  INSERT INTO memorization_plans (student_id, teacher_id, plan_type, start_page, end_page, daily_pages, start_date, expected_completion_date, status)
  SELECT s3, teacher2_id, 'revision', 50, 70, 2, CURRENT_DATE, CURRENT_DATE + 10, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM memorization_plans WHERE student_id=s3 AND status='active');

  PERFORM generate_daily_assigngments_fn((SELECT id FROM memorization_plans WHERE student_id=s1 AND status='active' LIMIT 1));
  PERFORM generate_daily_assigngments_fn((SELECT id FROM memorization_plans WHERE student_id=s3 AND status='active' LIMIT 1));
END $$;
