import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
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
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4">
      {results.map(({ course, subject }) => (
        <Link
          key={course.id}
          to={`/courses/${course.department}`}
          className={cn(
            "group rounded-[24px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.12)] transition-all",
            "hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_22px_50px_-34px_rgba(15,23,42,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200",
            "dark:border-[#303030] dark:bg-[#171717] dark:hover:border-[#4a4a4a] dark:hover:shadow-[0_20px_45px_-28px_rgba(0,0,0,0.75)] dark:focus-visible:ring-[rgba(122,82,48,0.35)]",
          )}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:bg-[#303030] dark:text-neutral-200">
                  {highlightText(course.id, query)}
                </span>
                <span className="rounded-full border border-[#dfc9ae] bg-[#f8f2ea] px-3 py-1 text-xs font-semibold text-[#7a5230] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6]">
                  Class match
                </span>
                {subject ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-[#303030] dark:text-neutral-300">
                    In {subject.code} {subject.name}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {highlightText(course.title, query)}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {course.description || "Open the subject page to see this class in context and add it to your schedule."}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-transform group-hover:translate-x-0.5 dark:text-neutral-100">
              Open subject
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
