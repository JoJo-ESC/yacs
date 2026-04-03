import * as React from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSchedule } from "@/context/schedule/schedule-context";
import type { Course, Meeting } from "@/types/schedule";
import { hasScheduleConflict } from "@/lib/schedule/schedule";
import { cn } from "@/lib/utils";

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
  const byType: Record<string, SectionOption[]> = {};

  for (const meeting of meetings) {
    const optionKey = `${meeting.type}::${meeting.section}::${meeting.crn}`;
    const options = (byType[meeting.type] ||= []);
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

  return Object.fromEntries(
    Object.entries(byType).map(([type, options]) => [
      type,
      [...options].sort((a, b) =>
        a.section.localeCompare(b.section, undefined, { numeric: true, sensitivity: "base" }),
      ),
    ]),
  );
}

const WEEK_DAYS = [
  { key: "M", label: "M" },
  { key: "T", label: "T" },
  { key: "W", label: "W" },
  { key: "R", label: "R" },
  { key: "F", label: "F" },
] as const;

function MiniWeekPreview({ meetings }: { meetings: Meeting[] }) {
  const meetingsByDay = new Map<string, Meeting[]>();

  for (const day of WEEK_DAYS) {
    meetingsByDay.set(day.key, []);
  }

  for (const meeting of meetings) {
    for (const day of meeting.days) {
      if (!meetingsByDay.has(day)) continue;
      meetingsByDay.get(day)!.push(meeting);
    }
  }

  return (
    <div className="grid grid-cols-5 items-stretch overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-[#353535] dark:bg-[#222222]">
      {WEEK_DAYS.map((day) => (
        <div key={day.key} className="border-r border-slate-200/80 last:border-r-0 dark:border-[#353535]">
          <div className="border-b border-slate-200/80 px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-[#353535] dark:text-slate-400">
            {day.label}
          </div>
          <div className="min-h-20 px-2 py-2">
            <div className="flex min-h-16 flex-col justify-center gap-1">
              {(meetingsByDay.get(day.key) ?? []).length > 0 ? (
                (meetingsByDay.get(day.key) ?? []).map((meeting, index) => (
                  <div
                    key={`${day.key}-${meeting.start}-${meeting.end}-${index}`}
                    className="rounded-full border border-[#7cc9ff] bg-sky-100/90 px-2 py-1 text-center text-[10px] font-semibold text-sky-800 shadow-sm dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100"
                    title={`${day.label} ${meeting.start}-${meeting.end}${meeting.location ? ` • ${meeting.location}` : ""}`}
                  >
                    {meeting.start && meeting.end ? `${meeting.start} - ${meeting.end}` : "Time TBA"}
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildDefaultSelection(course: Course, override?: SectionOption): Meeting[] {
  const optionsByType = groupMeetingOptions(course.meetings);
  const selected: Meeting[] = [];

  for (const [type, options] of Object.entries(optionsByType)) {
    const option = override && override.type === type ? override : options[0];
    if (!option) continue;
    selected.push(...option.meetings);
  }

  return selected;
}

function replaceOptionForType(currentMeetings: Meeting[], nextOption: SectionOption) {
  return [
    ...currentMeetings.filter((meeting) => meeting.type !== nextOption.type),
    ...nextOption.meetings,
  ];
}

function removeOptionForType(currentMeetings: Meeting[], type: string) {
  return currentMeetings.filter((meeting) => meeting.type !== type);
}

function getSelectedOptionKey(meetings: Meeting[], type: string) {
  const selectedMeeting = meetings.find((meeting) => meeting.type === type);
  if (!selectedMeeting) return null;
  return `${selectedMeeting.type}::${selectedMeeting.section}::${selectedMeeting.crn}`;
}

function getOtherCourseMeetings(courses: Course[], courseId: string) {
  return courses
    .filter((course) => course.id !== courseId)
    .flatMap((course) => course.meetings);
}

function hasOptionConflict(otherMeetings: Meeting[], option: SectionOption, currentCourse: Course | undefined) {
  const otherSelectedMeetingsForCourse =
    currentCourse?.meetings.filter((meeting) => meeting.type !== option.type) ?? [];
  const meetingsToCheck = [...otherMeetings, ...otherSelectedMeetingsForCourse];
  return option.meetings.some((meeting) => hasScheduleConflict(meetingsToCheck, meeting));
}

function getSeatTone(seatsAvailable: number, maxEnroll: number) {
  if (maxEnroll <= 0) return "text-slate-600 dark:text-slate-300";
  if (seatsAvailable <= 0) return "text-rose-700 dark:text-rose-300";
  if (seatsAvailable <= Math.max(2, Math.round(maxEnroll * 0.1))) return "text-amber-700 dark:text-amber-300";
  return "text-emerald-700 dark:text-emerald-300";
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
      const isSameOptionSelected =
        selectedCourse && getSelectedOptionKey(selectedCourse.meetings, option.type) === option.key;
      const nextMeetings = selectedCourse
        ? isSameOptionSelected
          ? removeOptionForType(selectedCourse.meetings, option.type)
          : replaceOptionForType(selectedCourse.meetings, option)
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
        const optionsByType = groupMeetingOptions(course.meetings);
        const sectionCount = Object.values(optionsByType).reduce((count, options) => count + options.length, 0);
        const selectedLabels = Object.keys(optionsByType)
          .map((type) => {
            const key = getSelectedOptionKey(selectedCourse?.meetings ?? [], type);
            const option = optionsByType[type]?.find((entry) => entry.key === key);
            return option ? `${option.type} ${option.section}` : null;
          })
          .filter(Boolean) as string[];

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
                  {Object.entries(optionsByType).map(([type, options]) => {
                    const selectedKey = getSelectedOptionKey(selectedCourse?.meetings ?? [], type);
                    const otherMeetings = otherMeetingsByCourse.get(course.id) ?? [];

                    return (
                      <section
                        key={`${course.id}-${type}`}
                        className="space-y-2.5"
                      >
                        {options.map((option) => {
                          const isSelected = selectedKey === option.key;
                          const hasConflict = hasOptionConflict(otherMeetings, option, selectedCourse);
                          const seatTone = getSeatTone(option.seatsAvailable, option.maxEnroll);

                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => applyOption(course, option)}
                              className={cn(
                                "w-full rounded-[20px] border p-3 text-left transition-all",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#252525]",
                                isSelected
                                  ? "border-sky-300 bg-sky-50 shadow-[0_14px_30px_-24px_rgba(14,165,233,0.7)] dark:border-sky-800 dark:bg-sky-950/30"
                                  : "border-slate-200 bg-white hover:border-[#d8c3aa] hover:bg-[#fbf7f1] dark:border-[#3a3a3a] dark:bg-[#1f1f1f] dark:hover:border-[#6d4f36] dark:hover:bg-[#2a221d]",
                              )}
                            >
                              <div className="flex flex-col gap-2.5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-base font-semibold text-slate-900 dark:text-white">
                                        Section {option.section}
                                      </span>
                                      {isSelected ? (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          Selected
                                        </span>
                                      ) : null}
                                      {hasConflict ? (
                                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                                          Time conflict
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                      {option.instructor || "Instructor TBA"}{option.crn ? ` • CRN ${option.crn}` : ""}
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p className={cn("text-sm font-semibold", seatTone)}>
                                      {option.seatsAvailable} seat{option.seatsAvailable === 1 ? "" : "s"} available
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                      {option.enrolled}/{option.maxEnroll || "?"} enrolled
                                    </p>
                                  </div>
                                </div>

                                <MiniWeekPreview meetings={option.meetings} />
                              </div>
                            </button>
                          );
                        })}
                      </section>
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
