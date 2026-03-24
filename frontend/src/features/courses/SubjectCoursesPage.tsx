import * as React from "react";
import { ArrowLeft, BookOpenText, Grid2X2 } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useSchedule } from "@/context/schedule/schedule-context";
import { SubjectCourseList } from "@/features/courses/components/SubjectCourseList";
import { useSubjects } from "@/hooks/courses/useSubjects";
import { getCourseCountBySubject, getSubjectByCode, getSubjectCategories } from "@/lib/courses/subjects";

export default function SubjectCoursesPage() {
  const { subjectCode = "" } = useParams();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { catalog, catalogLoading, catalogError } = useSchedule();

  const subject = React.useMemo(() => getSubjectByCode(subjects, subjectCode), [subjects, subjectCode]);
  const category = React.useMemo(
    () => getSubjectCategories().find((entry) => entry.id === subject?.category),
    [subject],
  );
  const courseCounts = React.useMemo(() => getCourseCountBySubject(catalog), [catalog]);
  const subjectCourses = React.useMemo(
    () => catalog.filter((course) => course.department.toUpperCase() === subjectCode.toUpperCase()),
    [catalog, subjectCode],
  );

  if (!subjectsLoading && !subject) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <main className="relative flex-1 overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(147,197,253,0.12),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(176,129,89,0.12),_transparent_20%),linear-gradient(180deg,_#fffefd_0%,_#fffdfa_38%,_#ffffff_100%)] pb-16 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(161,98,7,0.18),_transparent_24%),linear-gradient(180deg,_#120d09_0%,_#16110d_42%,_#09090b_100%)]">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[40px] border border-white/80 bg-white/82 p-8 shadow-[0_28px_100px_-56px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/72">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to subject browser
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-sky-700 dark:bg-sky-950/70 dark:text-sky-200">
                {subject?.code ?? subjectCode}
              </p>
              <h1 className="font-display mt-5 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl dark:text-white">
                {subject?.name ?? "Loading subject"}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                {subject?.description ??
                  "Browse live course listings for this subject and add classes directly into your schedule."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {category?.label ?? "Subject area"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {subject?.school ?? "RPI"}
                </span>
                {subject?.aliases?.slice(0, 3).map((alias) => (
                  <span
                    key={alias}
                    className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 dark:border-slate-800 dark:bg-slate-950/88">
                <BookOpenText className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                <div className="mt-6 text-3xl font-semibold tracking-tight">
                  {subject ? courseCounts[subject.code] ?? 0 : 0}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Catalog courses currently mapped to this subject.</p>
              </div>
              <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 dark:border-slate-800 dark:bg-slate-950/88">
                <Grid2X2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                <div className="mt-6 text-3xl font-semibold tracking-tight">{subjectCourses.length}</div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Visible listings for the current catalog snapshot.</p>
              </div>
            </div>
          </div>
        </section>

        {catalogLoading ? (
          <div className="grid gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-48 rounded-[28px] border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-950/70" />
            ))}
          </div>
        ) : catalogError ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-12 text-center dark:border-rose-900 dark:bg-rose-950/40">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-rose-900 dark:text-rose-100">
              The course catalog could not be loaded.
            </h2>
            <p className="mt-3 text-sm leading-6 text-rose-700 dark:text-rose-200">{catalogError}</p>
          </section>
        ) : (
          <section className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Course listings
                </p>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {subjectCourses.length} course{subjectCourses.length === 1 ? "" : "s"} in {subject?.code ?? subjectCode.toUpperCase()}
                </h2>
              </div>
              <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                These results come from the existing catalog context, so plugging in a new catalog feed updates this screen without changing the subject UI.
              </p>
            </div>
            <SubjectCourseList courses={subjectCourses} />
          </section>
        )}
      </div>
    </main>
  );
}
