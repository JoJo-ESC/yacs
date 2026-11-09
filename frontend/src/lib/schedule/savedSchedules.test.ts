import type { Course } from "@/types/schedule";
import {
  EMPTY_SEMESTER,
  LEGACY_SELECTION_STORAGE_KEY,
  SCHEDULES_STORAGE_KEY,
  addSchedule,
  deleteSchedule,
  getActiveSchedule,
  getSemester,
  loadScheduleStore,
  nextScheduleName,
  parseScheduleStore,
  renameSchedule,
  selectSchedule,
  updateActiveCourses,
  updateSemester,
  type SemesterSchedules,
} from "./savedSchedules";

function course(id: string): Course {
  return {
    id,
    title: id,
    credits: 4,
    level: "1000",
    department: id.split("-")[0],
    school: "",
    description: "",
    offerFrequency: "",
    prereqs: [],
    coreqs: [],
    maxEnroll: 30,
    enrolled: 0,
    meetings: [],
  };
}

function semester(...schedules: [string, string[]][]): SemesterSchedules {
  return {
    activeId: schedules[0][0],
    schedules: schedules.map(([id, ids]) => ({ id, name: id, courses: ids.map(course) })),
  };
}

beforeEach(() => localStorage.clear());

describe("loadScheduleStore", () => {
  test("loads saved schedules", () => {
    const store = { "202609": semester(["a", ["CSCI-1100"]]) };
    localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(store));
    expect(loadScheduleStore(localStorage, "202701")).toEqual(store);
  });

  test("moves an old single-list schedule into the current semester", () => {
    localStorage.setItem(LEGACY_SELECTION_STORAGE_KEY, JSON.stringify([course("CSCI-1200")]));
    const store = loadScheduleStore(localStorage, "202701");
    expect(Object.keys(store)).toEqual(["202701"]);
    expect(getActiveSchedule(store["202701"]).courses.map((c) => c.id)).toEqual(["CSCI-1200"]);
  });

  test("ignores the old format once the new one is saved", () => {
    localStorage.setItem(SCHEDULES_STORAGE_KEY, "{}");
    localStorage.setItem(LEGACY_SELECTION_STORAGE_KEY, JSON.stringify([course("CSCI-1200")]));
    expect(loadScheduleStore(localStorage, "202701")).toEqual({});
  });

  test("starts empty when storage is corrupt", () => {
    localStorage.setItem(SCHEDULES_STORAGE_KEY, "{not json");
    expect(loadScheduleStore(localStorage, "202701")).toEqual({});
  });
});

describe("parseScheduleStore", () => {
  test("drops malformed schedules and courses, and fixes a missing active id", () => {
    const parsed = parseScheduleStore({
      "202609": {
        activeId: "gone",
        schedules: [{ id: "a", name: "A", courses: [course("CSCI-1100"), { id: 5 }] }, { name: "no id" }],
      },
      "202701": { schedules: [] },
    });
    expect(Object.keys(parsed)).toEqual(["202609"]);
    expect(parsed["202609"].activeId).toBe("a");
    expect(parsed["202609"].schedules).toHaveLength(1);
    expect(parsed["202609"].schedules[0].courses).toHaveLength(1);
  });
});

describe("semester updates", () => {
  test("an untouched semester reads as one empty schedule and isn't stored", () => {
    expect(getSemester({}, "202609")).toBe(EMPTY_SEMESTER);
    const store = {};
    expect(updateSemester(store, "202609", (s) => s)).toBe(store);
  });

  test("courses are kept separately per semester", () => {
    let store = updateSemester({}, "202609", (s) => updateActiveCourses(s, () => [course("CSCI-1100")]));
    store = updateSemester(store, "202701", (s) => updateActiveCourses(s, () => [course("MATH-1010")]));
    expect(getActiveSchedule(getSemester(store, "202609")).courses.map((c) => c.id)).toEqual(["CSCI-1100"]);
    expect(getActiveSchedule(getSemester(store, "202701")).courses.map((c) => c.id)).toEqual(["MATH-1010"]);
  });

  test("course changes only affect the active schedule", () => {
    const sem = selectSchedule(semester(["a", ["CSCI-1100"]], ["b", []]), "b");
    const next = updateActiveCourses(sem, (courses) => [...courses, course("MATH-1010")]);
    expect(next.schedules[0].courses.map((c) => c.id)).toEqual(["CSCI-1100"]);
    expect(next.schedules[1].courses.map((c) => c.id)).toEqual(["MATH-1010"]);
  });
});

describe("managing schedules", () => {
  test("a new schedule is empty and becomes active", () => {
    const next = addSchedule(semester(["a", ["CSCI-1100"]]), "b", "Schedule 2");
    expect(next.activeId).toBe("b");
    expect(getActiveSchedule(next).courses).toEqual([]);
  });

  test("default names skip ones already taken", () => {
    const sem = semester(["a", []]);
    sem.schedules[0].name = "Schedule 2";
    expect(nextScheduleName(sem.schedules)).toBe("Schedule 3");
  });

  test("rename trims, and ignores empty names", () => {
    const sem = semester(["a", []]);
    expect(renameSchedule(sem, "a", "  Plan B ").schedules[0].name).toBe("Plan B");
    expect(renameSchedule(sem, "a", "   ")).toBe(sem);
  });

  test("deleting the active schedule activates its neighbor", () => {
    const sem = selectSchedule(semester(["a", []], ["b", []], ["c", []]), "c");
    const next = deleteSchedule(sem, "c");
    expect(next.schedules.map((s) => s.id)).toEqual(["a", "b"]);
    expect(next.activeId).toBe("b");
  });

  test("the last schedule can't be deleted", () => {
    const sem = semester(["a", []]);
    expect(deleteSchedule(sem, "a")).toBe(sem);
  });
});
