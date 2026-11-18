import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ScheduleProvider, useSelection, useCatalog } from "@/context/schedule/schedule-context";
import { fetchAllCourses } from "@/api";
import { makeCourse, makeMeeting } from "./scheduleFixtures";

jest.mock("@/api", () => ({ fetchAllCourses: jest.fn() }));
jest.mock("@/lib/analytics", () => ({ track: jest.fn() }));
jest.mock("@/context/semester/semester-context", () => ({
  useSemester: () => ({ selectedSemester: "" }),
}));

const storageKey = "schedule-selected-courses";
const wrapper = ({ children }: { children: React.ReactNode }) => <ScheduleProvider>{children}</ScheduleProvider>;

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});
afterEach(() => localStorage.clear());

test("adds courses and rejects duplicate IDs without replacing the original", () => {
  const { result } = renderHook(useSelection, { wrapper });
  const first = makeCourse();
  const second = makeCourse({ id: "MATH-1010" });
  act(() => {
    result.current.addCourse(first);
    result.current.addCourse({ ...first, title: "Duplicate" });
    result.current.addCourse(second);
  });
  expect(result.current.courses).toEqual([first, second]);
  expect(result.current.hasCourse(first.id)).toBe(true);
  expect(result.current.hasCourse("unknown")).toBe(false);
});

test("removes only the requested course and tolerates an unknown ID", () => {
  const { result } = renderHook(useSelection, { wrapper });
  const retained = makeCourse({ id: "MATH-1010" });
  act(() => result.current.replaceCourses([makeCourse(), retained]));
  act(() => {
    result.current.removeCourse("CSCI-1100");
    result.current.removeCourse("missing");
  });
  expect(result.current.courses).toEqual([retained]);
  expect(result.current.hasCourse("CSCI-1100")).toBe(false);
});

test("updates selected sections without changing unrelated courses or adding unknown courses", () => {
  const { result } = renderHook(useSelection, { wrapper });
  const first = makeCourse();
  const second = makeCourse({ id: "MATH-1010" });
  const updated = { ...first, meetings: [makeMeeting({ section: "02", crn: "67890" })] };
  act(() => result.current.replaceCourses([first, second]));
  act(() => {
    result.current.updateCourse(updated);
    result.current.updateCourse(makeCourse({ id: "unknown" }));
  });
  expect(result.current.courses).toEqual([updated, second]);
});

test("replaces the selection, clears it, and persists the empty schedule", async () => {
  const { result } = renderHook(useSelection, { wrapper });
  act(() => result.current.addCourse(makeCourse()));
  const replacement = makeCourse({ id: "MATH-1010" });
  act(() => result.current.replaceCourses([replacement]));
  expect(result.current.courses).toEqual([replacement]);
  expect(result.current.hasCourse("CSCI-1100")).toBe(false);
  act(() => result.current.clear());
  expect(result.current.courses).toEqual([]);
  expect(result.current.hasCourse(replacement.id)).toBe(false);
  await waitFor(() => expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual([]));
});

test("restores a selected course and its section after remounting", async () => {
  const saved = makeCourse({ meetings: [makeMeeting({ section: "02" })] });
  const first = renderHook(useSelection, { wrapper });
  act(() => first.result.current.addCourse(saved));
  await waitFor(() => expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual([saved]));
  first.unmount();
  const next = renderHook(useSelection, { wrapper });
  expect(next.result.current.courses).toEqual([saved]);
  expect(next.result.current.hasCourse(saved.id)).toBe(true);
});

test.each(["not JSON", "null", "{}", '[{"id":"incomplete"}]'])("starts safely with invalid saved selection: %s", (raw) => {
  localStorage.setItem(storageKey, raw);
  const { result } = renderHook(useSelection, { wrapper });
  expect(result.current.courses).toEqual([]);
});

test("keeps valid saved courses while discarding malformed courses and meetings", () => {
  const valid = makeCourse();
  localStorage.setItem(storageKey, JSON.stringify([
    valid, null, { ...valid, id: 123 }, { ...valid, meetings: [{ days: "M" }] },
    { ...valid, prereqs: [123] }, { ...valid, meetings: [makeMeeting({ startDate: 123 as unknown as string })] },
  ]));
  const { result } = renderHook(useSelection, { wrapper });
  expect(result.current.courses).toEqual([valid]);
});

const mockFetchCourses = fetchAllCourses as jest.MockedFunction<typeof fetchAllCourses>;
const useScheduleState = () => ({ ...useSelection(), ...useCatalog() });

test("catalog refresh repairs missing credits while preserving selected sections and known credits", async () => {
  const selected = makeCourse({ credits: 0, meetings: [makeMeeting({ section: "02" })] });
  const known = makeCourse({ id: "MATH-1010", credits: 3 });
  mockFetchCourses.mockResolvedValue([makeCourse(), { ...known, credits: 4 }]);
  const { result } = renderHook(useScheduleState, { wrapper });
  act(() => result.current.replaceCourses([selected, known]));
  await act(async () => { await result.current.loadCatalog("202609"); });
  expect(mockFetchCourses).toHaveBeenCalledWith("202609");
  expect(result.current.catalogStatus).toBe("loaded");
  expect(result.current.catalogLoading).toBe(false);
  expect(result.current.courses).toEqual([{ ...selected, credits: 4 }, known]);
  await act(async () => { await result.current.loadCatalog("202609"); });
  expect(mockFetchCourses).toHaveBeenCalledTimes(1);
});

test("catalog failures preserve selected courses and allow an explicit retry", async () => {
  mockFetchCourses.mockRejectedValueOnce(new Error("Catalog offline")).mockResolvedValueOnce([]);
  const { result } = renderHook(useScheduleState, { wrapper });
  act(() => result.current.addCourse(makeCourse()));
  await act(async () => {
    await expect(result.current.loadCatalog("202609")).rejects.toThrow("Catalog offline");
  });
  expect(result.current.catalogStatus).toBe("error");
  expect(result.current.catalogError).toBe("Catalog offline");
  expect(result.current.catalogLoading).toBe(false);
  expect(result.current.courses).toEqual([makeCourse()]);
  await act(async () => { await result.current.loadCatalog("202609"); });
  expect(result.current.catalogStatus).toBe("loaded");
  expect(result.current.catalogError).toBeNull();
});

test("a stale semester response cannot overwrite the newer catalog or selected credits", async () => {
  let resolveOld!: (courses: ReturnType<typeof makeCourse>[]) => void;
  mockFetchCourses.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
  const newer = makeCourse({ credits: 3 });
  mockFetchCourses.mockResolvedValueOnce([newer]);
  const { result } = renderHook(useScheduleState, { wrapper });
  act(() => result.current.addCourse(makeCourse({ credits: 0 })));
  let oldRequest!: Promise<void>;
  act(() => { oldRequest = result.current.loadCatalog("202609"); });
  expect(result.current.catalogLoading).toBe(true);
  await act(async () => { await result.current.loadCatalog("202701"); });
  await act(async () => { resolveOld([makeCourse({ credits: 9 })]); await oldRequest; });
  expect(result.current.catalog).toEqual([newer]);
  expect(result.current.courses[0].credits).toBe(3);
  expect(result.current.catalogStatus).toBe("loaded");
});
