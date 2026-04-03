import * as React from "react";
import { ArrowLeft, BookOpenText, Grid2X2 } from "lucide-react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { fetchCoursesByDepartment, getCachedCoursesByDepartment } from "@/api";
import { SubjectCourseList } from "@/features/courses/components/SubjectCourseList";
import { useSubjects } from "@/hooks/courses/useSubjects";
import { getSubjectByCode, getSubjectCategories } from "@/lib/courses/subjects";
import type { Subject } from "@/types/courses";
import type { Course } from "@/types/schedule";

type ClassSectionsLocationState = {
  course?: Course;
  subject?: Subject;
};

function getDepartmentFromCourseId(courseId: string) {
  const separatorIndex = courseId.indexOf("-");
  return separatorIndex === -1 ? courseId : courseId.slice(0, separatorIndex);
}

export default function ClassSectionsPage() {
  const { courseId = "" } = useParams();
  const location = useLocation();
  const locationState = (location.state as ClassSectionsLocationState | null) ?? null;
  const decodedCourseId = decodeURIComponent(courseId);
  const departmentCode = getDepartmentFromCourseId(decodedCourseId).toUpperCase();
  const { subjects } = useSubjects();

  const cachedDepartmentCourses = getCachedCoursesByDepartment(departmentCode) ?? [];
  const initialCourse =
    locationState?.course?.id === decodedCourseId
      ? locationState.course
      : cachedDepartmentCourses.find((course) => course.id === decodedCourseId);

  const [course, setCourse] = React.useState<Course | null>(initialCourse ?? null);
  const [loading, setLoading] = React.useState(!initialCourse && decodedCourseId.length > 0);
  const [error, setError] = React.useState<string | null>(null);

  const subject = React.useMemo(
    () => locationState?.subject ?? getSubjectByCode(subjects, departmentCode),
    [locationState?.subject, subjects, departmentCode],
  );
  const category = React.useMemo(
    () => (subject ? getSubjectCategories().find((entry) => entry.id === subject.category) : undefined),
    [subject],
  );

  React.useEffect(() => {
    if (!decodedCourseId) {
      setCourse(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (initialCourse) {
      setCourse(initialCourse);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadCourse() {
      setLoading(true);
      setError(null);

      try {
        const departmentCourses = await fetchCoursesByDepartment(departmentCode);
        if (cancelled) return;

        const matchedCourse = departmentCourses.find((entry) => entry.id === decodedCourseId) ?? null;
        setCourse(matchedCourse);
        if (!matchedCourse) {
          setError("This class could not be found in the current catalog snapshot.");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load class sections");
          setCourse(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      cancelled = true;
    };
  }, [decodedCourseId, departmentCode, initialCourse]);

  if (!decodedCourseId) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <main className="relative flex-1 overflow-x-hidden bg-white pb-16 dark:bg-none dark:bg-black">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[40px] border border-white/80 bg-white/82 p-8 shadow-[0_28px_100px_-56px_rgba(15,23,42,0.45)] backdrop-blur dark:border-[#3a3a3a] dark:bg-[#1f1f1f]">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6] dark:hover:bg-[#422f22]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to class search
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border border-[#dfc9ae] bg-[#f8f2ea] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#7a5230] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6]">
                {course?.id ?? decodedCourseId}
              </p>
              <h1 className="font-display mt-5 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl dark:text-white">
                {course?.title ?? "Loading class"}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Review every available section for this class and add the combination you want directly to your schedule.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-[#2b2b2b] dark:text-neutral-200">
                  {category?.label ?? "Course"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-[#2b2b2b] dark:text-neutral-200">
                  {subject?.name ?? departmentCode}
                </span>
                {course ? (
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-500 ring-1 ring-slate-200 dark:bg-[#262626] dark:text-neutral-300 dark:ring-[#3a3a3a]">
                    {course.credits} credit{course.credits === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 dark:border-[#3a3a3a] dark:bg-[#262626]">
                <BookOpenText className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                <div className="mt-6 text-3xl font-semibold tracking-tight">
                  {course ? new Set(course.meetings.map((meeting) => `${meeting.type}::${meeting.section}::${meeting.crn}`)).size : 0}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Available sections in the current snapshot.</p>
              </div>
              <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-5 dark:border-[#3a3a3a] dark:bg-[#262626]">
                <Grid2X2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                <div className="mt-6 text-3xl font-semibold tracking-tight">{course?.meetings.length ?? 0}</div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Meeting blocks across lecture, lab, and recitation options.</p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid gap-4 animate-pulse">
            <div className="h-64 rounded-[28px] border border-slate-200/80 bg-white/80 dark:border-[#3a3a3a] dark:bg-[#262626]" />
          </div>
        ) : error ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-12 text-center dark:border-rose-900 dark:bg-rose-950/40">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-rose-900 dark:text-rose-100">
              The class sections could not be loaded.
            </h2>
            <p className="mt-3 text-sm leading-6 text-rose-700 dark:text-rose-200">{error}</p>
          </section>
        ) : course ? (
          <section className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Sections
                </p>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Available sections for {course.id}
                </h2>
              </div>
              <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Choose a section below to add or swap it in your schedule.
              </p>
            </div>
            <SubjectCourseList courses={[course]} initiallyExpandedCourseIds={[course.id]} />
          </section>
        ) : (
          <Navigate to="/courses" replace />
        )}
      </div>
    </main>
  );
}
