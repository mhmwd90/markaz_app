import { useState, type FormEvent } from "react";
import { User, Moon, Sun, Languages, Shield, Bell, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Field, Badge } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/quranData";

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { theme, toggleTheme, direction, toggleDirection } = useTheme();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName, phone: phone || null }).eq("id", profile.id);
      if (error) throw error;
      await refreshProfile();
      toast("Profile updated", "success");
    } catch (err) { toast((err as Error).message, "error"); } finally { setSaving(false); }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account and preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
                <Field label="Email"><Input value={profile.email} disabled /></Field>
                <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966…" /></Field>
                <Field label="Role"><Input value={ROLE_LABELS[profile.role]} disabled /></Field>
                <Button type="submit" loading={saving}>Save changes</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Password</p>
                  <p className="text-xs text-slate-500">Last changed recently</p>
                </div>
                <Badge tone="emerald">Secured</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Two-factor auth</p>
                  <p className="text-xs text-slate-500">Coming soon</p>
                </div>
                <Badge tone="neutral">Not enabled</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Appearance</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <button onClick={toggleTheme} className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </span>
                <span className="text-xs text-slate-400">Click to toggle</span>
              </button>
              <button onClick={toggleDirection} className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Languages className="h-4 w-4" />
                  {direction === "rtl" ? "Arabic (RTL)" : "English (LTR)"}
                </span>
                <span className="text-xs text-slate-400">Click to toggle</span>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {["Attendance alerts", "Memorization reminders", "Center announcements"].map((n, i) => (
                <label key={n} className="flex items-center justify-between rounded-lg p-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{n}</span>
                  <input type="checkbox" defaultChecked={i < 2} className="h-4 w-4 rounded accent-emerald-600" />
                </label>
              ))}
              <p className="pt-2 text-xs text-slate-400">Notification delivery channels (email/SMS) coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
