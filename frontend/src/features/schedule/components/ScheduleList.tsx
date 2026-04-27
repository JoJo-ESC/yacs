import * as React from "react";
import type { JSX } from "react";
import { CalendarDays, ChevronDown, ChevronUp, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSchedule } from "@/context/schedule/schedule-context";
import { SectionOptionCard } from "@/features/courses/components/SectionOptionCard";
import { buildScheduleIcs, hasExportableMeetings } from "@/lib/schedule/calendarExport";
import { hasScheduleConflict } from "@/lib/schedule/schedule";
import type { Course, Meeting } from "@/types/schedule";

type MeetingOption = {
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
  const options: MeetingOption[] = [];

  for (const meeting of meetings) {
    const key = `${meeting.type}::${meeting.section}::${meeting.crn}`;
    const existing = options.find((option) => option.key === key);

    if (existing) {
      existing.meetings.push(meeting);
      if (!existing.instructor && meeting.instructor) existing.instructor = meeting.instructor;
      continue;
    }

    options.push({
      key,
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
    a.key.localeCompare(b.key, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

function getSelectedOptionKey(meetings: Meeting[]) {
  const selectedMeeting = meetings[0];
  if (!selectedMeeting) return null;
  return `${selectedMeeting.type}::${selectedMeeting.section}::${selectedMeeting.crn}`;
}

function getMeetingKey(meeting: Meeting) {
  return `${meeting.type}::${meeting.section}::${meeting.crn}::${meeting.start}::${meeting.end}`;
}

interface CourseCardProps {
  course: Course;
  expanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  allMeetingsForCourse: Meeting[];
  otherCourses: Course[];
  replaceCourseMeetings: (course: Course, meetings: Meeting[]) => void;
}

function CourseCard({
  course,
  expanded,
  onToggleExpand,
  onRemove,
  allMeetingsForCourse,
  otherCourses,
  replaceCourseMeetings,
}: CourseCardProps): JSX.Element {
  const allOptions = React.useMemo(() => groupMeetingOptions(allMeetingsForCourse), [allMeetingsForCourse]);
  const sectionCount = allOptions.length;
  const selectedLabels = React.useMemo(
    () => {
      const selectedKey = getSelectedOptionKey(course.meetings);
      const selectedOption = allOptions.find((option) => option.key === selectedKey);
      return selectedOption ? [`${selectedOption.type} ${selectedOption.section}`] : [];
    },
    [allOptions, course.meetings],
  );

  const otherMeetings = React.useMemo(() => otherCourses.flatMap((otherCourse) => otherCourse.meetings), [otherCourses]);

  const applyOption = React.useCallback(
    (selected: MeetingOption) => {
      replaceCourseMeetings(course, selected.meetings);
    },
    [course, replaceCourseMeetings],
  );

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.14)] dark:border-[#3a3a3a] dark:bg-[#171717]">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <button
          type="button"
          onClick={onToggleExpand}
          className="min-w-0 flex-1 text-left transition-colors hover:text-inherit"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:bg-[#2f2f2f] dark:text-neutral-200">
              {course.id}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              {course.credits} credit{course.credits === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
              Selected
            </span>
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
        </button>

        <div className="flex items-start justify-between gap-3 lg:justify-end">
          <div className="text-left lg:text-right">
            <button type="button" onClick={onToggleExpand} className="text-left lg:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Selected sections
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {selectedLabels.length ? selectedLabels.join(", ") : "Open to review"}
              </p>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full border border-transparent text-rose-600 shadow-none hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
              onClick={onRemove}
              aria-label={`Remove ${course.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={onToggleExpand}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfc9ae] bg-[#f8f2ea] text-[#7a5230] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6]"
              aria-label={expanded ? `Collapse ${course.id}` : `Expand ${course.id}`}
            >
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-slate-200/70 bg-slate-50/60 px-5 py-4 dark:border-[#343434] dark:bg-[#1a1a1a]">
          <div className="space-y-3">
            {allOptions.map((option) => {
              const isSelected = getSelectedOptionKey(course.meetings) === option.key;
              const conflictingMeetings = option.meetings.filter((meeting) => hasScheduleConflict(otherMeetings, meeting));
              const hasConflict = conflictingMeetings.length > 0;

              return (
                <SectionOptionCard
                  key={option.key}
                  onClick={() => applyOption(option)}
                  sectionLabel={`${option.type} ${option.section}`}
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
}

export default function ScheduleList(): JSX.Element {
  const { courses, removeCourse, catalog, catalogStatus, loadCatalog, updateCourse } = useSchedule();
  const [copiedCrn, setCopiedCrn] = React.useState<string | null>(null);
  const [exportOpen, setExportOpen] = React.useState(false);

  React.useEffect(() => {
    if (courses.length > 0 && catalogStatus === "idle") {
      void loadCatalog();
    }
  }, [courses.length, catalogStatus, loadCatalog]);

  const orderRef = React.useRef<Map<string, number>>(new Map());
  React.useEffect(() => {
    const map = orderRef.current;
    let maxIndex = Math.max(-1, ...Array.from(map.values()));
    for (const course of courses) {
      if (!map.has(course.id)) map.set(course.id, ++maxIndex);
    }
    const currentIds = new Set(courses.map((course) => course.id));
    for (const id of Array.from(map.keys())) {
      if (!currentIds.has(id)) map.delete(id);
    }
  }, [courses]);

  const displayCourses = React.useMemo(() => {
    const map = orderRef.current;
    return [...courses].sort((a, b) => (map.get(a.id) ?? 0) - (map.get(b.id) ?? 0));
  }, [courses]);

  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const toggleOpen = React.useCallback(
    (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] })),
    [],
  );

  const replaceCourseMeetings = React.useCallback(
    (course: Course, newMeetings: Meeting[]) => {
      updateCourse({ ...course, meetings: newMeetings });
    },
    [updateCourse],
  );

  const getAllMeetingsForCourse = React.useCallback(
    (courseId: string): Meeting[] =>
      catalog.find((course) => course.id === courseId)?.meetings ||
      courses.find((course) => course.id === courseId)?.meetings ||
      [],
    [catalog, courses],
  );

  const selectedCrns = React.useMemo(
    () =>
      displayCourses
        .map((course) => {
          const meeting = course.meetings[0];
          return meeting?.crn ? { courseId: course.id, courseTitle: course.title, crn: meeting.crn } : null;
        })
        .filter((entry): entry is { courseId: string; courseTitle: string; crn: string } => entry !== null),
    [displayCourses],
  );

  const exportCourses = React.useMemo(() => {
    const catalogById = new Map(catalog.map((course) => [course.id, course]));

    return displayCourses.map((course) => {
      const catalogCourse = catalogById.get(course.id);
      if (!catalogCourse) return course;

      return {
        ...course,
        meetings: course.meetings.map((meeting) => {
          const datedMeeting = catalogCourse.meetings.find(
            (candidate) =>
              candidate.crn === meeting.crn &&
              candidate.type === meeting.type &&
              candidate.section === meeting.section &&
              candidate.start === meeting.start &&
              candidate.end === meeting.end &&
              candidate.days.join("") === meeting.days.join(""),
          );
          return datedMeeting ? { ...meeting, startDate: datedMeeting.startDate, endDate: datedMeeting.endDate } : meeting;
        }),
      };
    });
  }, [catalog, displayCourses]);

  const canExportSchedule = React.useMemo(() => hasExportableMeetings(exportCourses), [exportCourses]);

  const copyCrn = React.useCallback(async (crn: string) => {
    try {
      await navigator.clipboard.writeText(crn);
      setCopiedCrn(crn);
      window.setTimeout(() => {
        setCopiedCrn((current) => (current === crn ? null : current));
      }, 1200);
    } catch {
      setCopiedCrn(null);
    }
  }, []);

  const downloadIcs = React.useCallback(() => {
    if (!canExportSchedule) return;

    const blob = new Blob([buildScheduleIcs(exportCourses)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yacs-schedule.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }, [canExportSchedule, exportCourses]);

  return (
    <div className="w-full space-y-6">
      {displayCourses.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Current CRNs
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCrns.map(({ courseId, courseTitle, crn }) => (
                <button
                  key={crn}
                  type="button"
                  onClick={() => void copyCrn(crn)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-[#3a3a3a] dark:bg-[#1f1f1f] dark:text-neutral-200 dark:hover:border-[#4a4a4a] dark:hover:bg-[#242424]"
                  aria-label={`Copy CRN ${crn} for ${courseId}`}
                  title={`${courseId} ${courseTitle}`}
                >
                  {copiedCrn === crn ? "Copied" : crn}
                </button>
              ))}
            </div>
          </div>

          <Popover open={exportOpen} onOpenChange={setExportOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 self-start rounded-full border-[#dfc9ae] bg-[#f8f2ea] px-4 text-[#7a5230] shadow-none hover:border-[#d5b891] hover:bg-[#efe3d2] hover:text-[#6b4526] disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6] dark:hover:border-[#8a6748] dark:hover:bg-[#4a3223] dark:hover:text-[#fff6ec] dark:disabled:border-[#343434] dark:disabled:bg-[#1f1f1f] dark:disabled:text-[#666666] sm:self-end"
                disabled={!canExportSchedule}
              >
                <Download className="h-4 w-4" />
                Export schedule
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 rounded-2xl border-slate-200 bg-white p-2 shadow-lg dark:border-[#3a3a3a] dark:bg-[#171717]">
              <button
                type="button"
                onClick={downloadIcs}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-neutral-200 dark:hover:bg-[#242424]"
              >
                <CalendarDays className="h-4 w-4" />
                Download ICS
              </button>
            </PopoverContent>
          </Popover>
        </div>
      ) : null}

      {displayCourses.length === 0 ? (
        <div className="mx-auto max-w-6xl rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-950/70">
          <p className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            No classes selected yet.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Use the navbar search to add classes, then review and swap section combinations here.
          </p>
        </div>
      ) : (
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          {displayCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              expanded={!!open[course.id]}
              onToggleExpand={() => toggleOpen(course.id)}
              onRemove={() => removeCourse(course.id)}
              allMeetingsForCourse={getAllMeetingsForCourse(course.id)}
              otherCourses={displayCourses.filter((other) => other.id !== course.id)}
              replaceCourseMeetings={replaceCourseMeetings}
            />
          ))}
        </div>
      )}
    </div>
  );
}
