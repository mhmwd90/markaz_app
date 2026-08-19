import { useCallback, useEffect, useState } from "react";
import { Plus, BookOpen, Filter, Search, Trash2, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useSurahs } from "@/hooks/useSurahs";
import {
  fetchSessions, fetchStudents, fetchTeachers, createSession, updateSession, softDeleteSession,
  getPageForSurahAyah, countVersesBetween, logAudit,
} from "@/lib/api";
import type { MemorizationSession, Student, Teacher, SessionType, Grade } from "@/lib/types";
import {
  Card, CardContent, Button, Input, Select, Field, Badge, Table, THead, TR, TH, TD, EmptyState, Pagination, Dialog, FullSpinner,
} from "@/components/ui";
import { SESSION_TYPE_LABELS, GRADE_LABELS, gradeColor } from "@/lib/quranData";
import { formatDate, totalPages as calcTotalPages, cn } from "@/lib/utils";

export function SessionsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { getSurah } = useSurahs();
  const [data, setData] = useState<MemorizationSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sessionType, setSessionType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MemorizationSession | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MemorizationSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, s, t] = await Promise.all([
        fetchSessions({ sessionType, fromDate, toDate, page, pageSize }),
        fetchStudents({ pageSize: 200 }),
        fetchTeachers(),
      ]);
      setData(res.data);
      setTotal(res.total);
      setStudents(s.data);
      setTeachers(t);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [sessionType, fromDate, toDate, page, pageSize, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [sessionType, fromDate, toDate]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await softDeleteSession(confirmDelete.id);
      await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "delete", entityType: "session", entityId: confirmDelete.id });
      toast("Session removed", "success");
      setConfirmDelete(null);
      load();
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const tPages = calcTotalPages(total, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Memorization Records</h1>
          <p className="mt-1 text-sm text-slate-500">{total} session{total !== 1 ? "s" : ""} recorded</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" /> Record Session</Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Type" className="sm:w-44">
            <Select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
              <option value="all">All types</option>
              <option value="new">New Memorization</option>
              <option value="revision">Revision</option>
              <option value="exam">Exam</option>
            </Select>
          </Field>
          <Field label="From date" className="sm:w-40"><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Field>
          <Field label="To date" className="sm:w-40"><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></Field>
          <Button variant="outline" onClick={() => { setSessionType("all"); setFromDate(""); setToDate(""); }}>Reset</Button>
        </CardContent>
      </Card>

      {loading ? <FullSpinner label="Loading sessions…" /> : data.length === 0 ? (
        <Card><EmptyState icon={BookOpen} title="No sessions found" action={<Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" /> Record Session</Button>} /></Card>
      ) : (
        <Card className="!p-0">
          <Table>
            <THead><TR><TH>Date</TH><TH>Student</TH><TH>Type</TH><TH>Range</TH><TH>Pages</TH><TH>Verses</TH><TH>Grade</TH><TH>Mistakes</TH><TH className="text-end">Actions</TH></TR></THead>
            <tbody>
              {data.map((s) => {
                const fromS = getSurah(s.from_surah_number);
                const toS = getSurah(s.to_surah_number);
                return (
                  <TR key={s.id}>
                    <TD className="text-xs whitespace-nowrap">{formatDate(s.session_date)}</TD>
                    <TD className="font-medium">{s.student?.full_name ?? "—"}</TD>
                    <TD><Badge tone={s.session_type === "exam" ? "amber" : s.session_type === "new" ? "emerald" : "sky"}>{SESSION_TYPE_LABELS[s.session_type]}</Badge></TD>
                    <TD className="text-xs">{fromS?.name_english} {s.from_ayah} → {toS?.name_english} {s.to_ayah}</TD>
                    <TD>{s.total_pages}</TD>
                    <TD>{s.total_verses}</TD>
                    <TD className={cn("font-medium", gradeColor(s.grade))}>{s.grade ? GRADE_LABELS[s.grade] : "—"}</TD>
                    <TD>{s.mistake_count}</TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(s)} className="text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
          <div className="px-4"><Pagination page={page} totalPages={tPages} onPageChange={setPage} total={total} pageSize={pageSize} /></div>
        </Card>
      )}

      {showForm && (
        <SessionFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          session={editing}
          students={students}
          teachers={teachers}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete session?" footer={<><Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Delete</Button></>}>
        <p className="text-sm text-slate-600 dark:text-slate-400">This memorization record will be archived.</p>
      </Dialog>
    </div>
  );
}

interface FormProps {
  open: boolean;
  onClose: () => void;
  session: MemorizationSession | null;
  students: Student[];
  teachers: Teacher[];
  onSaved: () => void;
}

function SessionFormDialog({ open, onClose, session, students, teachers, onSaved }: FormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { surahs } = useSurahs();
  const [form, setForm] = useState({
    student_id: "", session_date: new Date().toISOString().slice(0, 10), session_type: "new" as SessionType,
    from_surah_number: "1", from_ayah: "1", to_surah_number: "1", to_ayah: "1",
    grade: "good" as Grade, mistake_count: "0", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{ pages: number | null; verses: number }>({ pages: null, verses: 0 });

  useEffect(() => {
    if (session) {
      setForm({
        student_id: session.student_id,
        session_date: session.session_date.slice(0, 10),
        session_type: session.session_type,
        from_surah_number: String(session.from_surah_number),
        from_ayah: String(session.from_ayah),
        to_surah_number: String(session.to_surah_number),
        to_ayah: String(session.to_ayah),
        grade: session.grade ?? "good",
        mistake_count: String(session.mistake_count),
        notes: session.notes ?? "",
      });
    } else {
      setForm({
        student_id: "", session_date: new Date().toISOString().slice(0, 10), session_type: "new",
        from_surah_number: "1", from_ayah: "1", to_surah_number: "1", to_ayah: "1",
        grade: "good", mistake_count: "0", notes: "",
      });
    }
  }, [session, open]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // auto-calc pages + verses
  useEffect(() => {
    const fromS = Number(form.from_surah_number);
    const fromA = Number(form.from_ayah);
    const toS = Number(form.to_surah_number);
    const toA = Number(form.to_ayah);
    if (!fromS || !toS) return;
    const fromP = surahs.find((s) => s.number === fromS)?.start_page ?? 1;
    getPageForSurahAyah(toS, toA).then((p) => setPreview({ pages: p != null ? Math.max(0, p - fromP + 1) : 0, verses: 0 }));
    countVersesBetween(fromS, fromA, toS, toA).then((v) => setPreview((p) => ({ ...p, verses: v })));
  }, [form.from_surah_number, form.from_ayah, form.to_surah_number, form.to_ayah, surahs]);

  const handleSubmit = async () => {
    if (!form.student_id) { toast("Select a student", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id,
        session_date: form.session_date,
        session_type: form.session_type,
        from_surah_number: Number(form.from_surah_number),
        from_ayah: Number(form.from_ayah),
        to_surah_number: Number(form.to_surah_number),
        to_ayah: Number(form.to_ayah),
        total_pages: preview.pages ?? 0,
        total_verses: preview.verses,
        grade: form.grade,
        mistake_count: Number(form.mistake_count) || 0,
        notes: form.notes || null,
      };
      if (session) {
        await updateSession(session.id, payload);
        await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "update", entityType: "session", entityId: session.id });
        toast("Session updated", "success");
      } else {
        const s = await createSession(payload);
        await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "create", entityType: "session", entityId: s.id });
        toast("Session recorded", "success");
      }
      onSaved();
    } catch (e) { toast((e as Error).message, "error"); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} title={session ? "Edit Session" : "Record Session"} size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit} loading={saving}>{session ? "Save" : "Record"}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Student" required className="sm:col-span-2">
          <Select value={form.student_id} onChange={(e) => set("student_id", e.target.value)}>
            <option value="">Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </Select>
        </Field>
        <Field label="Date" required><Input type="date" value={form.session_date} onChange={(e) => set("session_date", e.target.value)} /></Field>
        <Field label="Type" required>
          <Select value={form.session_type} onChange={(e) => set("session_type", e.target.value)}>
            <option value="new">New Memorization</option>
            <option value="revision">Revision</option>
            <option value="exam">Exam</option>
          </Select>
        </Field>
        <Field label="From Surah" required>
          <Select value={form.from_surah_number} onChange={(e) => set("from_surah_number", e.target.value)}>
            {surahs.map((s) => <option key={s.id} value={s.number}>{s.number}. {s.name_english}</option>)}
          </Select>
        </Field>
        <Field label="From Ayah" required><Input type="number" min={1} value={form.from_ayah} onChange={(e) => set("from_ayah", e.target.value)} /></Field>
        <Field label="To Surah" required>
          <Select value={form.to_surah_number} onChange={(e) => set("to_surah_number", e.target.value)}>
            {surahs.map((s) => <option key={s.id} value={s.number}>{s.number}. {s.name_english}</option>)}
          </Select>
        </Field>
        <Field label="To Ayah" required><Input type="number" min={1} value={form.to_ayah} onChange={(e) => set("to_ayah", e.target.value)} /></Field>
        <div className="sm:col-span-2 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-950">
          <span className="text-emerald-700 dark:text-emerald-300">Auto-calculated: </span>
          <strong>{preview.pages ?? 0} pages</strong> · <strong>{preview.verses} verses</strong>
        </div>
        <Field label="Grade">
          <Select value={form.grade} onChange={(e) => set("grade", e.target.value)}>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="satisfactory">Satisfactory</option>
            <option value="needs_improvement">Needs Improvement</option>
          </Select>
        </Field>
        <Field label="Mistake count"><Input type="number" min={0} value={form.mistake_count} onChange={(e) => set("mistake_count", e.target.value)} /></Field>
        <Field label="Teacher notes" className="sm:col-span-2"><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes" /></Field>
      </div>
    </Dialog>
  );
}
