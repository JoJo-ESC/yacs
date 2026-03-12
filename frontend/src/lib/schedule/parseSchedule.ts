// src/lib/schedule/parseSchedule.ts
import Papa from "papaparse";
import type { Course, Meeting } from "@/types/schedule";

type RawRow = {
  course_name: string;
  course_type: string;
  course_credit_hours: string | number;
  course_days_of_the_week: string;
  course_start_time: string;
  course_end_time: string;
  course_instructor: string;
  course_location: string;
  course_max_enroll: string | number;
  course_enrolled: string | number;
  course_level: string;
  course_section: string;
  short_name: string;      // e.g. "CSCI-1100"
  full_name: string;       // e.g. "Computer Science 1"
  description: string;
  raw_precoreqs: string;
  offer_frequency: string;
  prerequisites: string;   // e.g. "['CSCI 1100']" or "[]"
  corequisites: string;    // same format
  school: string;
  // ... extra columns ignored
};

const splitDays = (s: string): string[] => {
  // Expect compact strings like "MWF", "TR", "MR", "R", etc.
  // T=Tue, R=Thu convention
  return (s || "")
    .trim()
    .split("")
    .filter(Boolean);
};

const parseArrayField = (s: string): string[] => {
  // Handles strings like "['CSCI 1100']" or "[]"
  if (!s || !s.trim().length) return [];
  try {
    // Loosest possible: replace single quotes with double and JSON.parse
    const fixed = s.replace(/'/g, '"');
    const arr = JSON.parse(fixed);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
};

const toInt = (v: string | number | undefined, fallback = 0) => {
  if (typeof v === "number") return v;
  const n = parseInt((v ?? "").toString().replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
};

const toFloat = (v: string | number | undefined, fallback = 0) => {
  if (typeof v === "number") return v;
  const n = parseFloat((v ?? "").toString());
  return Number.isFinite(n) ? n : fallback;
};

const rowToMeeting = (r: RawRow): Meeting => ({
  type: r.course_type ?? "",
  days: splitDays(r.course_days_of_the_week),
  start: r.course_start_time ?? "",
  end: r.course_end_time ?? "",
  location: r.course_location ?? "",
  instructor: r.course_instructor ?? "",
  section: r.course_section ?? "",
});

const rowToCourseCore = (r: RawRow) => {
  const id = r.short_name ?? "";
  const department = id.includes("-") ? id.split("-")[0] : id.slice(0, 4);
  return {
    id,
    title: r.full_name ?? r.course_name ?? "",
    credits: toFloat(r.course_credit_hours, 0),
    level: r.course_level ?? "",
    department,
    school: r.school ?? "",
    description: r.description ?? "",
    offerFrequency: r.offer_frequency ?? "",
    prereqs: parseArrayField(r.prerequisites),
    coreqs: parseArrayField(r.corequisites),
    maxEnroll: toInt(r.course_max_enroll, 0),
    enrolled: toInt(r.course_enrolled, 0),
  };
};

/**
 * Parse CSV text -> Course[]
 * - Groups rows by short_name (course id)
 * - Aggregates LEC/LAB/REC rows into Course.meetings
 */
export function parseCoursesFromCsvText(csvText: string): Course[] {
  const parsed = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const byId = new Map<string, Course>();

  for (const r of parsed.data) {
    const core = rowToCourseCore(r);
    const meeting = rowToMeeting(r);

    if (!byId.has(core.id)) {
      byId.set(core.id, { ...core, meetings: [meeting] });
    } else {
      byId.get(core.id)!.meetings.push(meeting);
    }
  }

  return Array.from(byId.values());
}
