import * as React from "react";
import type { JSX } from "react";
import { useSchedule } from "../context/schedule-context";
import type { Course, Meeting } from "../types/schedule";
import { Button } from "@/components/ui/button";
import { hasScheduleConflict } from "../utils/schedule";
import { downloadScheduleIcs, printSchedulePdf } from "../utils/exportSchedule";
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
        "relative flex h-auto w-full flex-col items-start gap-2 rounded-md border p-3 text-left transition-all shadow-sm",
        
        // DEFAULT STATE: Pop off the page using bg-background
        "bg-background border-transparent hover:border-border hover:shadow-md",

        // SELECTED STATE: Use a soft blue to match your footer vibe
        isSelected && "border-blue-400/50 bg-blue-50/80 ring-1 ring-blue-400/50 dark:bg-blue-900/20 dark:border-blue-700",

        // CONFLICT STATE
        hasConflict && !isSelected && "opacity-70 bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30",
        hasConflict && isSelected && "bg-red-50 border-red-500 ring-red-500 dark:bg-red-900/30",
        
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
           {/* Checkbox circle visual */}
          <div className={cn(
            "h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
            isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-muted-foreground/30 bg-transparent"
          )}>
            {isSelected && <CheckCircle2 className="h-3 w-3" />}
          </div>
          <span className={cn(
            "font-semibold text-sm",
            isSelected ? "text-blue-700 dark:text-blue-300" : "text-foreground",
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
  
  const groupByType = (meetings: Meeting[]) => {
    return meetings.reduce<Record<string, Meeting[]>>((acc, m) => {
      (acc[m.type] ||= []).push(m);
      return acc;
    }, {});
  };

  const allByType = groupByType(allMeetingsForCourse);
  const currentByType = groupByType(course.meetings);

  const otherMeetings = otherCourses.flatMap(c => c.meetings);
  const isStrictConflict = 
    otherMeetings.length > 0 &&
    allMeetingsForCourse.length > 0 &&
    allMeetingsForCourse.every((m) => hasScheduleConflict(otherMeetings, m));

  const onPickSection = (type: string, selected: Meeting) => {
    const others = course.meetings.filter((m) => m.type !== type);
    replaceCourseMeetings(course, [...others, selected]);
  };

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border border-border transition-all",
      // Use User's 'surface' variable for the header background
      "bg-surface" 
    )}>
      {/* Card Header */}
      <div 
        className="flex cursor-pointer items-center justify-between p-3 md:p-4 hover:brightness-95 transition-all"
        onClick={onToggleExpand}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground truncate text-base">
              {course.id} <span className="opacity-40 font-normal">|</span> {course.title}
            </h3>
            {isStrictConflict && (
              <span className="inline-flex items-center rounded-md bg-red-100/80 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-900">
                CONFLICT
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/60">
             <span>
               {Object.keys(allByType).length} Section Types
             </span>
             {course.meetings.length > 0 && (
                 <>
                 <span>•</span>
                 <span className="text-foreground/80 font-medium">
                    Selected: {course.meetings.map(m => `${m.type}-${m.section}`).join(", ")}
                 </span>
                 </>
             )}
          </div>
        </div>

        <div className="flex items-center gap-1 pl-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground/50 hover:text-red-600 hover:bg-red-100/50"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/50">
             {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Content - Uses 'bg-background' to create contrast against 'bg-surface' */}
      {expanded && (
        <div className="border-t border-border/50 bg-background/50 p-4 shadow-inner">
          {Object.keys(allByType).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No section data available.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(allByType).map(([type, options]) => {
                const current = (currentByType[type] || [])[0] as Meeting | undefined;
                const sortedOptions = [...options].sort((a, b) =>
                  String(a.section).localeCompare(String(b.section), undefined, { numeric: true })
                );

                const sectionsOfOtherTypes = course.meetings.filter(m => m.type !== type);
                const allCheckMeetings = [...sectionsOfOtherTypes, ...otherMeetings];

                return (
                  <div key={`${course.id}-${type}`} className="flex flex-col gap-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                        {type} Sections
                      </span>
                      <div className="h-px flex-1 bg-border/50"></div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {sortedOptions.map((opt) => {
                        const conflicts = hasScheduleConflict(allCheckMeetings, opt);
                        const isSelected = current
                          ? current.section === opt.section && current.type === opt.type
                          : false;

                        return (
                          <SectionRow
                            key={`${course.id}-${type}-${opt.section}`}
                            meeting={opt}
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

function CourseCardSkeleton({ index }: { index: number }) {
  return (
    <div
      aria-hidden="true"
      data-testid="course-card-skeleton"
      className="overflow-hidden rounded-xl border border-border bg-surface"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="animate-pulse p-3 md:p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-5 w-3/5 rounded bg-background/70" />
            <div className="h-3 w-2/5 rounded bg-background/50" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-md bg-background/60" />
            <div className="h-8 w-8 rounded-md bg-background/60" />
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 bg-background/40 p-4">
        <div className="space-y-3">
          <div className="h-3 w-28 rounded bg-surface/80" />
          <div className="grid gap-2 md:grid-cols-2">
            <div className="h-16 rounded-lg bg-surface/80" />
            <div className="h-16 rounded-lg bg-surface/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function ScheduleList(): JSX.Element {
  const { courses, removeCourse, clear, catalog, catalogLoading, addCourse } = useSchedule();

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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Your Schedule</h2>
          <p className="text-sm text-muted-foreground">
            {catalogLoading
              ? "Loading saved courses and section details"
              : `${displayCourses.length} ${displayCourses.length === 1 ? "course" : "courses"} selected`}
          </p>
        </div>
        {displayCourses.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => printSchedulePdf(displayCourses)}
              className="border-border text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadScheduleIcs(displayCourses)}
              className="border-border text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              Export ICS
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clear}
              className="border-border text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {catalogLoading ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-foreground/70">Course cards will appear here as soon as the catalog finishes loading.</p>
          {[0, 1, 2].map((index) => (
            <CourseCardSkeleton key={index} index={index} />
          ))}
        </div>
      ) : displayCourses.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/30 text-center">
          <p className="text-sm text-muted-foreground">No classes selected yet.</p>
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
