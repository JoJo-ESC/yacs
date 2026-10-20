import * as React from "react";
import { CalendarDays } from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SubjectCourseList } from "@/features/courses/components/SubjectCourseList";
import { getSubjectBadgeClasses } from "@/lib/courses/subjectColors";
import type { Subject } from "@/types/courses";
import type { Course } from "@/types/schedule";
import { cn } from "@/lib/utils";

interface CourseSearchResultItem {
  course: Course;
  subject?: Subject;
}

interface CourseSearchResultsProps {
  results: CourseSearchResultItem[];
  query: string;
}

function highlightText(value: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return value;

  const matchIndex = value.toLowerCase().indexOf(normalizedQuery);
  if (matchIndex === -1) return value;

  const before = value.slice(0, matchIndex);
  const match = value.slice(matchIndex, matchIndex + normalizedQuery.length);
  const after = value.slice(matchIndex + normalizedQuery.length);

  return (
    <>
      {before}
      <mark className="rounded bg-amber-200/80 px-1 text-inherit dark:bg-amber-500/30">{match}</mark>
      {after}
    </>
  );
}

export function CourseSearchResults({ results, query }: CourseSearchResultsProps) {
  const [expandedCourseId, setExpandedCourseId] = React.useState<string | null>(null);

  const toggleExpandedCourse = React.useCallback((courseId: string) => {
    setExpandedCourseId((currentCourseId) => (currentCourseId === courseId ? null : courseId));
  }, []);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4">
      {results.map(({ course, subject }) => (
        <article
          key={course.id}
          className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.14)] dark:border-[#3a3a3a] dark:bg-[#171717]"
        >
          <button
            type="button"
            onClick={() => toggleExpandedCourse(course.id)}
            className={cn(
              "group flex w-full flex-col gap-4 p-5 text-left transition-all",
              "hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200",
              "dark:hover:bg-white/[0.03] dark:focus-visible:ring-[rgba(122,82,48,0.35)]",
            )}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:bg-[#303030] dark:text-neutral-200">
                    {highlightText(course.id, query)}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                    {course.credits} credit{course.credits === 1 ? "" : "s"}
                  </span>
                  {subject ? (
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        getSubjectBadgeClasses(subject).outline,
                      )}
                    >
                      In {subject.code} {subject.name}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {highlightText(course.title, query)}
                </h3>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-[#2f2f2f]">
                    <CalendarDays className="h-4 w-4" />
                    {
                      new Set(course.meetings.map((meeting) => `${meeting.type}::${meeting.section}::${meeting.crn}`))
                        .size
                    }{" "}
                    section
                    {new Set(course.meetings.map((meeting) => `${meeting.type}::${meeting.section}::${meeting.crn}`)).size === 1
                      ? ""
                      : "s"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start lg:pl-4">
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Choose sections
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {expandedCourseId === course.id ? "Hide sections" : "Open to add"}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfc9ae] bg-[#f8f2ea] text-[#7a5230] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6]">
                  {expandedCourseId === course.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </div>
            </div>
          </button>

          {expandedCourseId === course.id ? (
            <div className="border-t border-slate-200/70 bg-slate-50/60 px-5 py-4 dark:border-[#343434] dark:bg-[#1a1a1a]">
              <SubjectCourseList
                courses={[course]}
                initiallyExpandedCourseIds={[course.id]}
                showCourseHeader={false}
              />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
