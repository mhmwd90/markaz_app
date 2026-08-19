import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, GraduationCap, School, BookOpen, CalendarCheck, TrendingUp,
  Award, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useSurahs } from "@/hooks/useSurahs";
import { fetchDashboardStats, fetchSessions, fetchAttendance } from "@/lib/api";
import type { DashboardStats, MemorizationSession, Attendance } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, StatCard, FullSpinner, Badge } from "@/components/ui";
import { SESSION_TYPE_LABELS, ATTENDANCE_LABELS } from "@/lib/quranData";
import { formatDate, relativeTime } from "@/lib/utils";

const SESSION_COLORS: Record<string, string> = { new: "#10b981", revision: "#0ea5e9", exam: "#f59e0b" };
const ATTENDANCE_COLORS: Record<string, string> = { present: "#10b981", late: "#f59e0b", excused: "#0ea5e9", absent: "#f43f5e" };

export function DashboardPage() {
  const { profile } = useAuth();
  const role = profile?.role ?? "parent";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<{ name: string; new: number; revision: number; exam: number }[]>([]);
  const [attendancePie, setAttendancePie] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      fetchDashboardStats(role, profile.id),
      fetchSessions({ pageSize: 100 }),
      role !== "parent" ? fetchAttendance({ pageSize: 100 }) : Promise.resolve({ data: [] as Attendance[], total: 0 }),
    ])
      .then(([s, sess, att]) => {
        setStats(s);
        // build 7-day session chart
        const days: Record<string, { name: string; new: number; revision: number; exam: number }> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          days[key] = { name: d.toLocaleDateString("en", { weekday: "short" }), new: 0, revision: 0, exam: 0 };
        }
        (sess.data as MemorizationSession[]).forEach((s) => {
          const key = s.session_date.slice(0, 10);
          if (days[key]) days[key][s.session_type] += 1;
        });
        setChartData(Object.values(days));

        // attendance pie
        const counts: Record<string, number> = { present: 0, late: 0, excused: 0, absent: 0 };
        att.data.forEach((a) => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
        setAttendancePie(Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => ({ name: ATTENDANCE_LABELS[k as keyof typeof ATTENDANCE_LABELS], value: v })));
      })
      .catch((e) => console.error("dashboard load failed", e))
      .finally(() => setLoading(false));
  }, [profile, role]);

  if (loading || !stats) return <FullSpinner label="Loading dashboard…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {role === "admin" ? "Center Overview" : role === "teacher" ? "Teacher Dashboard" : "Family Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back, {profile?.full_name}.</p>
      </div>

      {role === "admin" && <AdminStats stats={stats} />}
      {role === "teacher" && <TeacherStats stats={stats} />}
      {role === "parent" && <ParentStats stats={stats} />}

      {/* Charts */}
      {role !== "parent" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Memorization Activity (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gNew" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gExam" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="new" name="New" stackId="1" stroke="#10b981" fill="url(#gNew)" />
                  <Area type="monotone" dataKey="revision" name="Revision" stackId="1" stroke="#0ea5e9" fill="url(#gRev)" />
                  <Area type="monotone" dataKey="exam" name="Exam" stackId="1" stroke="#f59e0b" fill="url(#gExam)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Attendance Breakdown</CardTitle></CardHeader>
            <CardContent>
              {attendancePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={attendancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                      {attendancePie.map((entry) => (
                        <Cell key={entry.name} fill={ATTENDANCE_COLORS[Object.keys(ATTENDANCE_LABELS).find((k) => ATTENDANCE_LABELS[k as keyof typeof ATTENDANCE_LABELS] === entry.name) ?? "present"]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">No attendance data yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Memorization Activity</CardTitle>
          <Link to="/sessions" className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
            View all <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </CardHeader>
        <CardContent className="!p-0">
          {stats.recent_sessions && stats.recent_sessions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recent_sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: `${SESSION_COLORS[s.session_type]}15` }}>
                      <BookOpen className="h-4 w-4" style={{ color: SESSION_COLORS[s.session_type] }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{SESSION_TYPE_LABELS[s.session_type]}</p>
                      <p className="text-xs text-slate-500">{s.total_pages} pages · {s.total_verses} verses</p>
                    </div>
                  </div>
                  <Badge tone={s.session_type === "exam" ? "amber" : s.session_type === "new" ? "emerald" : "sky"}>
                    {relativeTime(s.session_date)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No recent activity.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminStats({ stats }: { stats: DashboardStats }) {
  const attendanceRate = stats.attendance_total_30d ? Math.round((stats.attendance_present_30d! / stats.attendance_total_30d) * 100) : 0;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Students" value={stats.total_students ?? 0} icon={Users} tone="emerald" sub={`${stats.new_students_30d ?? 0} new this month`} />
      <StatCard label="Active Teachers" value={stats.active_teachers ?? 0} icon={GraduationCap} tone="sky" sub={`${stats.active_groups ?? 0} active groups`} />
      <StatCard label="Sessions (30d)" value={stats.sessions_30d ?? 0} icon={BookOpen} tone="amber" />
      <StatCard label="Attendance Rate" value={`${attendanceRate}%`} icon={CalendarCheck} tone="violet" sub={`${stats.attendance_present_30d ?? 0} present of ${stats.attendance_total_30d ?? 0}`} />
    </div>
  );
}

function TeacherStats({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="My Students" value={stats.my_students ?? 0} icon={Users} tone="emerald" sub={`${stats.my_groups ?? 0} groups`} />
      <StatCard label="Today's Sessions" value={stats.today_sessions ?? 0} icon={BookOpen} tone="sky" sub={`${stats.sessions_7d ?? 0} this week`} />
      <StatCard label="Today's Attendance" value={stats.today_attendance ?? 0} icon={CalendarCheck} tone="amber" />
      <StatCard label="Active Plans" value={stats.pending_plans ?? 0} icon={TrendingUp} tone="violet" />
    </div>
  );
}

function ParentStats({ stats }: { stats: DashboardStats }) {
  const rate = stats.children_attendance_total ? Math.round((stats.children_attendance_present! / stats.children_attendance_total) * 100) : 0;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My Children" value={stats.my_children?.length ?? 0} icon={Users} tone="emerald" />
        <StatCard label="Sessions (30d)" value={stats.children_sessions_30d ?? 0} icon={BookOpen} tone="sky" />
        <StatCard label="Attendance Rate" value={`${rate}%`} icon={Award} tone="violet" />
      </div>
      {stats.my_children && stats.my_children.length > 0 && (
        <Card>
          <CardHeader><CardTitle>My Children</CardTitle></CardHeader>
          <CardContent className="!p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.my_children.map((c) => (
                <Link key={c.id} to={`/students/${c.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.group ?? "No group"}</p>
                    </div>
                  </div>
                  <Badge tone={c.status === "active" ? "emerald" : c.status === "graduated" ? "sky" : "neutral"}>{c.status}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
