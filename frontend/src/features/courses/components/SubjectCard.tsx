import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { prefetchCoursesByDepartment } from "@/api";
import { getSubjectBadgeClasses } from "@/lib/courses/subjectColors";
import { cn } from "@/lib/utils";
import type { Subject, SubjectCategory } from "@/types/courses";

interface SubjectCardProps {
  subject: Subject;
  category: SubjectCategory;
  courseCount?: number;
  query?: string;
}

function highlightText(value: string, query?: string) {
  const normalizedQuery = query?.trim().toLowerCase();
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

export function SubjectCard({ subject, category, courseCount, query }: SubjectCardProps) {
  const prefetchSubject = React.useCallback(() => {
    void prefetchCoursesByDepartment(subject.code);
  }, [subject.code]);
  const subjectBadgeClasses = getSubjectBadgeClasses(subject);

  return (
    <Link
      to={`/courses/${subject.code}`}
      onMouseEnter={prefetchSubject}
      onFocus={prefetchSubject}
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.12)] transition-all",
        "hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_22px_50px_-34px_rgba(15,23,42,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200",
        "dark:border-[#303030] dark:bg-[#171717] dark:hover:border-[#4a4a4a] dark:hover:shadow-[0_20px_45px_-28px_rgba(0,0,0,0.75)] dark:focus-visible:ring-[rgba(122,82,48,0.35)]",
      )}
      aria-label={`Browse ${subject.code} ${subject.name} courses`}
    >
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span
              className={cn(
                "inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]",
                subjectBadgeClasses.solid,
              )}
            >
              {highlightText(subject.code, query)}
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight text-slate-950 dark:text-neutral-50">
                {highlightText(subject.name, query)}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">{category.shortLabel}</p>
            </div>
          </div>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-neutral-300">
          {subject.description ?? `${subject.name} courses at RPI.`}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {courseCount !== undefined ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-[#303030] dark:text-neutral-300">
                {courseCount} live course{courseCount === 1 ? "" : "s"}
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-[#303030] dark:text-neutral-300">
              {subject.school}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-transform group-hover:translate-x-0.5 dark:text-neutral-100">
            View courses
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
