import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Users, Filter, Pencil, Trash2, Phone, School, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { fetchStudents, fetchGroups, softDeleteStudent, createStudent, updateStudent, fetchParents, logAudit } from "@/lib/api";
import type { Student, Group, Parent } from "@/lib/types";
import {
  Card, CardContent, Button, Input, Select, Field, Badge, Table, THead, TR, TH, TD, EmptyState, Pagination, Dialog, FullSpinner,
} from "@/components/ui";
import { STUDENT_STATUS_LABELS, statusColor } from "@/lib/quranData";
import { formatDate, initials, ageFromDob, totalPages as calcTotalPages, cn } from "@/lib/utils";

export function StudentsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [groups, setGroups] = useState<Group[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, g, p] = await Promise.all([
        fetchStudents({ search, groupId, status, page, pageSize }),
        fetchGroups(),
        fetchParents(),
      ]);
      setData(res.data);
      setTotal(res.total);
      setGroups(g);
      setParents(p);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, groupId, status, page, pageSize, toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(1); }, [search, groupId, status]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await softDeleteStudent(confirmDelete.id);
      await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "delete", entityType: "student", entityId: confirmDelete.id, details: { name: confirmDelete.full_name } });
      toast("Student removed", "success");
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const tPages = calcTotalPages(total, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Students</h1>
          <p className="mt-1 text-sm text-slate-500">{total} student{total !== 1 ? "s" : ""} enrolled</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> Add Student
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Search" className="flex-1">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, code, or phone…"
                className="ps-9"
              />
            </div>
          </Field>
          <Field label="Group" className="sm:w-48">
            <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="all">All groups</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          </Field>
          <Field label="Status" className="sm:w-40">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {loading ? (
        <FullSpinner label="Loading students…" />
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No students found" description="Try adjusting your filters or add a new student." action={<Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" /> Add Student</Button>} />
        </Card>
      ) : (
        <Card className="!p-0">
          <Table>
            <THead>
              <TR>
                <TH>Student</TH>
                <TH>Group</TH>
                <TH>Parent</TH>
                <TH>Contact</TH>
                <TH>Status</TH>
                <TH>Enrolled</TH>
                <TH className="text-end">Actions</TH>
              </TR>
            </THead>
            <tbody>
              {data.map((s) => (
                <TR key={s.id} onClick={() => navigate(`/students/${s.id}`)}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {initials(s.full_name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{s.full_name}</p>
                        <p className="text-xs text-slate-500">{s.student_code} · {ageFromDob(s.date_of_birth) != null ? `${ageFromDob(s.date_of_birth)}y` : "—"}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>{s.group?.name ?? <span className="text-slate-400">—</span>}</TD>
                  <TD>{s.parent?.profile?.full_name ?? <span className="text-slate-400">—</span>}</TD>
                  <TD>
                    {s.phone_primary ? (
                      <span className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" /> {s.phone_primary}</span>
                    ) : <span className="text-slate-400">—</span>}
                  </TD>
                  <TD><Badge tone={s.status === "active" ? "emerald" : s.status === "graduated" ? "sky" : "neutral"}>{STUDENT_STATUS_LABELS[s.status]}</Badge></TD>
                  <TD className="text-xs">{formatDate(s.enrollment_date)}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/students/${s.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(s)} className="text-rose-500 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
          <div className="px-4">
            <Pagination page={page} totalPages={tPages} onPageChange={setPage} total={total} pageSize={pageSize} />
          </div>
        </Card>
      )}

      {showForm && (
        <StudentFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          student={editing}
          groups={groups}
          parents={parents}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove student?"
        description={confirmDelete ? `This will archive ${confirmDelete.full_name}. You can restore them later.` : ""}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">The student's records will be preserved but hidden from active lists.</p>
      </Dialog>
    </div>
  );
}

interface FormProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  groups: Group[];
  parents: Parent[];
  onSaved: () => void;
}

function StudentFormDialog({ open, onClose, student, groups, parents, onSaved }: FormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: "", gender: "male" as "male" | "female", date_of_birth: "", school: "", grade: "",
    group_id: "", parent_id: "", phone_primary: "", phone_secondary: "", enrollment_date: new Date().toISOString().slice(0, 10),
    status: "active" as "active" | "inactive" | "graduated", notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        full_name: student.full_name,
        gender: student.gender ?? "male",
        date_of_birth: student.date_of_birth ?? "",
        school: student.school ?? "",
        grade: student.grade ?? "",
        group_id: student.group_id ?? "",
        parent_id: student.parent_id ?? "",
        phone_primary: student.phone_primary ?? "",
        phone_secondary: student.phone_secondary ?? "",
        enrollment_date: student.enrollment_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        status: student.status,
        notes: student.notes ?? "",
      });
    } else {
      setForm({
        full_name: "", gender: "male", date_of_birth: "", school: "", grade: "",
        group_id: "", parent_id: "", phone_primary: "", phone_secondary: "",
        enrollment_date: new Date().toISOString().slice(0, 10), status: "active", notes: "",
      });
    }
  }, [student, open]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast("Full name is required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        gender: form.gender,
        date_of_birth: form.date_of_birth || null,
        school: form.school || null,
        grade: form.grade || null,
        group_id: form.group_id || null,
        parent_id: form.parent_id || null,
        phone_primary: form.phone_primary || null,
        phone_secondary: form.phone_secondary || null,
        enrollment_date: form.enrollment_date,
        status: form.status,
        notes: form.notes || null,
      };
      if (student) {
        await updateStudent(student.id, payload);
        await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "update", entityType: "student", entityId: student.id, details: { name: payload.full_name } });
        toast("Student updated", "success");
      } else {
        const code = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
        await createStudent({ ...payload, student_code: code });
        await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "create", entityType: "student", details: { name: payload.full_name, code } });
        toast("Student added", "success");
      }
      onSaved();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={student ? "Edit Student" : "Add Student"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>{student ? "Save changes" : "Add student"}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required className="sm:col-span-2">
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Student's full name" />
        </Field>
        <Field label="Gender">
          <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </Field>
        <Field label="Date of birth">
          <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
        </Field>
        <Field label="School"><Input value={form.school} onChange={(e) => set("school", e.target.value)} /></Field>
        <Field label="Grade"><Input value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="e.g. Grade 5" /></Field>
        <Field label="Group">
          <Select value={form.group_id} onChange={(e) => set("group_id", e.target.value)}>
            <option value="">No group</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
        </Field>
        <Field label="Parent / Guardian">
          <Select value={form.parent_id} onChange={(e) => set("parent_id", e.target.value)}>
            <option value="">No parent linked</option>
            {parents.map((p) => <option key={p.id} value={p.id}>{p.profile?.full_name ?? "Unknown"}</option>)}
          </Select>
        </Field>
        <Field label="Primary phone"><Input value={form.phone_primary} onChange={(e) => set("phone_primary", e.target.value)} placeholder="+966…" /></Field>
        <Field label="Secondary phone"><Input value={form.phone_secondary} onChange={(e) => set("phone_secondary", e.target.value)} placeholder="+966…" /></Field>
        <Field label="Enrollment date"><Input type="date" value={form.enrollment_date} onChange={(e) => set("enrollment_date", e.target.value)} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </Select>
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes" />
        </Field>
      </div>
    </Dialog>
  );
}
