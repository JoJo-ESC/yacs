import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { fetchSemesters } from "@/api";
import type { ApiSemesterResponse } from "@/api/types";
import { track } from "@/lib/analytics";

type SemesterCtx = {
  semesters: ApiSemesterResponse[];
  selectedSemester: string | undefined;
  setSelectedSemester: (term: string) => void;
  semestersLoading: boolean;
};

const SemesterContext = createContext<SemesterCtx | undefined>(undefined);

const LATEST_SEMESTER_STORAGE_KEY = "yacs:latestSemester";

// Best guess at the newest semester before /api/semesters answers, so the
// course catalog can start loading immediately instead of waiting on it:
// the newest term seen on a previous visit, else one inferred from the date
// (Fall data is published in spring, Spring data around November).
function guessLatestSemester(): string {
  try {
    const saved = localStorage.getItem(LATEST_SEMESTER_STORAGE_KEY);
    if (saved && /^\d{6}$/.test(saved)) return saved;
  } catch {
    // Storage unavailable (private mode, blocked site data) — use the date.
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month <= 3) return `${year}01`;
  if (month <= 10) return `${year}09`;
  return `${year + 1}01`;
}

export function SemesterProvider({ children }: { children: React.ReactNode }) {
  const [semesters, setSemesters] = useState<ApiSemesterResponse[]>([]);
  const [selectedSemester, setSelectedSemesterState] = useState<string | undefined>(guessLatestSemester);
  const [semestersLoading, setSemestersLoading] = useState(true);
  const userPickedRef = useRef(false);

  const setSelectedSemester = useCallback((term: string) => {
    userPickedRef.current = true;
    track("semester_changed", { semester: term });
    setSelectedSemesterState(term);
  }, []);

  useEffect(() => {
    fetchSemesters()
      .then((data) => {
        setSemesters(data);
        if (data.length === 0) return;
        const latest = data[0].term;
        try {
          localStorage.setItem(LATEST_SEMESTER_STORAGE_KEY, latest);
        } catch {
          // Non-essential; the date-based guess still works next time.
        }
        // Correct the startup guess, unless the user already picked one.
        if (!userPickedRef.current) setSelectedSemesterState(latest);
      })
      .catch(() => {})
      .finally(() => setSemestersLoading(false));
  }, []);

  const value = useMemo<SemesterCtx>(
    () => ({ semesters, selectedSemester, setSelectedSemester, semestersLoading }),
    [semesters, selectedSemester, setSelectedSemester, semestersLoading]
  );

  return (
    <SemesterContext.Provider value={value}>
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  const ctx = useContext(SemesterContext);
  if (!ctx) throw new Error("useSemester must be used within a SemesterProvider");
  return ctx;
}
