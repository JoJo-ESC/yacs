import type { Course, Meeting } from "../types/schedule";

const DAY_TO_ICS: Record<string, string> = {
  M: "MO",
  T: "TU",
  W: "WE",
  R: "TH",
  F: "FR",
  S: "SA",
  U: "SU",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function parseTime(time: string) {
  const [rawClock, period] = time.trim().split(/(?=[AP]M)/);
  let [hours, minutes] = rawClock.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

function formatLocalDateTime(date: Date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    "00",
  ].join("");
}

function formatUtcTimestamp(date: Date) {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    "Z",
  ].join("");
}

function parseDate(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getFirstOccurrence(startDate: Date, meeting: Meeting) {
  const days = meeting.days
    .map((day) => ({ raw: day, value: DAY_TO_ICS[day] }))
    .filter((entry): entry is { raw: string; value: string } => Boolean(entry.value));

  if (days.length === 0) return null;

  let best: Date | null = null;
  for (const day of days) {
    const candidate = new Date(startDate);
    const targetDay = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"].indexOf(day.value);
    const delta = (targetDay - candidate.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + delta);
    if (!best || candidate < best) best = candidate;
  }

  if (!best) return null;

  const { hours: startHours, minutes: startMinutes } = parseTime(meeting.start);
  best.setHours(startHours, startMinutes, 0, 0);
  return best;
}

function getEndDateTime(startDateTime: Date, meeting: Meeting) {
  const end = new Date(startDateTime);
  const { hours, minutes } = parseTime(meeting.end);
  end.setHours(hours, minutes, 0, 0);
  if (end <= startDateTime) {
    end.setDate(end.getDate() + 1);
  }
  return end;
}

function getUntilValue(meeting: Meeting, fallbackDate: Date) {
  const endDate = parseDate(meeting.endDate) ?? fallbackDate;
  const until = new Date(endDate);
  until.setHours(23, 59, 0, 0);
  return formatLocalDateTime(until);
}

function buildEvent(course: Course, meeting: Meeting, stamp: string) {
  const startDate = parseDate(meeting.startDate) ?? new Date();
  const startDateTime = getFirstOccurrence(startDate, meeting);
  if (!startDateTime) return null;

  const endDateTime = getEndDateTime(startDateTime, meeting);
  const byDay = meeting.days.map((day) => DAY_TO_ICS[day]).filter(Boolean).join(",");
  const fallbackEnd = new Date(startDateTime);
  fallbackEnd.setDate(fallbackEnd.getDate() + 7);

  return [
    "BEGIN:VEVENT",
    `UID:${course.id}-${meeting.type}-${meeting.section}-${formatLocalDateTime(startDateTime)}@yacs`,
    `DTSTAMP:${stamp}`,
    `SUMMARY:${escapeIcsText(`${course.id} ${course.title}`)}`,
    `DESCRIPTION:${escapeIcsText(`${meeting.type} ${meeting.section}${meeting.instructor ? ` with ${meeting.instructor}` : ""}`)}`,
    `LOCATION:${escapeIcsText(meeting.location || "TBA")}`,
    `DTSTART:${formatLocalDateTime(startDateTime)}`,
    `DTEND:${formatLocalDateTime(endDateTime)}`,
    byDay
      ? `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${getUntilValue(meeting, fallbackEnd)}`
      : "",
    "END:VEVENT",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function buildScheduleIcs(courses: Course[]) {
  const stamp = formatUtcTimestamp(new Date());
  const events = courses.flatMap((course) =>
    course.meetings
      .map((meeting) => buildEvent(course, meeting, stamp))
      .filter((event): event is string => Boolean(event))
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//YACS//Schedule Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMeetingDays(days: string[]) {
  const labels: Record<string, string> = {
    M: "Mon",
    T: "Tue",
    W: "Wed",
    R: "Thu",
    F: "Fri",
    S: "Sat",
    U: "Sun",
  };

  return days.map((day) => labels[day] ?? day).join(", ");
}

export function downloadScheduleIcs(courses: Course[]) {
  const ics = buildScheduleIcs(courses);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const firstSemester = courses.flatMap((course) => course.meetings.map((meeting) => meeting.semester)).find(Boolean);
  const filename = firstSemester ? `yacs-schedule-${slugify(firstSemester)}.ics` : "yacs-schedule.ics";

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function buildSchedulePrintHtml(courses: Course[]) {
  const semester = courses.flatMap((course) => course.meetings.map((meeting) => meeting.semester)).find(Boolean);
  const rows = courses.flatMap((course) =>
    course.meetings.map((meeting) => `
      <tr>
        <td>${escapeHtml(course.id)}</td>
        <td>${escapeHtml(course.title)}</td>
        <td>${escapeHtml(`${meeting.type} ${meeting.section}`)}</td>
        <td>${escapeHtml(formatMeetingDays(meeting.days))}</td>
        <td>${escapeHtml(`${meeting.start} - ${meeting.end}`)}</td>
        <td>${escapeHtml(meeting.location || "TBA")}</td>
        <td>${escapeHtml(meeting.instructor || "TBA")}</td>
      </tr>
    `)
  );

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>YACS Schedule Export</title>
        <style>
          body {
            font-family: Georgia, "Times New Roman", serif;
            margin: 32px;
            color: #111827;
            background: #ffffff;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 28px;
          }
          p {
            margin: 0 0 20px;
            color: #4b5563;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 10px 12px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #e5ecf6;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          .meta {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            font-size: 14px;
          }
          @media print {
            body {
              margin: 18px;
            }
          }
        </style>
      </head>
      <body>
        <h1>YACS Schedule Export</h1>
        <div class="meta">
          <p>${escapeHtml(semester || "Selected courses")}</p>
          <p>${escapeHtml(`${courses.length} ${courses.length === 1 ? "course" : "courses"}`)}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Title</th>
              <th>Section</th>
              <th>Days</th>
              <th>Time</th>
              <th>Location</th>
              <th>Instructor</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

export function printSchedulePdf(courses: Course[]) {
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return;

  popup.document.open();
  popup.document.write(buildSchedulePrintHtml(courses));
  popup.document.close();
  popup.focus();
  popup.print();
}

function getScheduleImageHeight(rowCount: number) {
  return 220 + rowCount * 52;
}

export function buildScheduleImageSvg(courses: Course[]) {
  const semester = courses.flatMap((course) => course.meetings.map((meeting) => meeting.semester)).find(Boolean);
  const rows = courses.flatMap((course) =>
    course.meetings.map((meeting) => ({
      course: course.id,
      title: course.title,
      section: `${meeting.type} ${meeting.section}`,
      days: formatMeetingDays(meeting.days),
      time: `${meeting.start} - ${meeting.end}`,
      location: meeting.location || "TBA",
    }))
  );

  const width = 1200;
  const height = getScheduleImageHeight(rows.length);

  const rowMarkup = rows
    .map((row, index) => {
      const y = 190 + index * 52;
      const fill = index % 2 === 0 ? "#f8fafc" : "#eef4fb";

      return `
        <rect x="48" y="${y}" width="1104" height="44" rx="12" fill="${fill}" />
        <text x="72" y="${y + 28}" font-size="18" font-weight="700" fill="#0f172a">${escapeHtml(row.course)}</text>
        <text x="250" y="${y + 28}" font-size="16" fill="#334155">${escapeHtml(row.title)}</text>
        <text x="630" y="${y + 28}" font-size="16" fill="#334155">${escapeHtml(row.section)}</text>
        <text x="760" y="${y + 28}" font-size="16" fill="#334155">${escapeHtml(row.days)}</text>
        <text x="900" y="${y + 28}" font-size="16" fill="#334155">${escapeHtml(row.time)}</text>
        <text x="1035" y="${y + 28}" font-size="16" fill="#334155">${escapeHtml(row.location)}</text>
      `;
    })
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#ffffff" />
      <rect x="32" y="32" width="1136" height="${height - 64}" rx="28" fill="#f3f6fb" />
      <text x="64" y="88" font-size="34" font-weight="700" fill="#111827">YACS Schedule Export</text>
      <text x="64" y="124" font-size="18" fill="#475569">${escapeHtml(semester || "Selected courses")}</text>
      <text x="64" y="152" font-size="18" fill="#475569">${escapeHtml(`${courses.length} ${courses.length === 1 ? "course" : "courses"}`)}</text>

      <rect x="48" y="176" width="1104" height="2" fill="#cbd5e1" />
      <text x="72" y="170" font-size="13" font-weight="700" letter-spacing="1.5" fill="#64748b">COURSE</text>
      <text x="250" y="170" font-size="13" font-weight="700" letter-spacing="1.5" fill="#64748b">TITLE</text>
      <text x="630" y="170" font-size="13" font-weight="700" letter-spacing="1.5" fill="#64748b">SECTION</text>
      <text x="760" y="170" font-size="13" font-weight="700" letter-spacing="1.5" fill="#64748b">DAYS</text>
      <text x="900" y="170" font-size="13" font-weight="700" letter-spacing="1.5" fill="#64748b">TIME</text>
      <text x="1035" y="170" font-size="13" font-weight="700" letter-spacing="1.5" fill="#64748b">LOCATION</text>

      ${rowMarkup}
    </svg>
  `;
}

export async function downloadSchedulePng(courses: Course[]) {
  const svg = buildScheduleImageSvg(courses);
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = window.URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not render the schedule image."));
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not create an image export context.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    const pngUrl = canvas.toDataURL("image/png");
    const semester = courses.flatMap((course) => course.meetings.map((meeting) => meeting.semester)).find(Boolean);
    const filename = semester ? `yacs-schedule-${slugify(semester)}.png` : "yacs-schedule.png";

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    window.URL.revokeObjectURL(svgUrl);
  }
}

export function buildScheduleText(courses: Course[]) {
  const semester = courses.flatMap((course) => course.meetings.map((meeting) => meeting.semester)).find(Boolean);
  const lines = [
    "YACS Schedule Export",
    semester || "Selected courses",
    `${courses.length} ${courses.length === 1 ? "course" : "courses"}`,
    "",
  ];

  for (const course of courses) {
    lines.push(`${course.id} - ${course.title}`);
    for (const meeting of course.meetings) {
      lines.push(
        `  ${meeting.type} ${meeting.section} | ${formatMeetingDays(meeting.days)} | ${meeting.start} - ${meeting.end} | ${meeting.location || "TBA"} | ${meeting.instructor || "TBA"}`
      );
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export async function copyScheduleAsText(courses: Course[]) {
  const text = buildScheduleText(courses);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
