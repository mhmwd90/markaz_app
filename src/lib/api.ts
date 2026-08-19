import { supabase } from "./supabase";
import type {
  Student, Group, Teacher, Parent, QuranSurah,
  MemorizationSession, MemorizationPlan, DailyAssignment,
  Attendance, Evaluation, AuditLog, Notification, DashboardStats, UserRole,
} from "./types";

// ---------- Quran ----------
export async function fetchSurahs(): Promise<QuranSurah[]> {
  const { data, error } = await supabase
    .from("quran_surahs")
    .select("*")
    .order("number");
  if (error) throw error;
  return data as QuranSurah[];
}

export async function getPageForSurahAyah(surah: number, ayah: number): Promise<number | null> {
  const { data, error } = await supabase.rpc("get_page_for_surah_ayah", { p_surah: surah, p_ayah: ayah });
  if (error) throw error;
  return data as number | null;
}

export async function countVersesBetween(fromSurah: number, fromAyah: number, toSurah: number, toAyah: number): Promise<number> {
  const { data, error } = await supabase.rpc("count_verses_between", {
    from_surah: fromSurah, from_ayah: fromAyah, to_surah: toSurah, to_ayah: toAyah,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

// ---------- Dashboard ----------
export async function fetchDashboardStats(role: UserRole, userId: string): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc("get_dashboard_stats", { p_role: role, p_user_id: userId });
  if (error) throw error;
  return data as DashboardStats;
}

// ---------- Students ----------
const STUDENT_SELECT = `
  id, student_code, full_name, gender, date_of_birth, school, grade,
  group_id, parent_id, phone_primary, phone_secondary, enrollment_date, status, notes, created_at,
  group:groups(id, name, teacher:teachers(id, profile:profiles(full_name))),
  parent:parents(id, occupation, profile:profiles(full_name, phone))
`;

export async function fetchStudents(params: {
  search?: string;
  groupId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: Student[]; total: number }> {
  const { search, groupId, status, page = 1, pageSize = 10 } = params;
  let query = supabase.from("students").select(STUDENT_SELECT, { count: "exact" });

  query = query.is("deleted_at", null);
  if (search) query = query.or(`full_name.ilike.%${search}%,student_code.ilike.%${search}%,phone_primary.ilike.%${search}%`);
  if (groupId && groupId !== "all") query = query.eq("group_id", groupId);
  if (status && status !== "all") query = query.eq("status", status);

  const from = (page - 1) * pageSize;
  query = query.order("full_name").range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []) as unknown as Student[], total: count ?? 0 };
}

export async function fetchStudent(id: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Student | null;
}

export async function createStudent(input: Partial<Student>): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .insert(input)
    .select(STUDENT_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as Student;
}

export async function updateStudent(id: string, input: Partial<Student>): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .update(input)
    .eq("id", id)
    .select(STUDENT_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as Student;
}

export async function softDeleteStudent(id: string): Promise<void> {
  const { error } = await supabase.from("students").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// ---------- Groups ----------
const GROUP_SELECT = `
  id, name, teacher_id, description, capacity, status, created_at,
  teacher:teachers(id, profile:profiles(full_name))
`;

export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await supabase.from("groups").select(GROUP_SELECT).is("deleted_at", null).order("name");
  if (error) throw error;
  const groups = (data ?? []) as unknown as Group[];
  // attach student counts
  const { data: counts } = await supabase
    .from("students")
    .select("group_id")
    .is("deleted_at", null)
    .not("group_id", "is", null);
  const map = new Map<string, number>();
  (counts ?? []).forEach((r: { group_id: string }) => map.set(r.group_id, (map.get(r.group_id) ?? 0) + 1));
  return groups.map((g) => ({ ...g, student_count: map.get(g.id) ?? 0 }));
}

export async function createGroup(input: Partial<Group>): Promise<Group> {
  const { data, error } = await supabase.from("groups").insert(input).select(GROUP_SELECT).single();
  if (error) throw error;
  return data as unknown as Group;
}

export async function updateGroup(id: string, input: Partial<Group>): Promise<Group> {
  const { data, error } = await supabase.from("groups").update(input).eq("id", id).select(GROUP_SELECT).single();
  if (error) throw error;
  return data as unknown as Group;
}

export async function softDeleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from("groups").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// ---------- Teachers ----------
const TEACHER_SELECT = `
  id, profile_id, employee_id, specialization, hire_date, status, created_at,
  profile:profiles(full_name, email, phone, role)
`;

export async function fetchTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase.from("teachers").select(TEACHER_SELECT).is("deleted_at", null).order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as Teacher[];
}

