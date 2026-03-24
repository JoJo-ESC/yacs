import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
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
  return (
    <Link
      to={`/courses/${subject.code}`}
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5 transition-all",
        "hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200",
        "dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:focus-visible:ring-zinc-800",
      )}
      aria-label={`Browse ${subject.code} ${subject.name} courses`}
    >
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-700 dark:bg-zinc-800 dark:text-slate-200">
              {highlightText(subject.code, query)}
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {highlightText(subject.name, query)}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{category.shortLabel}</p>
            </div>
          </div>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {subject.description ?? `${subject.name} courses at RPI.`}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {courseCount !== undefined ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {courseCount} live course{courseCount === 1 ? "" : "s"}
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-zinc-800 dark:text-slate-300">
              {subject.school}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-transform group-hover:translate-x-0.5 dark:text-slate-100">
            View courses
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
