import { useState } from "react";
import { Menu, Moon, Sun, Languages, LogOut, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme, direction, toggleDirection } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={toggleDirection} title="Toggle language / اتجاه">
          <Languages className="h-5 w-5" />
          <span className="sr-only">Toggle direction</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle dark mode">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" title="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className={cn("absolute z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-800 dark:bg-slate-900", direction === "ltr" ? "end-0" : "start-0")}>
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{profile?.full_name}</p>
                  <p className="truncate text-xs text-slate-500">{profile?.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
