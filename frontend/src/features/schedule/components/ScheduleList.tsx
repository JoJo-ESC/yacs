import * as React from "react";
import type { JSX } from "react";
import { useSchedule } from "@/context/schedule/schedule-context";
import type { Course, Meeting } from "@/types/schedule";
import { Button } from "@/components/ui/button";
import { hasScheduleConflict } from "@/lib/schedule/schedule";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  MapPin, 
  User, 
  AlertCircle, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  CalendarDays,
  CheckCircle2
} from "lucide-react";

// --- Helper Functions ---

function formatDays(ds: string[]) {
  return (ds || []).join("");
}

type MeetingOption = {
  key: string;
  type: string;
  section: string;
  meetings: Meeting[];
};

function groupMeetingOptions(meetings: Meeting[]) {
  const byType: Record<string, MeetingOption[]> = {};

  for (const meeting of meetings) {
    const key = `${meeting.type}::${meeting.section}::${meeting.crn}`;
    const options = (byType[meeting.type] ||= []);
    const existing = options.find((option) => option.key === key);

    if (existing) {
      existing.meetings.push(meeting);
      continue;
    }

    options.push({
      key,
      type: meeting.type,
      section: meeting.section,
      meetings: [meeting],
    });
  }

  return Object.fromEntries(
    Object.entries(byType).map(([type, options]) => [
      type,
      [...options].sort((a, b) =>
        String(a.section).localeCompare(String(b.section), undefined, { numeric: true }),
      ),
    ]),
  );
}

function getSelectedOptionKey(meetings: Meeting[], type: string) {
  const selectedMeeting = meetings.find((meeting) => meeting.type === type);
  if (!selectedMeeting) return null;
  return `${selectedMeeting.type}::${selectedMeeting.section}::${selectedMeeting.crn}`;
}

// --- Sub-Components ---

interface SectionRowProps {
  meeting: Meeting;
  isSelected: boolean;
  onSelect: () => void;
  hasConflict: boolean;
  disabled?: boolean;
}