// ---------- Parents ----------
const PARENT_SELECT = `
  id, profile_id, occupation, created_at,
  profile:profiles(full_name, email, phone, role)
`;

export async function fetchParents(): Promise<Parent[]> {
  const { data, error } = await supabase.from("parents").select(PARENT_SELECT).is("deleted_at", null).order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as Parent[];
}

// ---------- Memorization sessions ----------
const SESSION_SELECT = `
  id, student_id, teacher_id, session_date, session_type,
  from_surah_number, from_ayah, to_surah_number, to_ayah,
  total_pages, total_verses, grade, mistake_count, notes, created_at,
  student:students(id, full_name, student_code),
  teacher:teachers(id, profile:profiles(full_name))
`;

export async function fetchSessions(params: {
  studentId?: string;
  teacherId?: string;
  sessionType?: string;
  surah?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: MemorizationSession[]; total: number }> {
  const { studentId, teacherId, sessionType, surah, fromDate, toDate, page = 1, pageSize = 10 } = params;
  let query = supabase.from("memorization_sessions").select(SESSION_SELECT, { count: "exact" });
  query = query.is("deleted_at", null);
  if (studentId) query = query.eq("student_id", studentId);
  if (teacherId) query = query.eq("teacher_id", teacherId);
  if (sessionType && sessionType !== "all") query = query.eq("session_type", sessionType);
  if (surah) query = query.or(`from_surah_number.eq.${surah},to_surah_number.eq.${surah}`);
  if (fromDate) query = query.gte("session_date", fromDate);
  if (toDate) query = query.lte("session_date", toDate);
  const from = (page - 1) * pageSize;
  query = query.order("session_date", { ascending: false }).range(from, from + pageSize - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []) as unknown as MemorizationSession[], total: count ?? 0 };
}

export async function createSession(input: Partial<MemorizationSession>): Promise<MemorizationSession> {
  const { data, error } = await supabase.from("memorization_sessions").insert(input).select(SESSION_SELECT).single();
  if (error) throw error;
  return data as unknown as MemorizationSession;
}

export async function updateSession(id: string, input: Partial<MemorizationSession>): Promise<MemorizationSession> {
  const { data, error } = await supabase.from("memorization_sessions").update(input).eq("id", id).select(SESSION_SELECT).single();
  if (error) throw error;
  return data as unknown as MemorizationSession;
}

export async function softDeleteSession(id: string): Promise<void> {
  const { error } = await supabase.from("memorization_sessions").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// ---------- Plans ----------
const PLAN_SELECT = `
  id, student_id, teacher_id, plan_type, start_page, end_page, daily_pages,
  start_date, expected_completion_date, status, created_at,
  student:students(id, full_name, student_code),
  teacher:teachers(id, profile:profiles(full_name))
`;

export async function fetchPlans(params: { studentId?: string; status?: string; page?: number; pageSize?: number }): Promise<{ data: MemorizationPlan[]; total: number }> {
  const { studentId, status, page = 1, pageSize = 10 } = params;
  let query = supabase.from("memorization_plans").select(PLAN_SELECT, { count: "exact" });
  query = query.is("deleted_at", null);
  if (studentId) query = query.eq("student_id", studentId);
  if (status && status !== "all") query = query.eq("status", status);
  const from = (page - 1) * pageSize;
  query = query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []) as unknown as MemorizationPlan[], total: count ?? 0 };
}

export async function createPlan(input: Partial<MemorizationPlan>): Promise<MemorizationPlan> {
  const { data, error } = await supabase.from("memorization_plans").insert(input).select(PLAN_SELECT).single();
  if (error) throw error;
  const plan = data as unknown as MemorizationPlan;
  await supabase.rpc("generate_daily_assigngments_fn", { plan_uuid: plan.id });
  return plan;
}

export async function updatePlan(id: string, input: Partial<MemorizationPlan>): Promise<MemorizationPlan> {
  const { data, error } = await supabase.from("memorization_plans").update(input).eq("id", id).select(PLAN_SELECT).single();
  if (error) throw error;
  return data as unknown as MemorizationPlan;
}

