import type { QuranSurah, SessionType, Grade, AttendanceStatus, PlanType, PlanStatus, AssignmentStatus, StudentStatus, UserRole } from "./types";

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  new: "New Memorization",
  revision: "Revision",
  exam: "Exam",
};

export const GRADE_LABELS: Record<Grade, string> = {
  excellent: "Excellent",
  good: "Good",
  satisfactory: "Satisfactory",
  needs_improvement: "Needs Improvement",
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  excused: "Excused",
  late: "Late",
};

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  memorization: "Memorization",
  revision: "Revision",
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  skipped: "Skipped",
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  graduated: "Graduated",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  parent: "Parent",
};

export const ROLE_LABELS_AR: Record<UserRole, string> = {
  admin: "مدير",
  teacher: "معلم",
  parent: "ولي أمر",
};

export function surahDisplay(s: Pick<QuranSurah, "number" | "name_arabic" | "name_english" | "name_transliteration">): string {
  const tr = s.name_transliteration ? ` (${s.name_transliteration})` : "";
  return `${s.number}. ${s.name_english}${tr}`;
}

export function gradeColor(grade: Grade | null): string {
  switch (grade) {
    case "excellent": return "text-emerald-600 dark:text-emerald-400";
    case "good": return "text-sky-600 dark:text-sky-400";
    case "satisfactory": return "text-amber-600 dark:text-amber-400";
    case "needs_improvement": return "text-rose-600 dark:text-rose-400";
    default: return "text-slate-500";
  }
}

export function attendanceColor(status: AttendanceStatus): string {
  switch (status) {
    case "present": return "text-emerald-600 dark:text-emerald-400";
    case "late": return "text-amber-600 dark:text-amber-400";
    case "excused": return "text-sky-600 dark:text-sky-400";
    case "absent": return "text-rose-600 dark:text-rose-400";
  }
}

export function statusColor(status: StudentStatus): string {
  switch (status) {
    case "active": return "text-emerald-600 dark:text-emerald-400";
    case "inactive": return "text-slate-500";
    case "graduated": return "text-sky-600 dark:text-sky-400";
  }
}

export function planStatusColor(status: PlanStatus): string {
  switch (status) {
    case "active": return "text-emerald-600 dark:text-emerald-400";
    case "completed": return "text-sky-600 dark:text-sky-400";
    case "paused": return "text-amber-600 dark:text-amber-400";
  }
}

export function gradeStars(n: number | null): string {
  if (n == null) return "—";
  return "★".repeat(n) + "☆".repeat(5 - n);
}
