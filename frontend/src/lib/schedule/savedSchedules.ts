import type { Course } from "@/types/schedule";

// Each semester has one or more named schedules, one of which is active.
// Stored in localStorage as { [term]: SemesterSchedules }.
export type SavedSchedule = {
  id: string;
  name: string;
  courses: Course[];
};

export type SemesterSchedules = {
  activeId: string;
  schedules: SavedSchedule[];
};

export type ScheduleStore = Record<string, SemesterSchedules>;

export const SCHEDULES_STORAGE_KEY = "yacs:schedules";
// Before schedules were per semester: a single course list shared by all.
export const LEGACY_SELECTION_STORAGE_KEY = "schedule-selected-courses";

export const MAX_SCHEDULE_NAME_LENGTH = 40;

// A semester nobody has added to yet. Shared and never mutated, so reading an
// untouched semester returns stable references and nothing is stored for it.
export const EMPTY_SEMESTER: SemesterSchedules = {
  activeId: "schedule-1",
  schedules: [{ id: "schedule-1", name: "Schedule 1", courses: [] }],
};

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

export function isCourse(value: unknown): value is Course {
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

function parseCourses(value: unknown): Course[] {
  return Array.isArray(value) ? value.filter(isCourse) : [];
}

function parseSemester(value: unknown): SemesterSchedules | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.schedules)) return null;

  const schedules: SavedSchedule[] = [];
  for (const item of raw.schedules) {
    if (!item || typeof item !== "object") continue;
    const schedule = item as Record<string, unknown>;
    if (typeof schedule.id !== "string" || typeof schedule.name !== "string") continue;
    schedules.push({ id: schedule.id, name: schedule.name, courses: parseCourses(schedule.courses) });
  }
  if (schedules.length === 0) return null;

  const activeId = schedules.some((s) => s.id === raw.activeId) ? (raw.activeId as string) : schedules[0].id;
  return { activeId, schedules };
}

export function parseScheduleStore(value: unknown): ScheduleStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const store: ScheduleStore = {};
  for (const [term, semester] of Object.entries(value)) {
    const parsed = parseSemester(semester);
    if (parsed) store[term] = parsed;
  }
  return store;
}

