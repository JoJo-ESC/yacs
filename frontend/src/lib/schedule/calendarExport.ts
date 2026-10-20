import type { Course, Meeting } from "@/types/schedule";

const dayToRRuleDay: Record<string, string> = {
  M: "MO",
  T: "TU",
  W: "WE",
  R: "TH",
  F: "FR",
  S: "SA",
  U: "SU",
};

const dayToDateDay: Record<string, number> = {
  U: 0,
  M: 1,
  T: 2,
  W: 3,
  R: 4,
  F: 5,
  S: 6,
};

const FALLBACK_TERM_WEEKS = 16;
const CALENDAR_TIMEZONE = "America/New_York";

function parseDate(value?: string) {
  if (!value) return null;
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return new Date(Number(slashMatch[3]), Number(slashMatch[1]) - 1, Number(slashMatch[2]));

  return null;
}

function getFallbackStartDate() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function addWeeks(date: Date, weeks: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + weeks * 7);
  return nextDate;
}

function parseTime(value: string) {
  const match = value.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})(AM|PM)$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (match[3] === "AM" && hours === 12) hours = 0;
  if (match[3] === "PM" && hours !== 12) hours += 12;

  return { hours, minutes };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateTime(date: Date, time: { hours: number; minutes: number }) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(time.hours),
    pad(time.minutes),
    "00",
  ].join("");
}

function formatDateEnd(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T235959Z`;
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldLine(line: string) {
  const chunks: string[] = [];
  let remaining = line;

  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = ` ${remaining.slice(75)}`;
  }

  chunks.push(remaining);
  return chunks.join("\r\n");
}

function getFirstMeetingDate(meeting: Meeting, fallbackStartDate: Date) {
  const startDate = parseDate(meeting.startDate) ?? fallbackStartDate;

  const meetingDays = meeting.days
    .map((day) => dayToDateDay[day])
    .filter((day): day is number => day !== undefined);
  if (meetingDays.length === 0) return null;

  const nextDate = new Date(startDate);
  for (let offset = 0; offset < 7; offset += 1) {
    if (meetingDays.includes(nextDate.getDay())) return nextDate;
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return null;
}

function getMeetingSignature(course: Course, meeting: Meeting) {
  return [
    course.id,
    meeting.type,
    meeting.section,
    meeting.crn,
    meeting.days.join(""),
    meeting.start,
    meeting.end,
    meeting.location,
  ].join("-");
}

export function buildScheduleIcs(courses: Course[]) {
  const now = new Date();
  const fallbackStartDate = getFallbackStartDate();
  const fallbackEndDate = addWeeks(fallbackStartDate, FALLBACK_TERM_WEEKS);
  const timestamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours(),
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//YACS//Schedule Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:YACS Schedule",
    `X-WR-TIMEZONE:${CALENDAR_TIMEZONE}`,
    "BEGIN:VTIMEZONE",
    `TZID:${CALENDAR_TIMEZONE}`,
    `X-LIC-LOCATION:${CALENDAR_TIMEZONE}`,
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0400",
    "TZNAME:EDT",
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0400",
    "TZOFFSETTO:-0500",
    "TZNAME:EST",
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  for (const course of courses) {
    for (const meeting of course.meetings) {
      const firstDate = getFirstMeetingDate(meeting, fallbackStartDate);
      const endDate = parseDate(meeting.endDate) ?? fallbackEndDate;
      const startTime = parseTime(meeting.start);
      const endTime = parseTime(meeting.end);
      const rruleDays = meeting.days.map((day) => dayToRRuleDay[day]).filter(Boolean);

      if (!firstDate || !endDate || !startTime || !endTime || rruleDays.length === 0) continue;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${escapeText(getMeetingSignature(course, meeting))}@yacs`,
        `DTSTAMP:${timestamp}`,
        `SUMMARY:${escapeText(`${course.id} ${course.title}`)}`,
        `DTSTART;TZID=${CALENDAR_TIMEZONE}:${formatDateTime(firstDate, startTime)}`,
        `DTEND;TZID=${CALENDAR_TIMEZONE}:${formatDateTime(firstDate, endTime)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${rruleDays.join(",")};UNTIL=${formatDateEnd(endDate)}`,
        `LOCATION:${escapeText(meeting.location)}`,
        `DESCRIPTION:${escapeText(
          [`${meeting.type} ${meeting.section}`, meeting.crn ? `CRN ${meeting.crn}` : "", meeting.instructor]
            .filter(Boolean)
            .join("\n"),
        )}`,
        "END:VEVENT",
      );
    }
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export function hasExportableMeetings(courses: Course[]) {
  return courses.some((course) =>
    course.meetings.some(
      (meeting) =>
        meeting.days.length > 0 &&
        parseTime(meeting.start) &&
        parseTime(meeting.end),
    ),
  );
}
