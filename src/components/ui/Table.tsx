import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 dark:bg-slate-800/50">{children}</thead>;
}

export function TR({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      className={cn(
        "border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors",
        onClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TH({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TD({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 text-slate-700 dark:text-slate-300", className)}>{children}</td>;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<{ className?: string }>; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
