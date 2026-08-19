import { useState } from "react";
import { BarChart3, FileDown, FileSpreadsheet, Users, BookOpen, CalendarCheck, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { fetchStudents, fetchSessions, fetchAttendance, fetchEvaluations, fetchTeachers } from "@/lib/api";
import type { Student, MemorizationSession, Attendance, Evaluation, Teacher } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, Button, Select, Field, Badge } from "@/components/ui";
import { SESSION_TYPE_LABELS, ATTENDANCE_LABELS, GRADE_LABELS, gradeColor } from "@/lib/quranData";
import { formatDate, downloadFile, toCSV, cn } from "@/lib/utils";

type ReportType = "students" | "sessions" | "attendance" | "evaluations" | "teachers";

export function ReportsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [type, setType] = useState<ReportType>("students");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  const runReport = async () => {
    setLoading(true);
    try {
      let data: Record<string, unknown>[] = [];
      if (type === "students") {
        const res = await fetchStudents({ pageSize: 1000 });
        data = res.data.map((s: Student) => ({
          Code: s.student_code, Name: s.full_name, Gender: s.gender, Age: "", School: s.school, Grade: s.grade,
          Group: s.group?.name ?? "", Parent: s.parent?.profile?.full_name ?? "", Phone: s.phone_primary, Status: s.status, Enrolled: formatDate(s.enrollment_date),
        }));
      } else if (type === "sessions") {
        const res = await fetchSessions({ pageSize: 1000 });
        data = res.data.map((s: MemorizationSession) => ({
          Date: formatDate(s.session_date), Student: s.student?.full_name ?? "", Type: SESSION_TYPE_LABELS[s.session_type],
          From: `${s.from_surah_number}:${s.from_ayah}`, To: `${s.to_surah_number}:${s.to_ayah}`,
          Pages: s.total_pages, Verses: s.total_verses, Grade: s.grade ? GRADE_LABELS[s.grade] : "", Mistakes: s.mistake_count,
        }));
      } else if (type === "attendance") {
        const res = await fetchAttendance({ pageSize: 1000 });
        data = res.data.map((a: Attendance) => ({
          Date: formatDate(a.attendance_date), Student: a.student?.full_name ?? "", Status: ATTENDANCE_LABELS[a.status], Notes: a.notes ?? "",
        }));
      } else if (type === "evaluations") {
        const res = await fetchEvaluations({ pageSize: 1000 });
        data = res.data.map((e: Evaluation) => ({
          Date: formatDate(e.evaluation_date), Student: e.student?.full_name ?? "",
          Tajweed: e.tajweed, Memorization: e.memorization_quality, Revision: e.revision_quality, Behavior: e.behavior, Participation: e.participation,
          Notes: e.notes ?? "",
        }));
      } else if (type === "teachers") {
        const teachers = await fetchTeachers();
        data = teachers.map((t: Teacher) => ({
          EmployeeID: t.employee_id, Name: t.profile?.full_name ?? "", Email: t.profile?.email ?? "", Specialization: t.specialization, Status: t.status, Hired: formatDate(t.hire_date),
        }));
      }
      setRows(data);
      toast(`Report generated: ${data.length} rows`, "success");
    } catch (e) { toast((e as Error).message, "error"); } finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (rows.length === 0) { toast("Generate a report first", "error"); return; }
    downloadFile(`${type}-report-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows), "text/csv");
    toast("CSV exported", "success");
  };

  const exportPDF = () => {
    if (rows.length === 0) { toast("Generate a report first", "error"); return; }
    // printable HTML opened in a new window — user can Save as PDF
    const headers = Object.keys(rows[0]);
    const html = `<!doctype html><html><head><title>${type} Report</title><style>
      body{font-family:Inter,system-ui,sans-serif;padding:32px;color:#1e293b}
      h1{font-size:20px;margin-bottom:4px}
      p.sub{color:#64748b;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#f1f5f9;text-align:left;padding:8px;border-bottom:2px solid #e2e8f0;text-transform:uppercase;font-size:10px;letter-spacing:.05em}
      td{padding:8px;border-bottom:1px solid #e2e8f0}
      tr:nth-child(even){background:#f8fafc}
    </style></head><body>
      <h1>Quran Center — ${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
      <p class="sub">Generated ${formatDate(new Date().toISOString())} · ${rows.length} records</p>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${String(r[h] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
    else toast("Allow popups to export PDF", "error");
  };

  const REPORTS: { value: ReportType; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    { value: "students", label: "Student Progress", icon: Users, desc: "All students with group, parent, and status" },
    { value: "sessions", label: "Memorization History", icon: BookOpen, desc: "All recorded memorization sessions" },
    { value: "attendance", label: "Attendance", icon: CalendarCheck, desc: "Attendance records by date" },
    { value: "evaluations", label: "Evaluations", icon: GraduationCap, desc: "Student evaluation scores" },
    { value: "teachers", label: "Teacher Performance", icon: BarChart3, desc: "Teaching staff overview" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Generate and export reports for your center.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.value}
              onClick={() => { setType(r.value); }}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition-colors",
                type === r.value ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              )}
            >
              <div className={cn("rounded-lg p-2", type === r.value ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{r.label}</p>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3">
          <Field label="Report type" className="flex-1 min-w-[200px]">
            <Select value={type} onChange={(e) => setType(e.target.value as ReportType)}>
              {REPORTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </Field>
          <Button onClick={runReport} loading={loading}>Generate</Button>
          <Button variant="outline" onClick={exportCSV} disabled={rows.length === 0}><FileSpreadsheet className="h-4 w-4" /> Excel (CSV)</Button>
          <Button variant="outline" onClick={exportPDF} disabled={rows.length === 0}><FileDown className="h-4 w-4" /> PDF</Button>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>{Object.keys(rows[0]).map((h) => <th key={h} className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                    {Object.values(r).map((v, j) => <td key={j} className="px-4 py-3 text-slate-700 dark:text-slate-300">{String(v ?? "—")}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 50 && <p className="px-4 py-3 text-xs text-slate-500">Showing first 50 of {rows.length} rows. Export to see all.</p>}
        </Card>
      )}
    </div>
  );
}
