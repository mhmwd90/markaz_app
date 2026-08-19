import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchSurahs } from "@/lib/api";
import type { QuranSurah } from "@/lib/types";

interface SurahContextValue {
  surahs: QuranSurah[];
  loading: boolean;
  getSurah: (n: number) => QuranSurah | undefined;
}

const SurahContext = createContext<SurahContextValue | undefined>(undefined);

export function SurahProvider({ children }: { children: ReactNode }) {
  const [surahs, setSurahs] = useState<QuranSurah[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurahs()
      .then(setSurahs)
      .catch((e) => console.error("Failed to load surahs", e))
      .finally(() => setLoading(false));
  }, []);

  const getSurah = (n: number) => surahs.find((s) => s.number === n);

  return (
    <SurahContext.Provider value={{ surahs, loading, getSurah }}>
      {children}
    </SurahContext.Provider>
  );
}

export function useSurahs() {
  const ctx = useContext(SurahContext);
  if (!ctx) throw new Error("useSurahs must be used within SurahProvider");
  return ctx;
}
