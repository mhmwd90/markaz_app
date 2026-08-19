import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "emerald" | "sky" | "amber" | "rose" | "violet" | "slate";
  sub?: ReactNode;
}

const TONES = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function StatCard({ label, value, icon: Icon, tone = "slate", sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={cn("rounded-lg p-3", TONES[tone])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
