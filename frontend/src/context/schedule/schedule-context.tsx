import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useRef,
  startTransition,
} from "react";
import type { Course } from "@/types/schedule";
import { fetchAllCourses } from "@/api";

type CatalogStatus = "idle" | "loading" | "loaded" | "error";

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
  catalogStatus: CatalogStatus;
  catalogLoading: boolean;
  catalogError: string | null;
  loadCatalog: (semester?: string) => Promise<void>;
};

const CatalogContext = createContext<CatalogCtx | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
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
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("idle");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const catalogPromiseRef = useRef<Promise<void> | null>(null);
  const catalogSemesterRef = useRef<string | undefined>(undefined);

  const loadCatalog = useCallback(async (semester?: string) => {
    if (catalogStatus === "loaded" && catalogSemesterRef.current === semester) {
      return;
    }

    if (catalogStatus === "loading" && catalogSemesterRef.current === semester && catalogPromiseRef.current) {
      return catalogPromiseRef.current;
    }

    catalogSemesterRef.current = semester;
    setCatalogStatus("loading");
    setCatalogLoading(true);
    setCatalogError(null);

    const request = (async () => {
      try {
        const nextCatalog = await fetchAllCourses(semester);
        startTransition(() => setCatalog(nextCatalog));
        setCatalogStatus("loaded");
      } catch (err) {
        setCatalogStatus("error");
        setCatalogError(err instanceof Error ? err.message : "Failed to load catalog");
        throw err;
      } finally {
        setCatalogLoading(false);
        catalogPromiseRef.current = null;
      }
    })();

    catalogPromiseRef.current = request;
    return request;
  }, [catalogStatus]);

  const catalogValue = useMemo<CatalogCtx>(
    () => ({ catalog, catalogStatus, catalogLoading, catalogError, loadCatalog }),
    [catalog, catalogStatus, catalogLoading, catalogError, loadCatalog]
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
