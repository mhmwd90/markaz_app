import { useCallback, useEffect, useState } from "react";
import { Plus, School, Pencil, Trash2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { fetchGroups, fetchTeachers, createGroup, updateGroup, softDeleteGroup, logAudit } from "@/lib/api";
import type { Group, Teacher } from "@/lib/types";
import {
  Card, CardContent, Button, Input, Select, Field, Badge, EmptyState, Dialog, FullSpinner,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export function GroupsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Group | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, t] = await Promise.all([fetchGroups(), fetchTeachers()]);
      setGroups(g);
      setTeachers(t);
    } catch (e) { toast((e as Error).message, "error"); } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await softDeleteGroup(confirmDelete.id);
      await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "delete", entityType: "group", entityId: confirmDelete.id });
      toast("Group archived", "success");
      setConfirmDelete(null);
      load();
    } catch (e) { toast((e as Error).message, "error"); }
  };

  if (loading) return <FullSpinner label="Loading groups…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Groups</h1>
          <p className="mt-1 text-sm text-slate-500">{groups.length} Quran class{groups.length !== 1 ? "es" : ""}</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" /> Add Group</Button>
      </div>

      {groups.length === 0 ? (
        <Card><EmptyState icon={School} title="No groups yet" action={<Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" /> Add Group</Button>} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                      <School className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{g.name}</p>
                      <Badge tone={g.status === "active" ? "emerald" : "neutral"} className="mt-1">{g.status}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(g); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(g)} className="text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {g.description && <p className="mt-3 text-sm text-slate-500">{g.description}</p>}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-slate-500"><Users className="h-4 w-4" /> {g.student_count ?? 0}/{g.capacity}</span>
                  <span className="text-slate-500">{g.teacher?.profile?.full_name ?? "No teacher"}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={cn("h-full rounded-full", (g.student_count ?? 0) >= g.capacity ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, ((g.student_count ?? 0) / g.capacity) * 100)}%` }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && <GroupFormDialog open={showForm} onClose={() => setShowForm(false)} group={editing} teachers={teachers} onSaved={() => { setShowForm(false); load(); }} />}

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Archive group?" footer={<><Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Archive</Button></>}>
        <p className="text-sm text-slate-600 dark:text-slate-400">Students in this group will be unassigned but not deleted.</p>
      </Dialog>
    </div>
  );
}

function GroupFormDialog({ open, onClose, group, teachers, onSaved }: { open: boolean; onClose: () => void; group: Group | null; teachers: Teacher[]; onSaved: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", teacher_id: "", description: "", capacity: "30", status: "active" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) setForm({ name: group.name, teacher_id: group.teacher_id ?? "", description: group.description ?? "", capacity: String(group.capacity), status: group.status });
    else setForm({ name: "", teacher_id: "", description: "", capacity: "30", status: "active" });
  }, [group, open]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast("Group name is required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        teacher_id: form.teacher_id || null,
        description: form.description || null,
        capacity: Number(form.capacity) || 30,
        status: form.status as "active" | "inactive",
      };
      if (group) {
        await updateGroup(group.id, payload);
        await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "update", entityType: "group", entityId: group.id });
        toast("Group updated", "success");
      } else {
        const g = await createGroup(payload);
        await logAudit({ userId: profile?.id, userName: profile?.full_name, action: "create", entityType: "group", entityId: g.id });
        toast("Group created", "success");
      }
      onSaved();
    } catch (e) { toast((e as Error).message, "error"); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} title={group ? "Edit Group" : "Add Group"} size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit} loading={saving}>{group ? "Save" : "Create"}</Button></>}>
      <div className="space-y-4">
        <Field label="Name" required><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Advanced Memorization" /></Field>
        <Field label="Teacher">
          <Select value={form.teacher_id} onChange={(e) => set("teacher_id", e.target.value)}>
            <option value="">No teacher assigned</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.profile?.full_name ?? "Unknown"}</option>)}
          </Select>
        </Field>
        <Field label="Description"><Input value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Capacity"><Input type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </div>
      </div>
    </Dialog>
  );
}