function readJson(storage: Storage, key: string): unknown {
  const raw = storage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

// Loads saved schedules. The first time, a schedule saved by the old
// single-list format is moved into `currentTerm`, the semester selected at
// startup: the old format didn't record which semester it was for.
export function loadScheduleStore(storage: Storage, currentTerm: string | undefined): ScheduleStore {
  try {
    const saved = readJson(storage, SCHEDULES_STORAGE_KEY);
    if (saved !== null) return parseScheduleStore(saved);

    const legacyCourses = parseCourses(readJson(storage, LEGACY_SELECTION_STORAGE_KEY));
    if (!currentTerm || legacyCourses.length === 0) return {};
    return {
      [currentTerm]: {
        ...EMPTY_SEMESTER,
        schedules: [{ ...EMPTY_SEMESTER.schedules[0], courses: legacyCourses }],
      },
    };
  } catch {
    // Storage unavailable or corrupt: start empty
    return {};
  }
}

export function getSemester(store: ScheduleStore, term: string | undefined): SemesterSchedules {
  return (term && store[term]) || EMPTY_SEMESTER;
}

export function getActiveSchedule(semester: SemesterSchedules): SavedSchedule {
  return semester.schedules.find((s) => s.id === semester.activeId) ?? semester.schedules[0];
}

// Applies `update` to one semester. Returns the same store if nothing
// changed, so no-op updates don't re-render or rewrite storage.
export function updateSemester(
  store: ScheduleStore,
  term: string,
  update: (semester: SemesterSchedules) => SemesterSchedules,
): ScheduleStore {
  const current = getSemester(store, term);
  const next = update(current);
  return next === current ? store : { ...store, [term]: next };
}

export function updateActiveCourses(
  semester: SemesterSchedules,
  update: (courses: Course[]) => Course[],
): SemesterSchedules {
  const active = getActiveSchedule(semester);
  const courses = update(active.courses);
  if (courses === active.courses) return semester;
  return {
    ...semester,
    schedules: semester.schedules.map((s) => (s.id === active.id ? { ...s, courses } : s)),
  };
}

// Applies `update` to every course in every schedule of the semester,
// keeping unchanged schedules (and the semester itself) as-is.
export function updateAllCourses(
  semester: SemesterSchedules,
  update: (course: Course) => Course,
): SemesterSchedules {
  let changed = false;
  const schedules = semester.schedules.map((schedule) => {
    const courses = schedule.courses.map(update);
    if (courses.every((course, i) => course === schedule.courses[i])) return schedule;
    changed = true;
    return { ...schedule, courses };
  });
  return changed ? { ...semester, schedules } : semester;
}

export function nextScheduleName(schedules: SavedSchedule[]): string {
  const names = new Set(schedules.map((s) => s.name));
  let n = schedules.length + 1;
  while (names.has(`Schedule ${n}`)) n++;
  return `Schedule ${n}`;
}

export function newScheduleId(): string {
  return `schedule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addSchedule(semester: SemesterSchedules, id: string, name: string): SemesterSchedules {
  return { activeId: id, schedules: [...semester.schedules, { id, name, courses: [] }] };
}

export function selectSchedule(semester: SemesterSchedules, id: string): SemesterSchedules {
  if (semester.activeId === id || !semester.schedules.some((s) => s.id === id)) return semester;
  return { ...semester, activeId: id };
}

export function renameSchedule(semester: SemesterSchedules, id: string, name: string): SemesterSchedules {
  const trimmed = name.trim().slice(0, MAX_SCHEDULE_NAME_LENGTH);
  const target = semester.schedules.find((s) => s.id === id);
  if (!trimmed || !target || target.name === trimmed) return semester;
  return {
    ...semester,
    schedules: semester.schedules.map((s) => (s.id === id ? { ...s, name: trimmed } : s)),
  };
}

// Every semester keeps at least one schedule, so deleting the last is a
// no-op. Deleting the active one activates its neighbor.
export function deleteSchedule(semester: SemesterSchedules, id: string): SemesterSchedules {
  const index = semester.schedules.findIndex((s) => s.id === id);
  if (index === -1 || semester.schedules.length === 1) return semester;
  const schedules = semester.schedules.filter((s) => s.id !== id);
  const activeId =
    semester.activeId === id ? schedules[Math.min(index, schedules.length - 1)].id : semester.activeId;
  return { activeId, schedules };
}

function scheduleSignature(schedule: SavedSchedule): string {
  return schedule.courses
    .map((c) => `${c.id}:${c.meetings.map((m) => m.crn).join(",")}`)
    .sort()
    .join("|");
}

// Combines an account's schedules with ones made on this device before
// logging in, so neither is lost: the account's are kept as-is, and each
// non-empty local schedule the account doesn't already have (same courses
// and sections) is added after them, renamed if its name is taken.
export function mergeScheduleStores(account: ScheduleStore, local: ScheduleStore): ScheduleStore {
  const merged: ScheduleStore = { ...account };

  for (const [term, localSemester] of Object.entries(local)) {
    const accountSemester = merged[term];
    const existing = new Set((accountSemester?.schedules ?? []).map(scheduleSignature));
    const extra = localSemester.schedules.filter(
      (s) => s.courses.length > 0 && !existing.has(scheduleSignature(s)),
    );
    if (extra.length === 0) continue;

    if (!accountSemester) {
      const activeId = extra.some((s) => s.id === localSemester.activeId) ? localSemester.activeId : extra[0].id;
      merged[term] = { activeId, schedules: extra };
      continue;
    }

    const ids = new Set(accountSemester.schedules.map((s) => s.id));
    const names = new Set(accountSemester.schedules.map((s) => s.name));
    const added = extra.map((s) => ({
      ...s,
      id: ids.has(s.id) ? newScheduleId() : s.id,
      name: names.has(s.name) ? `${s.name} (this device)`.slice(0, MAX_SCHEDULE_NAME_LENGTH) : s.name,
    }));
    merged[term] = { ...accountSemester, schedules: [...accountSemester.schedules, ...added] };
  }

  return merged;
}
