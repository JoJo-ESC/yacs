import * as React from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSchedule } from "@/context/schedule/schedule-context";
import type { Course, Meeting } from "@/types/schedule";
import { hasScheduleConflict } from "@/lib/schedule/schedule";
import { cn } from "@/lib/utils";
import { SectionOptionCard } from "./SectionOptionCard";

type SectionOption = {
  key: string;
  type: string;
  section: string;
  crn: string;
  meetings: Meeting[];
  instructor: string;
  seatsAvailable: number;
  enrolled: number;
  maxEnroll: number;
};

function groupMeetingOptions(meetings: Meeting[]) {
  const options: SectionOption[] = [];

  for (const meeting of meetings) {
    const optionKey = `${meeting.type}::${meeting.section}::${meeting.crn}`;
    const existing = options.find((option) => option.key === optionKey);

    if (existing) {
      existing.meetings.push(meeting);
      if (!existing.instructor && meeting.instructor) existing.instructor = meeting.instructor;
      continue;
    }

    options.push({
      key: optionKey,
      type: meeting.type,
      section: meeting.section,
      crn: meeting.crn,
      meetings: [meeting],
      instructor: meeting.instructor,
      seatsAvailable: meeting.seatsAvailable,
      enrolled: meeting.enrolled,
      maxEnroll: meeting.maxEnroll,
    });
  }

  return [...options].sort((a, b) =>
    a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: "base" }),
  );
}

function buildDefaultSelection(course: Course, override?: SectionOption): Meeting[] {
  const options = groupMeetingOptions(course.meetings);
  const option = override ?? options[0];
  return option?.meetings ?? [];
}

function getSelectedOptionKey(meetings: Meeting[]) {
  const selectedMeeting = meetings[0];
  if (!selectedMeeting) return null;
  return `${selectedMeeting.type}::${selectedMeeting.section}::${selectedMeeting.crn}`;
}

function getMeetingKey(meeting: Meeting) {
  return `${meeting.type}::${meeting.section}::${meeting.crn}::${meeting.start}::${meeting.end}`;
}

function getOtherCourseMeetings(courses: Course[], courseId: string) {
  return courses
    .filter((course) => course.id !== courseId)
    .flatMap((course) => course.meetings);
}

function hasOptionConflict(otherMeetings: Meeting[], option: SectionOption, currentCourse: Course | undefined) {
  const meetingsToCheck = currentCourse && getSelectedOptionKey(currentCourse.meetings) === option.key ? otherMeetings : otherMeetings;
  return option.meetings.some((meeting) => hasScheduleConflict(meetingsToCheck, meeting));
}

interface SubjectCourseListProps {
  courses: Course[];
  initiallyExpandedCourseIds?: string[];
  showCourseHeader?: boolean;
}

export function SubjectCourseList({
  courses,
  initiallyExpandedCourseIds = [],
  showCourseHeader = true,
}: SubjectCourseListProps) {
  const { courses: selectedCourses, addCourse, removeCourse, hasCourse } = useSchedule();
  const [openCards, setOpenCards] = React.useState<Record<string, boolean>>(() =>
    initiallyExpandedCourseIds.reduce<Record<string, boolean>>((expanded, courseId) => {
      expanded[courseId] = true;
      return expanded;
    }, {}),
  );

  const selectedCourseMap = React.useMemo(
    () => new Map(selectedCourses.map((course) => [course.id, course])),
    [selectedCourses],
  );

  const otherMeetingsByCourse = React.useMemo(
    () =>
      new Map(
        courses.map((course) => [course.id, getOtherCourseMeetings(selectedCourses, course.id)]),
      ),
    [courses, selectedCourses],
  );

  const toggleCard = React.useCallback((courseId: string) => {
    setOpenCards((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  }, []);

  const applyOption = React.useCallback(
    (course: Course, option: SectionOption) => {
      const selectedCourse = selectedCourseMap.get(course.id);
      const isSameOptionSelected = selectedCourse && getSelectedOptionKey(selectedCourse.meetings) === option.key;
      const nextMeetings = selectedCourse
        ? isSameOptionSelected
          ? []
          : option.meetings
        : buildDefaultSelection(course, option);

      if (selectedCourse) removeCourse(course.id);
      if (nextMeetings.length > 0) addCourse({ ...course, meetings: nextMeetings });
      setOpenCards((prev) => ({ ...prev, [course.id]: true }));
    },
    [addCourse, removeCourse, selectedCourseMap],
  );

  if (courses.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-950/70">
        <p className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          No live courses found for this subject yet.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          This department does not have matching catalog entries in the current backend snapshot yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {courses.map((course) => {
        const selectedCourse = selectedCourseMap.get(course.id);
        const isAdded = hasCourse(course.id);
        const options = groupMeetingOptions(course.meetings);
        const sectionCount = options.length;
        const selectedLabels = (() => {
          const key = getSelectedOptionKey(selectedCourse?.meetings ?? []);
          const option = options.find((entry) => entry.key === key);
          return option ? [`${option.type} ${option.section}`] : [];
        })();

        return (
          <article
            key={course.id}
            className={cn(
              showCourseHeader &&
                "overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.14)] dark:border-[#3a3a3a] dark:bg-[#171717]",
            )}
          >
            {showCourseHeader ? (
              <button
                type="button"
                onClick={() => toggleCard(course.id)}
                className="flex w-full flex-col gap-4 p-5 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:bg-[#2f2f2f] dark:text-neutral-200">
                        {course.id}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                        {course.credits} credit{course.credits === 1 ? "" : "s"}
                      </span>
                      {isAdded ? (
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                          Selected
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {course.title}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-[#2f2f2f]">
                        <CalendarDays className="h-4 w-4" />
                        {sectionCount} section{sectionCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start lg:pl-4">
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {isAdded ? "Selected sections" : "Choose sections"}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {selectedLabels.length ? selectedLabels.join(", ") : "Open to add"}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfc9ae] bg-[#f8f2ea] text-[#7a5230] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6]">
                      {openCards[course.id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </span>
                  </div>
                </div>
              </button>
            ) : null}

            {openCards[course.id] ? (
              <div
                className={cn(
                  "px-0 py-0",
                  showCourseHeader && "border-t border-slate-200/70 dark:border-[#343434]",
                  showCourseHeader && "bg-slate-50/60 px-5 py-4 dark:bg-[#1a1a1a]",
                )}
              >
                <div className="space-y-3">
                  {options.map((option) => {
                    const selectedKey = getSelectedOptionKey(selectedCourse?.meetings ?? []);
                    const otherMeetings = otherMeetingsByCourse.get(course.id) ?? [];
                    const isSelected = selectedKey === option.key;
                    const conflictingMeetings = option.meetings.filter((meeting) => hasScheduleConflict(otherMeetings, meeting));
                    const hasConflict = conflictingMeetings.length > 0;

                    return (
                      <SectionOptionCard
                        key={option.key}
                        onClick={() => applyOption(course, option)}
                        sectionLabel={`Section ${option.section}`}
                        instructor={option.instructor}
                        crn={option.crn}
                        seatsAvailable={option.seatsAvailable}
                        enrolled={option.enrolled}
                        maxEnroll={option.maxEnroll}
                        meetings={option.meetings}
                        isSelected={isSelected}
                        hasConflict={hasConflict}
                        conflictingMeetingKeys={conflictingMeetings.map(getMeetingKey)}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
