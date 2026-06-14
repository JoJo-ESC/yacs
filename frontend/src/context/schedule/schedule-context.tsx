import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useRef,
  startTransition,
  useEffect,
} from "react";
import type { Course } from "@/types/schedule";
import { fetchAllCourses } from "@/api";

type CatalogStatus = "idle" | "loading" | "loaded" | "error";

type SelectionCtx = {
  courses: Course[];
  addCourse: (c: Course) => void;
  removeCourse: (id: string) => void;
  updateCourse: (course: Course) => void;
  replaceCourses: (courses: Course[]) => void;
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
const SELECTION_STORAGE_KEY = "schedule-selected-courses";

function isMeeting(value: unknown): value is Course["meetings"][number] {
  if (!value || typeof value !== "object") return false;
  const meeting = value as Record<string, unknown>;
  return (
    typeof meeting.type === "string" &&
    Array.isArray(meeting.days) &&
    meeting.days.every((day) => typeof day === "string") &&
    typeof meeting.start === "string" &&
    typeof meeting.end === "string" &&
    typeof meeting.location === "string" &&
    typeof meeting.instructor === "string" &&
    typeof meeting.section === "string" &&
    (meeting.startDate === undefined || typeof meeting.startDate === "string") &&
    (meeting.endDate === undefined || typeof meeting.endDate === "string") &&
    typeof meeting.seatsAvailable === "number" &&
    typeof meeting.enrolled === "number" &&
    typeof meeting.maxEnroll === "number" &&
    typeof meeting.crn === "string"
  );
}

function isCourse(value: unknown): value is Course {
  if (!value || typeof value !== "object") return false;
  const course = value as Record<string, unknown>;
  return (
    typeof course.id === "string" &&
    typeof course.title === "string" &&
    typeof course.credits === "number" &&
    typeof course.level === "string" &&
    typeof course.department === "string" &&
    typeof course.school === "string" &&
    typeof course.description === "string" &&
    typeof course.offerFrequency === "string" &&
    Array.isArray(course.prereqs) &&
    course.prereqs.every((item) => typeof item === "string") &&
    Array.isArray(course.coreqs) &&
    course.coreqs.every((item) => typeof item === "string") &&
    typeof course.maxEnroll === "number" &&
    typeof course.enrolled === "number" &&
    Array.isArray(course.meetings) &&
    course.meetings.every(isMeeting)
  );
}

function loadInitialCourses(): Course[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(SELECTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCourse) : [];
  } catch {
    return [];
  }
}

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>(() => loadInitialCourses());
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

  const updateCourse = useCallback((course: Course) => {
    setCourses((prev) => prev.map((existing) => (existing.id === course.id ? course : existing)));
  }, []);

  const replaceCourses = useCallback((nextCourses: Course[]) => {
    setCourses(nextCourses);
  }, []);

  const clear = useCallback(() => setCourses([]), []);

  const hasCourse = useCallback((id: string) => courseIdSet.has(id), [courseIdSet]);

  useEffect(() => {
    localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  const selectionValue = useMemo<SelectionCtx>(
    () => ({ courses, addCourse, removeCourse, updateCourse, replaceCourses, clear, hasCourse }),
    [courses, addCourse, removeCourse, updateCourse, replaceCourses, clear, hasCourse]
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
        const catalogMap = new Map(nextCatalog.map((c) => [c.id, c]));
        startTransition(() => {
          setCatalog(nextCatalog);
          setCourses((prev) =>
            prev.map((c) => {
              const fresh = catalogMap.get(c.id);
              return fresh && c.credits === 0 && fresh.credits > 0
                ? { ...c, credits: fresh.credits }
                : c;
            })
          );
        });
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
