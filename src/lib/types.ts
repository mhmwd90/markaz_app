export type UserRole = "admin" | "teacher" | "parent";

export type StudentStatus = "active" | "inactive" | "graduated";
export type Gender = "male" | "female";
export type SessionType = "new" | "revision" | "exam";
export type Grade = "excellent" | "good" | "satisfactory" | "needs_improvement";
export type AttendanceStatus = "present" | "absent" | "excused" | "late";
export type PlanType = "memorization" | "revision";
export type PlanStatus = "active" | "completed" | "paused";
export type AssignmentStatus = "pending" | "completed" | "skipped";
export type RevelationType = "meccan" | "medinan";
export type NotificationType = "attendance" | "memorization" | "reminder" | "general";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  profile_id: string | null;
  employee_id: string | null;
  specialization: string | null;
  hire_date: string | null;
  status: "active" | "inactive";
  profile?: Profile | null;
  created_at: string;
}

export interface Parent {
  id: string;
  profile_id: string | null;
  occupation: string | null;
  profile?: Profile | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  teacher_id: string | null;
  teacher?: Teacher | null;
  description: string | null;
  capacity: number;
  status: "active" | "inactive";
  created_at: string;
  student_count?: number;
}

export interface Student {
  id: string;
  student_code: string | null;
  full_name: string;
  gender: Gender | null;
  date_of_birth: string | null;
  school: string | null;
  grade: string | null;
  group_id: string | null;
  group?: Group | null;
  parent_id: string | null;
  parent?: Parent | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  enrollment_date: string;
  status: StudentStatus;
  notes: string | null;
  created_at: string;
}

export interface QuranSurah {
  id: number;
  number: number;
  name_arabic: string;
  name_english: string;
  name_transliteration: string | null;
  total_ayahs: number;
  revelation_type: RevelationType | null;
  start_page: number;
  start_juz: number;
}

export interface MemorizationSession {
  id: string;
  student_id: string;
  student?: Student | null;
  teacher_id: string | null;
  teacher?: Teacher | null;
  session_date: string;
  session_type: SessionType;
  from_surah_number: number;
  from_ayah: number;
  to_surah_number: number;
  to_ayah: number;
  total_pages: number;
  total_verses: number;
  grade: Grade | null;
  mistake_count: number;
  notes: string | null;
  created_at: string;
}

export interface MemorizationPlan {
  id: string;
  student_id: string;
  student?: Student | null;
  teacher_id: string | null;
  plan_type: PlanType;
  start_page: number;
  end_page: number;
  daily_pages: number;
  start_date: string;
  expected_completion_date: string | null;
  status: PlanStatus;
  created_at: string;
  daily_assignments?: DailyAssignment[];
}

export interface DailyAssignment {
  id: string;
  plan_id: string;
  assignment_date: string;
  from_page: number;
  to_page: number;
  status: AssignmentStatus;
  completed_at: string | null;
  notes: string | null;
}

export interface Attendance {
  id: string;
  student_id: string;
  student?: Student | null;
  group_id: string | null;
  teacher_id: string | null;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
}

export interface Evaluation {
  id: string;
  student_id: string;
  student?: Student | null;
  teacher_id: string | null;
  teacher?: Teacher | null;
  evaluation_date: string;
  tajweed: number | null;
  memorization_quality: number | null;
  revision_quality: number | null;
  behavior: number | null;
  participation: number | null;
  notes: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  // admin
  total_students?: number;
  active_teachers?: number;
  active_groups?: number;
  sessions_30d?: number;
  attendance_present_30d?: number;
  attendance_total_30d?: number;
  new_students_30d?: number;
  graduated?: number;
  // teacher
  teacher_id?: string;
  my_students?: number;
  my_groups?: number;
  today_sessions?: number;
  today_attendance?: number;
  sessions_7d?: number;
  pending_plans?: number;
  // parent
  parent_id?: string;
  my_children?: Array<{ id: string; name: string; group: string | null; status: string }>;
  children_sessions_30d?: number;
  children_attendance_present?: number;
  children_attendance_total?: number;
  // shared
  recent_sessions?: Array<{
    id: string;
    student_id: string;
    session_date: string;
    session_type: SessionType;
    total_pages: number;
    total_verses: number;
  }>;
}
