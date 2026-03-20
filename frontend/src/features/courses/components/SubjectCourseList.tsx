import * as React from "react";
import { CalendarDays, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchedule } from "@/context/schedule/schedule-context";
import type { Course, Meeting } from "@/types/schedule";
import { cn } from "@/lib/utils";

function pickDefaultMeetings(course: Course): Meeting[] {
  const chosen = new Map<string, Meeting>();
  for (const meeting of course.meetings) {
    if (!chosen.has(meeting.type)) {
      chosen.set(meeting.type, meeting);
    }
  }
  return Array.from(chosen.values());
}

interface SubjectCourseListProps {
  courses: Course[];
}

export function SubjectCourseList({ courses }: SubjectCourseListProps) {
  const { addCourse, hasCourse } = useSchedule();

  if (courses.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-950/70">
        <p className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          No live courses found for this subject yet.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          The subject entry point is ready, but this department does not have matching catalog data in the current CSV. Once the backend or catalog feed is wired in, this list will populate automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {courses.map((course) => {
        const isAdded = hasCourse(course.id);
        return (
          <article
            key={course.id}
            className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950/85"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {course.id}
                  </span>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-200">
                    {course.credits} credit{course.credits === 1 ? "" : "s"}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {course.title}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {course.description || "Course description coming from the catalog feed."}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                    <CalendarDays className="h-4 w-4" />
                    {course.meetings.length} meeting option{course.meetings.length === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                    <Users className="h-4 w-4" />
                    {course.enrolled}/{course.maxEnroll} enrolled
                  </span>
                </div>
              </div>

              <Button
                type="button"
                disabled={isAdded}
                onClick={() => addCourse({ ...course, meetings: pickDefaultMeetings(course) })}
                className={cn(
                  "rounded-full px-5 font-semibold",
                  isAdded
                    ? "border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                    : "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
                )}
              >
                <Plus className="h-4 w-4" />
                {isAdded ? "Added to schedule" : "Add to schedule"}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