export async function fetchDailyAssignments(planId: string): Promise<DailyAssignment[]> {
  const { data, error } = await supabase
    .from("daily_assignments")
    .select("*")
    .eq("plan_id", planId)
    .order("assignment_date");
  if (error) throw error;
  return (data ?? []) as DailyAssignment[];
}

export async function updateAssignment(id: string, input: Partial<DailyAssignment>): Promise<void> {
  const { error } = await supabase.from("daily_assignments").update(input).eq("id", id);
  if (error) throw error;
}

// ---------- Attendance ----------
const ATTENDANCE_SELECT = `
  id, student_id, group_id, teacher_id, attendance_date, status, notes, created_at,
  student:students(id, full_name, student_code),
  teacher:teachers(id, profile:profiles(full_name))
`;

export async function fetchAttendance(params: {
  studentId?: string;
  groupId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: Attendance[]; total: number }> {
  const { studentId, groupId, status, fromDate, toDate, page = 1, pageSize = 10 } = params;
  let query = supabase.from("attendance").select(ATTENDANCE_SELECT, { count: "exact" });
  if (studentId) query = query.eq("student_id", studentId);
  if (groupId) query = query.eq("group_id", groupId);
  if (status && status !== "all") query = query.eq("status", status);
  if (fromDate) query = query.gte("attendance_date", fromDate);
  if (toDate) query = query.lte("attendance_date", toDate);
  const from = (page - 1) * pageSize;
  query = query.order("attendance_date", { ascending: false }).range(from, from + pageSize - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []) as unknown as Attendance[], total: count ?? 0 };
}

export async function upsertAttendance(input: Partial<Attendance>): Promise<Attendance> {
  const { data, error } = await supabase.from("attendance").upsert(input, { onConflict: "student_id,attendance_date" }).select(ATTENDANCE_SELECT).single();
  if (error) throw error;
  return data as unknown as Attendance;
}

export async function createAttendance(input: Partial<Attendance>): Promise<Attendance> {
  const { data, error } = await supabase.from("attendance").insert(input).select(ATTENDANCE_SELECT).single();
  if (error) throw error;
  return data as unknown as Attendance;
}

export async function updateAttendance(id: string, input: Partial<Attendance>): Promise<void> {
  const { error } = await supabase.from("attendance").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteAttendance(id: string): Promise<void> {
  const { error } = await supabase.from("attendance").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Evaluations ----------
const EVAL_SELECT = `
  id, student_id, teacher_id, evaluation_date,
  tajweed, memorization_quality, revision_quality, behavior, participation, notes, created_at,
  student:students(id, full_name, student_code),
  teacher:teachers(id, profile:profiles(full_name))
`;

export async function fetchEvaluations(params: { studentId?: string; page?: number; pageSize?: number }): Promise<{ data: Evaluation[]; total: number }> {
  const { studentId, page = 1, pageSize = 10 } = params;
  let query = supabase.from("evaluations").select(EVAL_SELECT, { count: "exact" });
  if (studentId) query = query.eq("student_id", studentId);
  const from = (page - 1) * pageSize;
  query = query.order("evaluation_date", { ascending: false }).range(from, from + pageSize - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []) as unknown as Evaluation[], total: count ?? 0 };
}

export async function createEvaluation(input: Partial<Evaluation>): Promise<Evaluation> {
  const { data, error } = await supabase.from("evaluations").insert(input).select(EVAL_SELECT).single();
  if (error) throw error;
  return data as unknown as Evaluation;
}

// ---------- Notifications ----------
export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function createNotification(input: Partial<Notification>): Promise<void> {
  const { error } = await supabase.from("notifications").insert(input);
  if (error) throw error;
}

// ---------- Audit logs ----------
export async function logAudit(entry: {
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    user_id: entry.userId ?? null,
    user_name: entry.userName ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    details: entry.details ?? null,
  });
  if (error) console.error("audit log failed", error);
}

export async function fetchAuditLogs(params: { page?: number; pageSize?: number }): Promise<{ data: AuditLog[]; total: number }> {
  const { page = 1, pageSize = 20 } = params;
  const from = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  return { data: (data ?? []) as AuditLog[], total: count ?? 0 };
}
