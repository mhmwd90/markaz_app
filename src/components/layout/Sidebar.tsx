import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, ClipboardCheck, GraduationCap,
  CalendarCheck, BarChart3, Bell, Settings, BookText, X, School,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

interface NavItem {
  to: string;
  label: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", labelAr: "الرئيسية", icon: LayoutDashboard, roles: ["admin", "teacher", "parent"] },
  { to: "/students", label: "Students", labelAr: "الطلاب", icon: Users, roles: ["admin", "teacher"] },
  { to: "/sessions", label: "Memorization", labelAr: "الحفظ", icon: BookOpen, roles: ["admin", "teacher"] },
  { to: "/plans", label: "Plans", labelAr: "الخطط", icon: BookText, roles: ["admin", "teacher"] },
  { to: "/attendance", label: "Attendance", labelAr: "الحضور", icon: CalendarCheck, roles: ["admin", "teacher"] },
  { to: "/evaluations", label: "Evaluations", labelAr: "التقييمات", icon: GraduationCap, roles: ["admin", "teacher"] },
  { to: "/groups", label: "Groups", labelAr: "الحلقات", icon: School, roles: ["admin"] },
  { to: "/reports", label: "Reports", labelAr: "التقارير", icon: BarChart3, roles: ["admin", "teacher"] },
  { to: "/notifications", label: "Notifications", labelAr: "الإشعارات", icon: Bell, roles: ["admin", "teacher", "parent"] },
  { to: "/settings", label: "Settings", labelAr: "الإعدادات", icon: Settings, roles: ["admin", "teacher", "parent"] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { profile } = useAuth();
  const { direction } = useTheme();
  const location = useLocation();
  const role = profile?.role ?? "parent";
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed inset-y-0 z-40 flex w-64 flex-col border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0",
          direction === "ltr" ? "start-0 border-e" : "end-0 border-s",
          open ? "translate-x-0" : direction === "ltr" ? "-translate-x-full" : "translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">Quran Center</p>
              <p className="text-xs text-slate-500">Memorization Manager</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => onClose()}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{direction === "rtl" ? item.labelAr : item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{profile?.full_name}</p>
              <p className="truncate text-xs text-slate-500 capitalize">{role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
