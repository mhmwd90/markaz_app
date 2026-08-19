import { useEffect, useState } from "react";
import { Bell, Check, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchNotifications, markNotificationRead } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { Card, CardContent, EmptyState, Button, Badge, FullSpinner } from "@/components/ui";
import { relativeTime, cn } from "@/lib/utils";

const TYPE_TONE: Record<string, "emerald" | "sky" | "amber" | "neutral"> = {
  attendance: "amber",
  memorization: "emerald",
  reminder: "sky",
  general: "neutral",
};

export function NotificationsPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const n = await fetchNotifications(profile.id);
      setData(n);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [profile]);

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    setData((d) => d.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAll = async () => {
    await Promise.all(data.filter((n) => !n.read).map((n) => markNotificationRead(n.id)));
    setData((d) => d.map((n) => ({ ...n, read: true })));
  };

  if (loading) return <FullSpinner label="Loading notifications…" />;

  const unread = data.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">{unread} unread of {data.length}</p>
        </div>
        {unread > 0 && <Button variant="outline" size="sm" onClick={markAll}><Check className="h-4 w-4" /> Mark all read</Button>}
      </div>

      {data.length === 0 ? (
        <Card><EmptyState icon={Bell} title="No notifications" description="Attendance alerts, memorization reminders, and center announcements will appear here." /></Card>
      ) : (
        <div className="space-y-3">
          {data.map((n) => (
            <Card key={n.id} className={cn(!n.read && "border-emerald-300 dark:border-emerald-800")}>
              <CardContent className="flex items-start gap-3">
                <div className={cn("rounded-lg p-2", n.read ? "bg-slate-100 dark:bg-slate-800" : "bg-emerald-100 dark:bg-emerald-950")}>
                  <Bell className={cn("h-5 w-5", n.read ? "text-slate-400" : "text-emerald-600 dark:text-emerald-400")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                    <Badge tone={TYPE_TONE[n.type] ?? "neutral"}>{n.type}</Badge>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                  </div>
                  {n.body && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-400">{relativeTime(n.created_at)}</p>
                </div>
                {!n.read && <Button variant="ghost" size="sm" onClick={() => handleRead(n.id)}><CheckCircle2 className="h-4 w-4" /></Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
