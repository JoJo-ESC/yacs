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
import { useSemester } from "@/context/semester/semester-context";
import { useScheduleSync } from "@/context/schedule/useScheduleSync";
import { track } from "@/lib/analytics";
import {
  LEGACY_SELECTION_STORAGE_KEY,
  SCHEDULES_STORAGE_KEY,
  addSchedule,
  deleteSchedule,
  getActiveSchedule,
  getSemester,
  loadScheduleStore,
  newScheduleId,
  nextScheduleName,
  renameSchedule as renameInSemester,
  selectSchedule as selectInSemester,
  updateActiveCourses,
  updateAllCourses,
  updateSemester,
  type SavedSchedule,
  type ScheduleStore,
  type SemesterSchedules,
} from "@/lib/schedule/savedSchedules";

type CatalogStatus = "idle" | "loading" | "loaded" | "error";

// Courses and actions act on the active schedule of the selected semester.
type SelectionCtx = {
  courses: Course[];
  addCourse: (c: Course) => void;
  removeCourse: (id: string) => void;
  updateCourse: (course: Course) => void;
  replaceCourses: (courses: Course[]) => void;
  clear: () => void;
  hasCourse: (id: string) => boolean;
  // The selected semester's saved schedules
  schedules: SavedSchedule[];
  activeScheduleId: string;
  selectSchedule: (id: string) => void;
  createSchedule: () => SavedSchedule;
  renameSchedule: (id: string, name: string) => void;
  deleteSchedule: (id: string) => void;
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
  const { selectedSemester } = useSemester();
  const [store, setStore] = useState<ScheduleStore>(() => loadScheduleStore(localStorage, selectedSemester));
  useScheduleSync(store, setStore);
  const semesterSchedules = getSemester(store, selectedSemester);
  const courses = getActiveSchedule(semesterSchedules).courses;

  const courseIdSet = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < courses.length; i++) s.add(courses[i].id);
    return s;
  }, [courses]);

  const updateSelectedSemester = useCallback(
    (update: (semester: SemesterSchedules) => SemesterSchedules) => {
      if (!selectedSemester) return;
      setStore((prev) => updateSemester(prev, selectedSemester, update));
    },
    [selectedSemester],
  );

  const setCourses = useCallback(
    (update: (prev: Course[]) => Course[]) => {
      updateSelectedSemester((sem) => updateActiveCourses(sem, update));
    },
    [updateSelectedSemester],
  );

  const addCourse = useCallback((c: Course) => {
    track("course_added", { course: c.id, department: c.department });
    setCourses((prev) => {
      for (let i = 0; i < prev.length; i++) if (prev[i].id === c.id) return prev;
      return [...prev, c];
    });
  }, [setCourses]);

  const removeCourse = useCallback((id: string) => {
    track("course_removed", { course: id });
    setCourses((prev) => prev.filter((x) => x.id !== id));
  }, [setCourses]);

  const updateCourse = useCallback((course: Course) => {
    setCourses((prev) => prev.map((existing) => (existing.id === course.id ? course : existing)));
  }, [setCourses]);

  const replaceCourses = useCallback((nextCourses: Course[]) => {
    setCourses(() => nextCourses);
  }, [setCourses]);

  const clear = useCallback(() => setCourses(() => []), [setCourses]);

  const hasCourse = useCallback((id: string) => courseIdSet.has(id), [courseIdSet]);

  const selectSchedule = useCallback((id: string) => {
    track("schedule_switched");
    updateSelectedSemester((sem) => selectInSemester(sem, id));
  }, [updateSelectedSemester]);

  // Returns the new schedule (already active) so the caller can rename it.
  const createSchedule = useCallback(() => {
    const schedule: SavedSchedule = { id: newScheduleId(), name: nextScheduleName(semesterSchedules.schedules), courses: [] };
    track("schedule_created", { count: semesterSchedules.schedules.length + 1 });
    updateSelectedSemester((sem) => addSchedule(sem, schedule.id, schedule.name));
    return schedule;
  }, [semesterSchedules.schedules, updateSelectedSemester]);

  const renameSchedule = useCallback((id: string, name: string) => {
    updateSelectedSemester((sem) => renameInSemester(sem, id, name));
  }, [updateSelectedSemester]);

  const removeSchedule = useCallback((id: string) => {
    track("schedule_deleted");
    updateSelectedSemester((sem) => deleteSchedule(sem, id));
  }, [updateSelectedSemester]);

  useEffect(() => {
    try {
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(store));
      // Moved into the new format by loadScheduleStore; safe to drop once saved
      localStorage.removeItem(LEGACY_SELECTION_STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode, quota): schedules last for this visit only
    }
  }, [store]);

  const selectionValue = useMemo<SelectionCtx>(
    () => ({
      courses,
      addCourse,
      removeCourse,
      updateCourse,
      replaceCourses,
      clear,
      hasCourse,
      schedules: semesterSchedules.schedules,
      activeScheduleId: semesterSchedules.activeId,
      selectSchedule,
      createSchedule,
      renameSchedule,
      deleteSchedule: removeSchedule,
    }),
    [
      courses, addCourse, removeCourse, updateCourse, replaceCourses, clear, hasCourse,
      semesterSchedules, selectSchedule, createSchedule, renameSchedule, removeSchedule,
    ]
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

    // A request for a semester that's no longer selected (the user switched,
    // or the startup guess was corrected) must not overwrite the newer one.
    const isCurrent = () => catalogSemesterRef.current === semester;

    const request = (async () => {
      try {
        const nextCatalog = await fetchAllCourses(semester);
        if (!isCurrent()) return;
        const catalogMap = new Map(nextCatalog.map((c) => [c.id, c]));
        startTransition(() => {
          setCatalog(nextCatalog);
          if (semester) {
            setStore((prev) =>
              updateSemester(prev, semester, (sem) =>
                updateAllCourses(sem, (c) => {
                  const fresh = catalogMap.get(c.id);
                  return fresh && c.credits === 0 && fresh.credits > 0
                    ? { ...c, credits: fresh.credits }
                    : c;
                })
              )
            );
          }
        });
        setCatalogStatus("loaded");
      } catch (err) {
        if (!isCurrent()) return;
        setCatalogStatus("error");
        setCatalogError(err instanceof Error ? err.message : "Failed to load catalog");
        throw err;
      } finally {
        if (isCurrent()) {
          setCatalogLoading(false);
          catalogPromiseRef.current = null;
        }
      }
    })();

    catalogPromiseRef.current = request;
    return request;
  }, [catalogStatus]);

  // Load the catalog in the background as soon as a semester is known (at
  // startup that's the guessed newest one), and reload when it changes. Never
  // load without one: that fetches every term on record (~93K sections).
  // Keyed on the semester only (via a ref to the loader), so a failed load
  // isn't retried in a loop; ClassSearch retries when the user opens it.
  const loadCatalogRef = useRef(loadCatalog);
  loadCatalogRef.current = loadCatalog;
  useEffect(() => {
    if (selectedSemester) {
      loadCatalogRef.current(selectedSemester).catch(() => {
        // Already recorded in catalogStatus/catalogError for the UI.
      });
    }
  }, [selectedSemester]);

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
