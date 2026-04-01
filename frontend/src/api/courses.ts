import { apiFetch } from "./client";
import {
  ApiCourseResponse,
  ApiCourseListResponse,
  ApiSemesterResponse,
  ApiDepartmentResponse,
} from "./types";
import { Course, Meeting } from "../types/schedule";

function formatTime(hhmm: string | null): string {
  if (!hhmm || hhmm.length < 4) return "";
  const h = parseInt(hhmm.slice(0, 2), 10);
  const m = hhmm.slice(2, 4);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m}${suffix}`;
}

function buildMeetings(raw: ApiCourseResponse): Meeting[] {
  return raw.meeting_times.map((mt) => {
    const days: string[] = [];
    if (mt.monday) days.push("M");
    if (mt.tuesday) days.push("T");
    if (mt.wednesday) days.push("W");
    if (mt.thursday) days.push("R");
    if (mt.friday) days.push("F");
    if (mt.saturday) days.push("S");
    if (mt.sunday) days.push("U");

    const location = [mt.building, mt.room].filter(Boolean).join(" ") || "";

    return {
      type: raw.schedule_type ?? "",
      days,
      start: formatTime(mt.begin_time),
      end: formatTime(mt.end_time),
      location,
      instructor: mt.instructor_name ?? "",
      section: raw.section ?? "",
    };
  });
}

function apiCoursesToCourses(raw: ApiCourseResponse[]): Course[] {
  const map = new Map<string, Course>();

  for (const row of raw) {
    const key = `${row.subject}-${row.course_number}`;
    const meetings = buildMeetings(row);

    if (map.has(key)) {
      map.get(key)!.meetings.push(...meetings);
    } else {
      map.set(key, {
        id: key,
        title: row.course_title ?? "",
        credits: row.credit_hours ?? 0,
        level: row.course_number ?? "",
        department: row.subject ?? "",
        school: row.subject_description ?? "",
        description: "",
        offerFrequency: "",
        prereqs: [],
        coreqs: [],
        maxEnroll: row.max_enrollment ?? 0,
        enrolled: row.enrollment ?? 0,
        meetings,
      });
    }
  }

  return Array.from(map.values());
}

export async function fetchAllCourses(semester?: string): Promise<Course[]> {
  const allRaw: ApiCourseResponse[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const params = new URLSearchParams({ page: String(page), per_page: "100" });
    if (semester) params.set("semester", semester);
    const res = await apiFetch<ApiCourseListResponse>(`/api/courses?${params}`);
    allRaw.push(...res.data);
    totalPages = res.pagination.total_pages;
    page++;
  } while (page <= totalPages);

  return apiCoursesToCourses(allRaw);
}

export async function searchCourses(query: string, semester?: string): Promise<Course[]> {
  const params = new URLSearchParams({ q: query, per_page: "100" });
  if (semester) params.set("semester", semester);
  const res = await apiFetch<ApiCourseListResponse>(`/api/courses/search?${params}`);
  return apiCoursesToCourses(res.data);
}

export async function fetchSemesters(): Promise<ApiSemesterResponse[]> {
  return apiFetch<ApiSemesterResponse[]>("/api/semesters");
}

export async function fetchDepartments(): Promise<ApiDepartmentResponse[]> {
  return apiFetch<ApiDepartmentResponse[]>("/api/departments");
}
