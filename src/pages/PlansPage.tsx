import { useCallback, useEffect, useState } from "react";
import { Plus, BookText, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  fetchPlans, fetchStudents, createPlan, updatePlan, fetchDailyAssignments, updateAssignment, logAudit,
} from "@/lib/api";
import type { MemorizationPlan, Student, PlanType, PlanStatus, DailyAssignment, AssignmentStatus } from "@/lib/types";
import {
  Card, CardContent, Button, Input, Select, Field, Badge, EmptyState, Pagination, Dialog, FullSpinner,
} from "@/components/ui";
import { PLAN_TYPE_LABELS, PLAN_STATUS_LABELS, ASSIGNMENT_STATUS_LABELS, planStatusColor } from "@/lib/quranData";
import { formatDate, totalPages as calcTotalPages, cn } from "@/lib/utils";

export function PlansPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<MemorizationPlan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<DailyAssignment[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, s] = await Promise.all([
        fetchPlans({ status, page, pageSize }),
        fetchStudents({ pageSize: 200 }),
      ]);
      setData(res.data);
      setTotal(res.total);
      setStudents(s.data);
    } catch (e) { toast((e as Error).message, "error"); } finally { setLoading(false); }
  }, [status, page, pageSize, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  const toggleExpand = async (planId: string) => {
    if (expanded === planId) { setExpanded(null); return; }
    setExpanded(planId);
    const a = await fetchDailyAssignments(planId);
    setAssignments(a);
  };

  const toggleAssignment = async (a: DailyAssignment) => {
    const newStatus: AssignmentStatus = a.status === "completed" ? "pending" : "completed";
    try {
      await updateAssignment(a.id, { status: newStatus, completed_at: newStatus === "completed" ? new Date().toISOString() : null });
      if (expanded) {
        const fresh = await fetchDailyAssignments(expanded);
        setAssignments(fresh);
      }
      toast("Assignment updated", "success");
    } catch (e) { toast((e as Error).message, "error"); }
  };

  const tPages = calcTotalPages(total, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Memorization Plans</h1>
          <p className="mt-1 text-sm text-slate-500">{total} plan{total !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> New Plan</Button>
      </div>

      <Card>
        <CardContent className="flex items-end gap-3">
          <Field label="Status" className="sm:w-48">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {loading ? <FullSpinner label="Loading plans…" /> : data.length === 0 ? (
        <Card><EmptyState icon={BookText} title="No plans yet" action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> New Plan</Button>} /></Card>
      ) : (
        <div className="space-y-4">
          {data.map((p) => {
            const isExp = expanded === p.id;
            const done = isExp ? assignments.filter((a) => a.status === "completed").length : 0;
            const prog = isExp && assignments.length > 0 ? Math.round((done / assignments.length) * 100) : 0;
            return (
              <Card key={p.id}>
                <CardContent>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{p.student?.full_name}</p>
                        <Badge tone={p.plan_type === "memorization" ? "emerald" : "sky"}>{PLAN_TYPE_LABELS[p.plan_type]}</Badge>
                        <Badge tone={p.status === "active" ? "emerald" : p.status === "completed" ? "sky" : "amber"}>{PLAN_STATUS_LABELS[p.status]}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Pages {p.start_page}–{p.end_page} · {p.daily_pages}/day · Started {formatDate(p.start_date)} · Expected {formatDate(p.expected_completion_date)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toggleExpand(p.id)}>
                      {isExp ? "Hide" : "View"} assignments
                    </Button>
                  </div>

                  {isExp && (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Progress: {done}/{assignments.length} days</span>
                        <span className="font-medium text-emerald-600">{prog}%</span>
                      </div>
                      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${prog}%` }} />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {assignments.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => toggleAssignment(a)}
                            className={cn(
                              "flex items-center justify-between rounded-lg border p-3 text-start transition-colors",
                              a.status === "completed" ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950" :
                              a.status === "skipped" ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950" :
                              "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                            )}
                          >
                            <div>
                              <p className="text-xs text-slate-500">{formatDate(a.assignment_date)}</p>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Pages {a.from_page}–{a.to_page}</p>
                            </div>
                            <Badge tone={a.status === "completed" ? "emerald" : a.status === "skipped" ? "amber" : "neutral"}>{ASSIGNMENT_STATUS_LABELS[a.status]}</Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          <Pagination page={page} totalPages={tPages} onPageChange={setPage} total={total} pageSize={pageSize} />
        </div>
      )}

      {showForm && <PlanFormDialog open={showForm} onClose={() => setShowForm(false)} students={students} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function PlanFormDialog({ open, onClose, students, onSaved }: { open: boolean; onClose: () => void; students: Student[]; onSaved: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    student_id: "", plan_type: "memorization" as PlanType, start_page: "1", end_page: "20",
    daily_pages: "1", start_date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.student_id) { toast("Select a student", "error"); return; }
    if (Number(form.end_page) < Number(form.start_page)) { toast("End page must be ≥ start page", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id,
        plan_type: form.plan_type,
        start_page: Number(form.start_page),
        end_page: Number(form.end_page),
        daily_pages: Number(form.daily_pages) || 1,
        start_date: form.start_date,
        status: "active" as PlanStatus,
      };
      const p = await createPlan(payload);
      await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "create", entityType: "plan", entityId: p.id });
      toast("Plan created with daily assignments", "success");
      onSaved();
    } catch (e) { toast((e as Error).message, "error"); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} title="New Memorization Plan" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit} loading={saving}>Create plan</Button></>}>
      <div className="space-y-4">
        <Field label="Student" required>
          <Select value={form.student_id} onChange={(e) => set("student_id", e.target.value)}>
            <option value="">Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </Select>
        </Field>
        <Field label="Plan type" required>
          <Select value={form.plan_type} onChange={(e) => set("plan_type", e.target.value)}>
            <option value="memorization">Memorization</option>
            <option value="revision">Revision</option>
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Start page" required><Input type="number" min={1} max={604} value={form.start_page} onChange={(e) => set("start_page", e.target.value)} /></Field>
          <Field label="End page" required><Input type="number" min={1} max={604} value={form.end_page} onChange={(e) => set("end_page", e.target.value)} /></Field>
          <Field label="Daily pages" required><Input type="number" min={1} value={form.daily_pages} onChange={(e) => set("daily_pages", e.target.value)} /></Field>
        </div>
        <Field label="Start date" required><Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} /></Field>
        <p className="rounded-lg bg-sky-50 p-3 text-xs text-sky-700 dark:bg-sky-950 dark:text-sky-300">
          Daily assignments will be generated automatically, skipping Fridays. The expected completion date is calculated from the daily page rate.
        </p>
      </div>
    </Dialog>
  );
}
