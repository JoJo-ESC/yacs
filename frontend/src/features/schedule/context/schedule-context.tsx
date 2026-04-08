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

const SELECTED_SEMESTER_STORAGE_KEY = "yacs:selected-semester";

function filterCoursesBySemester(courses: Course[], selectedSemester: string) {
  if (!selectedSemester) return courses;

  return courses
    .map((course) => {
      const meetings = course.meetings.filter(
        (meeting) => meeting.semester?.trim() === selectedSemester
      );
      return { ...course, meetings };
    })
    .filter((course) => course.meetings.length > 0);
}

type SelectionCtx = {
  courses: Course[];
  selectedSemester: string;
  addCourse: (c: Course) => void;
  removeCourse: (id: string) => void;
  clear: () => void;
  hasCourse: (id: string) => boolean;
  setSelectedSemester: React.Dispatch<React.SetStateAction<string>>;
};

const SelectionContext = createContext<SelectionCtx | undefined>(undefined);

type CatalogCtx = {
  catalog: Course[];
  availableSemesters: string[];
  catalogLoading: boolean;
  loadCsv: (path: string) => Promise<void>;
};

const CatalogContext = createContext<CatalogCtx | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [allCourses, setCourses] = useState<Course[]>([]);
  const [selectedSemester, setSelectedSemester] = useState(() => {
    try {
      return localStorage.getItem(SELECTED_SEMESTER_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const courseIdSet = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < allCourses.length; i++) s.add(allCourses[i].id);
    return s;
  }, [allCourses]);

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

  const [catalog, setCatalog] = useState<Course[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const availableSemesters = useMemo(() => {
    const values = new Set<string>();

    for (const course of catalog) {
      for (const meeting of course.meetings) {
        const semester = meeting.semester?.trim();
        if (semester) values.add(semester);
      }
    }

    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [catalog]);

  useEffect(() => {
    if (availableSemesters.length === 0) {
      return;
    }

    setSelectedSemester((current) => (
      current && availableSemesters.includes(current) ? current : availableSemesters[0]
    ));
  }, [availableSemesters]);

  useEffect(() => {
    try {
      if (selectedSemester) {
        localStorage.setItem(SELECTED_SEMESTER_STORAGE_KEY, selectedSemester);
      } else {
        localStorage.removeItem(SELECTED_SEMESTER_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures and keep state in memory.
    }
  }, [selectedSemester]);

  const courses = useMemo(
    () => filterCoursesBySemester(allCourses, selectedSemester),
    [allCourses, selectedSemester]
  );

  const filteredCatalog = useMemo(
    () => filterCoursesBySemester(catalog, selectedSemester),
    [catalog, selectedSemester]
  );

  const selectionValue = useMemo<SelectionCtx>(
    () => ({ courses, selectedSemester, addCourse, removeCourse, clear, hasCourse, setSelectedSemester }),
    [courses, selectedSemester, addCourse, removeCourse, clear, hasCourse]
  );

  const loadCsv = useCallback(async (path: string) => {
    setCatalogLoading(true);
    try {
      const text = await fetchText(path);

      startTransition(() => {
        const parsed = parseCoursesFromCsvText(text);
        setCatalog(parsed);
      });
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const catalogValue = useMemo<CatalogCtx>(
    () => ({ catalog: filteredCatalog, availableSemesters, catalogLoading, loadCsv }),
    [filteredCatalog, availableSemesters, catalogLoading, loadCsv]
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
