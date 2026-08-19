import { useCallback, useEffect, useState } from "react";
import { Plus, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { fetchEvaluations, fetchStudents, createEvaluation, logAudit } from "@/lib/api";
import type { Evaluation, Student } from "@/lib/types";
import {
  Card, CardContent, Button, Input, Select, Field, Badge, EmptyState, Pagination, Dialog, FullSpinner,
} from "@/components/ui";
import { gradeStars } from "@/lib/quranData";
import { formatDate, totalPages as calcTotalPages } from "@/lib/utils";

export function EvaluationsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<Evaluation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, s] = await Promise.all([
        fetchEvaluations({ page, pageSize }),
        fetchStudents({ pageSize: 200 }),
      ]);
      setData(res.data);
      setTotal(res.total);
      setStudents(s.data);
    } catch (e) { toast((e as Error).message, "error"); } finally { setLoading(false); }
  }, [page, pageSize, toast]);

  useEffect(() => { load(); }, [load]);

  const tPages = calcTotalPages(total, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Evaluations</h1>
          <p className="mt-1 text-sm text-slate-500">{total} evaluation{total !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> New Evaluation</Button>
      </div>

      {loading ? <FullSpinner label="Loading evaluations…" /> : data.length === 0 ? (
        <Card><EmptyState icon={GraduationCap} title="No evaluations yet" action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> New Evaluation</Button>} /></Card>
      ) : (
        <div className="space-y-4">
          {data.map((e) => (
            <Card key={e.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {e.student?.full_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{e.student?.full_name}</p>
                      <p className="text-xs text-slate-500">{formatDate(e.evaluation_date)} {e.teacher?.profile?.full_name ? `· ${e.teacher.profile.full_name}` : ""}</p>
                    </div>
                  </div>
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
          <Pagination page={page} totalPages={tPages} onPageChange={setPage} total={total} pageSize={pageSize} />
        </div>
      )}

      {showForm && <EvalFormDialog open={showForm} onClose={() => setShowForm(false)} students={students} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function EvalFormDialog({ open, onClose, students, onSaved }: { open: boolean; onClose: () => void; students: Student[]; onSaved: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    student_id: "", evaluation_date: new Date().toISOString().slice(0, 10),
    tajweed: "4", memorization_quality: "4", revision_quality: "4", behavior: "5", participation: "4", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.student_id) { toast("Select a student", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        student_id: form.student_id,
        evaluation_date: form.evaluation_date,
        tajweed: Number(form.tajweed), memorization_quality: Number(form.memorization_quality),
        revision_quality: Number(form.revision_quality), behavior: Number(form.behavior),
        participation: Number(form.participation), notes: form.notes || null,
      };
      const ev = await createEvaluation(payload);
      await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "create", entityType: "evaluation", entityId: ev.id });
      toast("Evaluation saved", "success");
      onSaved();
    } catch (e) { toast((e as Error).message, "error"); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} title="New Evaluation" size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit} loading={saving}>Save</Button></>}>
      <div className="space-y-4">
        <Field label="Student" required>
          <Select value={form.student_id} onChange={(e) => set("student_id", e.target.value)}>
            <option value="">Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </Select>
        </Field>
        <Field label="Date" required><Input type="date" value={form.evaluation_date} onChange={(e) => set("evaluation_date", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {([["tajweed", "Tajweed"], ["memorization_quality", "Memorization"], ["revision_quality", "Revision"], ["behavior", "Behavior"], ["participation", "Participation"]] as const).map(([k, label]) => (
            <Field key={k} label={label}>
              <Select value={form[k]} onChange={(e) => set(k, e.target.value)}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}{"☆".repeat(5 - n)}</option>)}
              </Select>
            </Field>
          ))}
        </div>
        <Field label="Notes"><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" /></Field>
      </div>
    </Dialog>
  );
}