function SectionRow({
  meeting,
  isSelected,
  onSelect,
  hasConflict,
  disabled,
}: SectionRowProps): JSX.Element {
  return (
    <Button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      variant="ghost" 
      className={cn(
        "relative flex h-auto w-full flex-col items-start gap-2 rounded-[20px] border p-3 text-left transition-all",
        "border-slate-200 bg-white shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)] hover:border-[#d8c3aa] hover:bg-[#fbf7f1] dark:border-[#3a3a3a] dark:bg-[#1f1f1f] dark:hover:border-[#6d4f36] dark:hover:bg-[#2a221d]",
        isSelected && "border-[#dfc9ae] bg-[#f8f2ea] ring-1 ring-[#dfc9ae] dark:border-[#6d4f36] dark:bg-[#3a281d]",
        hasConflict && !isSelected && "border-rose-200 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/20",
        hasConflict && isSelected && "border-rose-300 bg-rose-50 ring-rose-300 dark:border-rose-900 dark:bg-rose-950/30",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
           {/* Checkbox circle visual */}
          <div className={cn(
            "h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
            isSelected ? "border-[#9b6b3f] bg-[#9b6b3f] text-white dark:border-[#f4e6d6] dark:bg-[#f4e6d6] dark:text-[#3a281d]" : "border-muted-foreground/30 bg-transparent"
          )}>
            {isSelected && <CheckCircle2 className="h-3 w-3" />}
          </div>
          <span className={cn(
            "font-semibold text-sm",
            isSelected ? "text-[#7a5230] dark:text-[#f4e6d6]" : "text-foreground",
            hasConflict && "text-red-600 dark:text-red-400"
          )}>
            {meeting.type} {meeting.section}
          </span>
        </div>
        
        {hasConflict && (
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            <AlertCircle className="h-3 w-3" />
            <span>Conflict</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1.5 pl-6 text-xs text-muted-foreground w-full">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="font-medium text-foreground/80">
            {formatDays(meeting.days)}
          </span>
          <span className="opacity-30">|</span>
          <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span>{meeting.start}–{meeting.end}</span>
        </div>

        {(meeting.location || meeting.instructor) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {meeting.location && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{meeting.location}</span>
              </div>
            )}
            {meeting.instructor && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{meeting.instructor}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Button>
  );
}

interface CourseCardProps {
  course: Course;
  expanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  allMeetingsForCourse: Meeting[];
  otherCourses: Course[];
  replaceCourseMeetings: (c: Course, m: Meeting[]) => void;
}

function CourseCard({
  course,
  expanded,
  onToggleExpand,
  onRemove,
  allMeetingsForCourse,
  otherCourses,
  replaceCourseMeetings
}: CourseCardProps) {
  
  const allByType = groupMeetingOptions(allMeetingsForCourse);

  const otherMeetings = otherCourses.flatMap(c => c.meetings);
  const isStrictConflict = 
    otherMeetings.length > 0 &&
    allMeetingsForCourse.length > 0 &&
    allMeetingsForCourse.every((m) => hasScheduleConflict(otherMeetings, m));

  const selectedLabels = Object.keys(allByType)
    .map((type) => {
      const selectedKey = getSelectedOptionKey(course.meetings, type);
      const selectedOption = allByType[type]?.find((option) => option.key === selectedKey);
      return selectedOption ? `${selectedOption.type}-${selectedOption.section}` : null;
    })
    .filter(Boolean) as string[];

  const onPickSection = (type: string, selected: MeetingOption) => {
    const others = course.meetings.filter((m) => m.type !== type);
    replaceCourseMeetings(course, [...others, ...selected.meetings]);
  };

  return (
    <div className={cn(
      "overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.14)] transition-all dark:border-[#3a3a3a] dark:bg-[#171717]"
    )}>
      <div
        className="flex cursor-pointer items-start justify-between gap-4 p-5 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03]"
        onClick={onToggleExpand}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 dark:bg-[#303030] dark:text-neutral-200">
              {course.id}
            </span>
            <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-3 py-1 text-xs font-semibold app-text-muted">
              {Object.keys(allByType).length} section type{Object.keys(allByType).length === 1 ? "" : "s"}
            </span>
            {course.meetings.length > 0 && (
              <span className="rounded-full border border-[#dfc9ae] bg-[#f8f2ea] px-3 py-1 text-xs font-semibold text-[#7a5230] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6]">
                {selectedLabels.length > 0 ? `Selected: ${selectedLabels.join(", ")}` : "Sections selected"}
              </span>
            )}
            {isStrictConflict && (
              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                Conflict
              </span>
            )}
          </div>
          <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {course.title}
          </h3>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {expanded ? "Review and swap section combinations below." : "Open to review or change sections."}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start pl-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full border border-transparent text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/30 dark:hover:text-rose-200"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfc9ae] bg-[#f8f2ea] text-[#7a5230] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6]">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200/70 bg-slate-50/60 px-5 py-4 dark:border-[#343434] dark:bg-[#1a1a1a]">
          {Object.keys(allByType).length === 0 ? (
            <p className="text-sm italic text-slate-500 dark:text-slate-400">No section data available.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(allByType).map(([type, options]) => {
                const selectedKey = getSelectedOptionKey(course.meetings, type);

                const sectionsOfOtherTypes = course.meetings.filter(m => m.type !== type);
                const allCheckMeetings = [...sectionsOfOtherTypes, ...otherMeetings];

                return (
                  <div key={`${course.id}-${type}`} className="flex min-w-0 flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {type} sections
                      </span>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-[#343434]" />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {options.map((opt) => {
                        const conflicts = opt.meetings.some((meeting) =>
                          hasScheduleConflict(allCheckMeetings, meeting)
                        );
                        const isSelected = selectedKey === opt.key;

                        return (
                          <SectionRow
                            key={`${course.id}-${type}-${opt.section}`}
                            meeting={opt.meetings[0]}
                            isSelected={isSelected}
                            hasConflict={conflicts}
                            onSelect={() => onPickSection(type, opt)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Component ---

export default function ScheduleList(): JSX.Element {
  const { courses, removeCourse, clear, catalog, catalogStatus, loadCatalog, addCourse } = useSchedule();

  React.useEffect(() => {
    if (courses.length > 0 && catalogStatus === "idle") {
      void loadCatalog();
    }
  }, [courses.length, catalogStatus, loadCatalog]);

  const orderRef = React.useRef<Map<string, number>>(new Map());
  React.useEffect(() => {
    const map = orderRef.current;
    let maxIndex = Math.max(-1, ...Array.from(map.values()));
    for (const c of courses) {
      if (!map.has(c.id)) map.set(c.id, ++maxIndex);
    }
    const currentIds = new Set(courses.map(c => c.id));
    for (const id of Array.from(map.keys())) {
      if (!currentIds.has(id)) map.delete(id);
    }
  }, [courses]);

  const displayCourses = React.useMemo(() => {
    const map = orderRef.current;
    return [...courses].sort((a, b) => (map.get(a.id) ?? 0) - (map.get(b.id) ?? 0));
  }, [courses]);

  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const toggleOpen = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const replaceCourseMeetings = (course: Course, newMeetings: Meeting[]) => {
    removeCourse(course.id);
    addCourse({ ...course, meetings: newMeetings });
  };

  const getAllMeetingsForCourse = (courseId: string): Meeting[] => {
    return catalog.find((c) => c.id === courseId)?.meetings || [];
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Your schedule</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {displayCourses.length} {displayCourses.length === 1 ? 'course' : 'courses'} selected
          </p>
        </div>
        {displayCourses.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clear}
            className="rounded-full border-[#dfc9ae] bg-[#f8f2ea] px-4 text-[#7a5230] shadow-none hover:bg-[#efe3d2] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6] dark:hover:bg-[#4a3223]"
          >
            Clear all
          </Button>
        )}
      </div>

      {displayCourses.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-950/70">
          <p className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            No classes selected yet.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Use the navbar search to add classes, then review and swap section combinations here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayCourses.map((c) => (
            <CourseCard 
              key={c.id}
              course={c}
              expanded={!!open[c.id]}
              onToggleExpand={() => toggleOpen(c.id)}
              onRemove={() => removeCourse(c.id)}
              allMeetingsForCourse={getAllMeetingsForCourse(c.id)}
              otherCourses={displayCourses.filter(other => other.id !== c.id)}
              replaceCourseMeetings={replaceCourseMeetings}
            />
          ))}
        </div>
      )}
    </div>
  );
}
