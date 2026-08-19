import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, School, Calendar, Users, BookOpen, ClipboardList,
  GraduationCap, CalendarCheck, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { fetchStudent, fetchSessions, fetchAttendance, fetchEvaluations, fetchPlans, fetchDailyAssignments } from "@/lib/api";
import type { Student, MemorizationSession, Attendance, Evaluation, MemorizationPlan, DailyAssignment } from "@/lib/types";
import { useSurahs } from "@/hooks/useSurahs";
import {
  Card, CardHeader, CardTitle, CardContent, Badge, FullSpinner, Button, Table, THead, TR, TH, TD, EmptyState,
} from "@/components/ui";
import { STUDENT_STATUS_LABELS, SESSION_TYPE_LABELS, ATTENDANCE_LABELS, GRADE_LABELS, PLAN_TYPE_LABELS, ASSIGNMENT_STATUS_LABELS, gradeColor, statusColor, gradeStars } from "@/lib/quranData";
import { formatDate, ageFromDob, totalPages as calcTotalPages, cn } from "@/lib/utils";

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSurah } = useSurahs();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<MemorizationSession[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [plans, setPlans] = useState<MemorizationPlan[]>([]);
  const [assignments, setAssignments] = useState<DailyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "sessions" | "attendance" | "evaluations" | "plans">("overview");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [s, sess, att, evals, pl] = await Promise.all([
        fetchStudent(id),
        fetchSessions({ studentId: id, pageSize: 50 }),
        fetchAttendance({ studentId: id, pageSize: 50 }),
        fetchEvaluations({ studentId: id, pageSize: 20 }),
        fetchPlans({ studentId: id, pageSize: 10 }),
      ]);
      setStudent(s);
      setSessions(sess.data);
      setAttendance(att.data);
      setEvaluations(evals.data);
      setPlans(pl.data);
      if (pl.data[0]) {
        const a = await fetchDailyAssignments(pl.data[0].id);
        setAssignments(a);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <FullSpinner label="Loading student profile…" />;
  if (!student) return (
    <Card><EmptyState icon={Users} title="Student not found" action={<Link to="/students"><Button variant="outline">Back to students</Button></Link>} /></Card>
  );

  const sessionChart = sessions.slice(0, 10).reverse().map((s) => ({
    date: formatDate(s.session_date).slice(0, 6),
    verses: s.total_verses,
    pages: Number(s.total_pages),
  }));

  const latestEval = evaluations[0];
  const radarData = latestEval ? [
    { subject: "Tajweed", value: latestEval.tajweed ?? 0 },
    { subject: "Memorization", value: latestEval.memorization_quality ?? 0 },
    { subject: "Revision", value: latestEval.revision_quality ?? 0 },
    { subject: "Behavior", value: latestEval.behavior ?? 0 },
    { subject: "Participation", value: latestEval.participation ?? 0 },
  ] : [];

  const completedAssignments = assignments.filter((a) => a.status === "completed").length;
  const planProgress = assignments.length > 0 ? Math.round((completedAssignments / assignments.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/students")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back to students
      </button>

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {student.full_name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{student.full_name}</h1>
              <Badge tone={student.status === "active" ? "emerald" : student.status === "graduated" ? "sky" : "neutral"}>{STUDENT_STATUS_LABELS[student.status]}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{student.student_code} · {ageFromDob(student.date_of_birth) != null ? `${ageFromDob(student.date_of_birth)} years old` : "Age unknown"} · {student.gender}</p>
          </div>
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={School} label="School" value={student.school ?? "—"} sub={student.grade} />
        <InfoCard icon={Users} label="Group" value={student.group?.name ?? "No group"} />
        <InfoCard icon={Phone} label="Phone" value={student.phone_primary ?? "—"} sub={student.phone_secondary} />
        <InfoCard icon={Calendar} label="Enrolled" value={formatDate(student.enrollment_date)} sub={student.parent?.profile?.full_name ? `Parent: ${student.parent.profile.full_name}` : undefined} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {(["overview", "sessions", "attendance", "evaluations", "plans"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
              tab === t ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Memorization Progress (recent)</CardTitle></CardHeader>
            <CardContent>
              {sessionChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={sessionChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="verses" name="Verses" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="py-12 text-center text-sm text-slate-400">No sessions recorded yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Latest Evaluation</CardTitle></CardHeader>
            <CardContent>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" className="dark:opacity-30" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <p className="py-12 text-center text-sm text-slate-400">No evaluations yet.</p>}
            </CardContent>
          </Card>

          {plans[0] && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Current Plan — {PLAN_TYPE_LABELS[plans[0].plan_type]}</CardTitle>
                <Badge tone="emerald">{planProgress}% complete</Badge>
              </CardHeader>
              <CardContent>
                <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${planProgress}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div><p className="text-slate-500">Pages</p><p className="font-medium">{plans[0].start_page} → {plans[0].end_page}</p></div>
                  <div><p className="text-slate-500">Daily</p><p className="font-medium">{plans[0].daily_pages} page(s)</p></div>
                  <div><p className="text-slate-500">Started</p><p className="font-medium">{formatDate(plans[0].start_date)}</p></div>
                  <div><p className="text-slate-500">Expected end</p><p className="font-medium">{formatDate(plans[0].expected_completion_date)}</p></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "sessions" && (
        <Card className="!p-0">
          <Table>
            <THead><TR><TH>Date</TH><TH>Type</TH><TH>Range</TH><TH>Pages</TH><TH>Verses</TH><TH>Grade</TH><TH>Mistakes</TH></TR></THead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={BookOpen} title="No sessions yet" /></td></tr>
              ) : sessions.slice(0, 20).map((s) => {
                const fromS = getSurah(s.from_surah_number);
                const toS = getSurah(s.to_surah_number);
                return (
                  <TR key={s.id}>
                    <TD className="text-xs">{formatDate(s.session_date)}</TD>
                    <TD><Badge tone={s.session_type === "exam" ? "amber" : s.session_type === "new" ? "emerald" : "sky"}>{SESSION_TYPE_LABELS[s.session_type]}</Badge></TD>
                    <TD className="text-xs">{fromS?.name_english} {s.from_ayah} → {toS?.name_english} {s.to_ayah}</TD>
                    <TD>{s.total_pages}</TD>
                    <TD>{s.total_verses}</TD>
                    <TD className={cn("font-medium", gradeColor(s.grade))}>{s.grade ? GRADE_LABELS[s.grade] : "—"}</TD>
                    <TD>{s.mistake_count}</TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === "attendance" && (
        <Card className="!p-0">
          <Table>
            <THead><TR><TH>Date</TH><TH>Status</TH><TH>Notes</TH></TR></THead>
            <tbody>
              {attendance.length === 0 ? (
                <tr><td colSpan={3}><EmptyState icon={CalendarCheck} title="No attendance records" /></td></tr>
              ) : attendance.slice(0, 20).map((a) => (
                <TR key={a.id}>
                  <TD className="text-xs">{formatDate(a.attendance_date)}</TD>
                  <TD><Badge tone={a.status === "present" ? "emerald" : a.status === "late" ? "amber" : a.status === "excused" ? "sky" : "rose"}>{ATTENDANCE_LABELS[a.status]}</Badge></TD>
                  <TD className="text-xs text-slate-500">{a.notes ?? "—"}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === "evaluations" && (
        <div className="space-y-4">
          {evaluations.length === 0 ? (
            <Card><EmptyState icon={GraduationCap} title="No evaluations yet" /></Card>
          ) : evaluations.slice(0, 10).map((e) => (
            <Card key={e.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{formatDate(e.evaluation_date)}</p>
                  {e.teacher?.profile?.full_name && <span className="text-xs text-slate-500">by {e.teacher.profile.full_name}</span>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {([["Tajweed", e.tajweed], ["Memorization", e.memorization_quality], ["Revision", e.revision_quality], ["Behavior", e.behavior], ["Participation", e.participation]] as const).map(([label, val]) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-medium text-amber-500">{gradeStars(val)}</p>
                    </div>
                  ))}
                </div>
                {e.notes && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{e.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "plans" && (
        <div className="space-y-4">
          {plans.length === 0 ? (
            <Card><EmptyState icon={TrendingUp} title="No memorization plans yet" /></Card>
          ) : plans.map((p) => {
            const done = assignments.filter((a) => a.status === "completed").length;
            const prog = assignments.length > 0 ? Math.round((done / assignments.length) * 100) : 0;
            return (
              <Card key={p.id}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{PLAN_TYPE_LABELS[p.plan_type]} Plan</p>
                      <p className="text-xs text-slate-500">Pages {p.start_page}–{p.end_page} · {p.daily_pages}/day · Expected {formatDate(p.expected_completion_date)}</p>
                    </div>
                    <Badge tone={p.status === "active" ? "emerald" : p.status === "completed" ? "sky" : "amber"}>{p.status}</Badge>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${prog}%` }} />
                  </div>
                  {assignments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {assignments.slice(0, 14).map((a) => (
                        <span key={a.id} className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-medium",
                          a.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                          a.status === "skipped" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                          "bg-slate-100 text-slate-500 dark:bg-slate-800"
                        )} title={`${formatDate(a.assignment_date)}: ${ASSIGNMENT_STATUS_LABELS[a.status]}`}>
                          {a.from_page}–{a.to_page}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string | null }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
          <Icon className="h-5 w-5 text-slate-500" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{value}</p>
          {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
