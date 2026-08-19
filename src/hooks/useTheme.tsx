import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type Direction = "ltr" | "rtl";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  direction: Direction;
  toggleDirection: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("qmc-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [direction, setDirection] = useState<Direction>(() => {
    const saved = localStorage.getItem("qmc-dir");
    return saved === "rtl" ? "rtl" : "ltr";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("qmc-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = direction === "rtl" ? "ar" : "en";
    localStorage.setItem("qmc-dir", direction);
  }, [direction]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        direction,
        toggleDirection: () => setDirection((d) => (d === "ltr" ? "rtl" : "ltr")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
