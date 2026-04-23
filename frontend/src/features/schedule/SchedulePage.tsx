import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchedule } from "@/context/schedule/schedule-context";
import { useSemester } from "@/context/semester/semester-context";
import ScheduleList from "@/features/schedule/components/ScheduleList";
import WeekScheduler from "@/features/schedule/components/WeekScheduler";
import { hasScheduleConflict } from "@/lib/schedule/schedule";
import type { Course, Meeting } from "@/types/schedule";

type MeetingOption = {
  key: string;
  meetings: Meeting[];
};

type CourseVariant = {
  course: Course;
  signature: string;
};

type ScheduleVariant = {
  courses: Course[];
  signature: string;
};

const MAX_VARIANTS_PER_COURSE = 18;
const MAX_SCHEDULE_VARIANTS = 48;

function groupMeetingOptions(meetings: Meeting[]) {
  const options: MeetingOption[] = [];

  for (const meeting of meetings) {
    const key = `${meeting.type}::${meeting.section}::${meeting.crn}`;
    const existing = options.find((option) => option.key === key);

    if (existing) {
      existing.meetings.push(meeting);
      continue;
    }

    options.push({
      key,
      meetings: [meeting],
    });
  }

  return [...options].sort((a, b) =>
    a.key.localeCompare(b.key, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

function getMeetingOptionKey(meeting: Meeting) {
  return `${meeting.type}::${meeting.section}::${meeting.crn}`;
}

function getSelectedOptionKey(meetings: Meeting[]) {
  const selectedMeeting = meetings[0];
  if (!selectedMeeting) return null;
  return getMeetingOptionKey(selectedMeeting);
}

function getCourseSelectionSignature(course: Course) {
  return getSelectedOptionKey(course.meetings) ?? "unselected";
}

function normalizeCourseMeetings(course: Course) {
  const selectedKey = getSelectedOptionKey(course.meetings);
  if (!selectedKey) return course;

  const normalizedMeetings = course.meetings.filter((meeting) => getMeetingOptionKey(meeting) === selectedKey);
  return normalizedMeetings.length === course.meetings.length ? course : { ...course, meetings: normalizedMeetings };
}

function buildCourseVariants(course: Course, catalogCourse?: Course): CourseVariant[] {
  const sourceMeetings = catalogCourse?.meetings.length ? catalogCourse.meetings : course.meetings;
  const options = groupMeetingOptions(sourceMeetings);

  if (options.length === 0) {
    return [{ course, signature: getCourseSelectionSignature(course) }];
  }

  return options
    .slice(0, MAX_VARIANTS_PER_COURSE)
    .map((option) => ({
      course: { ...course, meetings: option.meetings },
      signature: option.key,
    }))
    .sort((a, b) => a.signature.localeCompare(b.signature, undefined, { numeric: true, sensitivity: "base" }));
}

function buildScheduleVariants(selectedCourses: Course[], catalogById: Map<string, Course>) {
  const perCourseVariants = selectedCourses.map((course) => buildCourseVariants(course, catalogById.get(course.id)));
  const variants: ScheduleVariant[] = [];

  const walk = (courseIndex: number, chosenCourses: Course[], chosenMeetings: Meeting[], signatureParts: string[]) => {
    if (variants.length >= MAX_SCHEDULE_VARIANTS) return;

    if (courseIndex === perCourseVariants.length) {
      variants.push({
        courses: chosenCourses,
        signature: signatureParts.join("||"),
      });
      return;
    }

    for (const variant of perCourseVariants[courseIndex] ?? []) {
      if (variant.course.meetings.some((meeting) => hasScheduleConflict(chosenMeetings, meeting))) {
        continue;
      }

      walk(
        courseIndex + 1,
        [...chosenCourses, variant.course],
        [...chosenMeetings, ...variant.course.meetings],
        [...signatureParts, `${variant.course.id}:${variant.signature}`],
      );
    }
  };

  walk(0, [], [], []);

  return variants;
}

export default function SchedulePage() {
  const { courses, catalog, catalogStatus, loadCatalog, replaceCourses } = useSchedule();
  const { selectedSemester } = useSemester();

  React.useEffect(() => {
    const normalizedCourses = courses.map(normalizeCourseMeetings);
    const hasChanged = normalizedCourses.some((course, index) => course.meetings !== courses[index]?.meetings);

    if (hasChanged) {
      replaceCourses(normalizedCourses);
    }
  }, [courses, replaceCourses]);

  React.useEffect(() => {
    if (courses.length > 0 && catalogStatus === "idle") {
      void loadCatalog(selectedSemester);
    }
  }, [courses.length, catalogStatus, loadCatalog, selectedSemester]);

  const catalogById = React.useMemo(() => {
    return new Map(catalog.map((course) => [course.id, course]));
  }, [catalog]);

  const scheduleVariants = React.useMemo(() => {
    if (courses.length === 0) return [];
    return buildScheduleVariants(courses, catalogById);
  }, [courses, catalogById]);

  const currentSignature = React.useMemo(
    () => courses.map((course) => `${course.id}:${getCourseSelectionSignature(course)}`).join("||"),
    [courses],
  );

  const currentVariantIndex = React.useMemo(
    () => scheduleVariants.findIndex((variant) => variant.signature === currentSignature),
    [scheduleVariants, currentSignature],
  );

  const canCycleVariants = scheduleVariants.length > 1;

  const cycleScheduleVariant = React.useCallback(
    (direction: -1 | 1) => {
      if (scheduleVariants.length === 0) return;

      const nextIndex =
        currentVariantIndex === -1
          ? direction > 0
            ? 0
            : scheduleVariants.length - 1
          : (currentVariantIndex + direction + scheduleVariants.length) % scheduleVariants.length;

      replaceCourses(scheduleVariants[nextIndex].courses);
    },
    [currentVariantIndex, replaceCourses, scheduleVariants],
  );

  const variantStatus = React.useMemo(() => {
    if (courses.length === 0) return "Add courses";
    if (catalogStatus === "loading" && catalog.length === 0) return "Finding fits";
    if (scheduleVariants.length === 0) return "No clean fit";
    if (scheduleVariants.length === 1) return "1 working fit";
    if (currentVariantIndex === -1) return `${scheduleVariants.length} working fits`;
    return `${currentVariantIndex + 1} of ${scheduleVariants.length}`;
  }, [catalog.length, catalogStatus, courses.length, currentVariantIndex, scheduleVariants.length]);

  return (
    <main className="relative flex-1 overflow-x-hidden bg-white pb-16 dark:bg-none dark:bg-black">
      <div className="relative mx-auto flex w-full max-w-[96rem] flex-col gap-3 px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Weekly overview
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Schedule grid
              </h2>
            </div>

            <div className="flex items-end gap-4 self-start sm:self-auto">
              <div className="text-left sm:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Conflict-free combinations
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{variantStatus}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => cycleScheduleVariant(-1)}
                  disabled={!canCycleVariants}
                  className="h-10 w-10 rounded-full border-[#dfc9ae] bg-[#f8f2ea] text-[#7a5230] shadow-none hover:bg-[#efe3d2] disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6] dark:hover:bg-[#4a3223] dark:disabled:border-[#343434] dark:disabled:bg-[#1f1f1f] dark:disabled:text-[#666666]"
                  aria-label="Show previous working section combination"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => cycleScheduleVariant(1)}
                  disabled={!canCycleVariants}
                  className="h-10 w-10 rounded-full border-[#dfc9ae] bg-[#f8f2ea] text-[#7a5230] shadow-none hover:bg-[#efe3d2] disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6] dark:hover:bg-[#4a3223] dark:disabled:border-[#343434] dark:disabled:bg-[#1f1f1f] dark:disabled:text-[#666666]"
                  aria-label="Show next working section combination"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <WeekScheduler events={[]} startHour={8} endHour={22} showWeekend={false} />
        </section>

        <section>
          <ScheduleList />
        </section>
      </div>
    </main>
  );
}
