import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  fetchAttendance, fetchStudents, fetchGroups, createAttendance, updateAttendance, deleteAttendance, logAudit,
} from "@/lib/api";
import type { Attendance, Student, Group, AttendanceStatus } from "@/lib/types";
import {
  Card, CardContent, Button, Input, Select, Field, Badge, Table, THead, TR, TH, TD, EmptyState, Pagination, Dialog, FullSpinner,
} from "@/components/ui";
import { ATTENDANCE_LABELS } from "@/lib/quranData";
import { formatDate, todayInputDate, totalPages as calcTotalPages, cn } from "@/lib/utils";

export function AttendancePage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<Attendance[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [groupId, setGroupId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Attendance | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, s, g] = await Promise.all([
        fetchAttendance({ status, groupId: groupId || undefined, fromDate, toDate, page, pageSize }),
        fetchStudents({ pageSize: 200 }),
        fetchGroups(),
      ]);
      setData(res.data);
      setTotal(res.total);
      setStudents(s.data);
      setGroups(g);
    } catch (e) { toast((e as Error).message, "error"); } finally { setLoading(false); }
  }, [status, groupId, fromDate, toDate, page, pageSize, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, groupId, fromDate, toDate]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAttendance(confirmDelete.id);
      await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "delete", entityType: "attendance", entityId: confirmDelete.id });
      toast("Record deleted", "success");
      setConfirmDelete(null);
      load();
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const tPages = calcTotalPages(total, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">{total} record{total !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Record Attendance</Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Group" className="sm:w-44">
            <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">All groups</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          </Field>
          <Field label="Status" className="sm:w-36">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
              <option value="late">Late</option>
            </Select>
          </Field>
          <Field label="From" className="sm:w-40"><Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Field>
          <Field label="To" className="sm:w-40"><Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></Field>
          <Button variant="outline" onClick={() => { setStatus("all"); setGroupId(""); setFromDate(""); setToDate(""); }}>Reset</Button>
        </CardContent>
      </Card>

      {loading ? <FullSpinner label="Loading attendance…" /> : data.length === 0 ? (
        <Card><EmptyState icon={CalendarCheck} title="No attendance records" action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Record Attendance</Button>} /></Card>
      ) : (
        <Card className="!p-0">
          <Table>
            <THead><TR><TH>Date</TH><TH>Student</TH><TH>Status</TH><TH>Notes</TH><TH className="text-end">Actions</TH></TR></THead>
            <tbody>
              {data.map((a) => (
                <TR key={a.id}>
                  <TD className="text-xs whitespace-nowrap">{formatDate(a.attendance_date)}</TD>
                  <TD className="font-medium">{a.student?.full_name ?? "—"}</TD>
                  <TD><Badge tone={a.status === "present" ? "emerald" : a.status === "late" ? "amber" : a.status === "excused" ? "sky" : "rose"}>{ATTENDANCE_LABELS[a.status]}</Badge></TD>
                  <TD className="text-xs text-slate-500">{a.notes ?? "—"}</TD>
                  <TD className="text-end"><Button variant="ghost" size="icon" onClick={() => setConfirmDelete(a)} className="text-rose-500"><Trash2 className="h-4 w-4" /></Button></TD>
                </TR>
              ))}
            </tbody>
          </Table>
          <div className="px-4"><Pagination page={page} totalPages={tPages} onPageChange={setPage} total={total} pageSize={pageSize} /></div>
        </Card>
      )}

      {showForm && <AttendanceFormDialog open={showForm} onClose={() => setShowForm(false)} students={students} groups={groups} onSaved={() => { setShowForm(false); load(); }} />}

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete record?" footer={<><Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Delete</Button></>}>
        <p className="text-sm text-slate-600 dark:text-slate-400">This attendance record will be permanently removed.</p>
      </Dialog>
    </div>
  );
}

function AttendanceFormDialog({ open, onClose, students, groups, onSaved }: { open: boolean; onClose: () => void; students: Student[]; groups: Group[]; onSaved: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ student_id: "", attendance_date: todayInputDate(), status: "present" as AttendanceStatus, notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.student_id) { toast("Select a student", "error"); return; }
    setSaving(true);
    try {
      const student = students.find((s) => s.id === form.student_id);
      const payload = {
        student_id: form.student_id,
        group_id: student?.group_id ?? null,
        attendance_date: form.attendance_date,
        status: form.status,
        notes: form.notes || null,
      };
      await createAttendance(payload);
      await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "create", entityType: "attendance", details: { student: student?.full_name, status: form.status } });
      toast("Attendance recorded", "success");
      onSaved();
    } catch (e) { toast((e as Error).message, "error"); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Record Attendance" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit} loading={saving}>Save</Button></>}>
      <div className="space-y-4">
        <Field label="Student" required>
          <Select value={form.student_id} onChange={(e) => set("student_id", e.target.value)}>
            <option value="">Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </Select>
        </Field>
        <Field label="Date" required><Input type="date" value={form.attendance_date} onChange={(e) => set("attendance_date", e.target.value)} /></Field>
        <Field label="Status" required>
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="excused">Excused</option>
            <option value="late">Late</option>
          </Select>
        </Field>
        <Field label="Notes"><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" /></Field>
      </div>
    </Dialog>
  );
}
