import type { Meeting } from "@/types/schedule";

function parseTime(timeStr: string): number {
  const [time, period] = timeStr.split(/(?=[AP]M)/);
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function doMeetingsConflict(meeting1: Meeting, meeting2: Meeting): boolean {
  const commonDays = meeting1.days.filter(day => meeting2.days.includes(day));
  if (commonDays.length === 0) return false;

  const start1 = parseTime(meeting1.start);
  const end1 = parseTime(meeting1.end);
  const start2 = parseTime(meeting2.start);
  const end2 = parseTime(meeting2.end);

  // Check if the time ranges overlap
  return start1 < end2 && start2 < end1;
}

export function hasScheduleConflict(meetings: Meeting[], candidate: Meeting): boolean {
  return meetings.some(meeting => doMeetingsConflict(meeting, candidate));
}
