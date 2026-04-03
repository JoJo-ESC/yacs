import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  startTransition,
} from "react";
import type { Course } from "../types/schedule";
import { fetchText } from "@/api";
import { parseCoursesFromCsvText } from "../utils/parseSchedule";

type SelectionCtx = {
  courses: Course[];
  addCourse: (c: Course) => void;
  removeCourse: (id: string) => void;
  clear: () => void;
  hasCourse: (id: string) => boolean;
};

const SelectionContext = createContext<SelectionCtx | undefined>(undefined);

type CatalogCtx = {
  catalog: Course[];
  filteredCatalog: Course[];
  selectedSemester: string;
  availableSemesters: string[];
  setSelectedSemester: (semester: string) => void;
  loadCsv: (path: string) => Promise<void>;
};

const CatalogContext = createContext<CatalogCtx | undefined>(undefined);

const SEMESTER_STORAGE_KEY = "yacs.selectedSemester";
const AVAILABLE_SEMESTERS = [
  "All Semesters",
  "Fall 2025",
  "Spring 2026",
  "Summer 2026",
  "Fall 2026",
  "Spring 2027",
  "Summer 2027",
  "Fall 2027",
];

function getInitialSemester() {
  if (typeof window === "undefined") return AVAILABLE_SEMESTERS[0];
  const stored = window.localStorage.getItem(SEMESTER_STORAGE_KEY);
  return stored && AVAILABLE_SEMESTERS.includes(stored) ? stored : AVAILABLE_SEMESTERS[0];
}

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>(getInitialSemester);
  const courseIdSet = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < courses.length; i++) s.add(courses[i].id);
    return s;
  }, [courses]);

  const addCourse = useCallback((c: Course) => {
    setCourses((prev) => {
      for (let i = 0; i < prev.length; i++) if (prev[i].id === c.id) return prev;
      return [...prev, c];
    });
  }, []);

  const removeCourse = useCallback((id: string) => {
    setCourses((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => setCourses([]), []);

  const hasCourse = useCallback((id: string) => courseIdSet.has(id), [courseIdSet]);

  const selectionValue = useMemo<SelectionCtx>(
    () => ({ courses, addCourse, removeCourse, clear, hasCourse }),
    [courses, addCourse, removeCourse, clear, hasCourse]
  );

  const [catalog, setCatalog] = useState<Course[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SEMESTER_STORAGE_KEY, selectedSemester);
  }, [selectedSemester]);

  const loadCsv = useCallback(async (path: string) => {
    const text = await fetchText(path);

    startTransition(() => {
      const parsed = parseCoursesFromCsvText(text);
      setCatalog(parsed);
    });
  }, []);

  const filteredCatalog = useMemo(() => {
    if (selectedSemester === "All Semesters") {
      return catalog;
    }

    const term = selectedSemester.split(" ")[0].toLowerCase();
    return catalog.filter((course) => {
      const frequency = course.offerFrequency?.toLowerCase() ?? "";
      return term === "fall"
        ? frequency.includes("fall")
        : term === "spring"
        ? frequency.includes("spring")
        : term === "summer"
        ? frequency.includes("summer")
        : true;
    });
  }, [catalog, selectedSemester]);

  const catalogValue = useMemo<CatalogCtx>(
    () => ({ catalog, filteredCatalog, selectedSemester, availableSemesters: AVAILABLE_SEMESTERS, setSelectedSemester, loadCsv }),
    [catalog, filteredCatalog, selectedSemester, setSelectedSemester, loadCsv]
  );

  return (
    <CatalogContext.Provider value={catalogValue}>
      <SelectionContext.Provider value={selectionValue}>
        {children}
      </SelectionContext.Provider>
    </CatalogContext.Provider>
  );
}

export function useSchedule() {
  const sel = useContext(SelectionContext);
  const cat = useContext(CatalogContext);
  if (!sel || !cat) throw new Error("useSchedule must be used within a ScheduleProvider");
  return { ...sel, ...cat };
}
export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within a ScheduleProvider");
  return ctx;
}
export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within a ScheduleProvider");
  return ctx;
}
