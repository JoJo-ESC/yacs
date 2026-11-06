import { doMeetingsConflict, hasScheduleConflict } from "@/lib/schedule/schedule";
import { makeMeeting } from "./scheduleFixtures";

describe("schedule conflict detection", () => {
  test.each([
    ["partial overlap", "09:30AM", "10:20AM", true],
    ["identical times", "09:00AM", "09:50AM", true],
    ["contained meeting", "09:10AM", "09:40AM", true],
    ["containing meeting", "08:00AM", "10:00AM", true],
    ["starts when the first ends", "09:50AM", "10:40AM", false],
    ["ends when the first starts", "08:10AM", "09:00AM", false],
    ["earlier meeting", "07:00AM", "08:00AM", false],
    ["same clock time in the afternoon", "09:00PM", "09:50PM", false],
  ])("%s", (_label, start, end, expected) => {
    const first = makeMeeting();
    const second = makeMeeting({ start, end });
    expect(doMeetingsConflict(first, second)).toBe(expected);
    expect(doMeetingsConflict(second, first)).toBe(expected);
  });

  test("overlapping times on different weekdays are allowed", () => {
    expect(doMeetingsConflict(makeMeeting(), makeMeeting({ days: ["T", "R"] }))).toBe(false);
  });

  test("one shared weekday is enough for a conflict", () => {
    expect(doMeetingsConflict(makeMeeting(), makeMeeting({ days: ["W", "F"] }))).toBe(true);
  });

  test("a meeting without weekdays does not conflict", () => {
    expect(doMeetingsConflict(makeMeeting(), makeMeeting({ days: [] }))).toBe(false);
  });

  test.each([
    ["11:30AM", "12:30PM", "12:00PM", "01:00PM", true],
    ["12:00AM", "01:00AM", "12:30AM", "02:00AM", true],
    ["12:00AM", "01:00AM", "12:00PM", "01:00PM", false],
    ["11:00AM", "12:00PM", "12:00PM", "01:00PM", false],
  ])("handles noon and midnight: %s-%s vs %s-%s", (start, end, otherStart, otherEnd, expected) => {
    expect(doMeetingsConflict(makeMeeting({ start, end }), makeMeeting({ start: otherStart, end: otherEnd }))).toBe(expected);
  });

  test("checks all selected meetings, including conflicts after the first entry", () => {
    const candidate = makeMeeting();
    expect(hasScheduleConflict([], candidate)).toBe(false);
    expect(hasScheduleConflict([makeMeeting({ days: ["T"] })], candidate)).toBe(false);
    expect(hasScheduleConflict([makeMeeting({ days: ["T"] }), makeMeeting()], candidate)).toBe(true);
  });
});
