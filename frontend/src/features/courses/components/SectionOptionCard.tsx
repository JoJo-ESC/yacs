import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import type { Meeting } from "@/types/schedule";
import { cn } from "@/lib/utils";

const WEEK_DAYS = [
  { key: "M", label: "M" },
  { key: "T", label: "T" },
  { key: "W", label: "W" },
  { key: "R", label: "R" },
  { key: "F", label: "F" },
] as const;

function getMeetingKey(meeting: Meeting) {
  return `${meeting.type}::${meeting.section}::${meeting.crn}::${meeting.start}::${meeting.end}`;
}

function MiniWeekPreview({
  meetings,
  conflictingMeetingKeys,
}: {
  meetings: Meeting[];
  conflictingMeetingKeys: Set<string>;
}) {
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
              {(meetingsByDay.get(day.key) ?? []).length > 0
                ? (meetingsByDay.get(day.key) ?? []).map((meeting, index) => (
                    <div
                      key={`${day.key}-${meeting.start}-${meeting.end}-${index}`}
                      className={cn(
                        "rounded-full border px-2 py-1 text-center text-[10px] font-semibold shadow-sm",
                        conflictingMeetingKeys.has(getMeetingKey(meeting))
                          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
                          : "border-[#7cc9ff] bg-sky-100/90 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100",
                      )}
                      title={`${day.label} ${meeting.start}-${meeting.end}${meeting.location ? ` • ${meeting.location}` : ""}`}
                    >
                      {meeting.start && meeting.end ? `${meeting.start} - ${meeting.end}` : "Time TBA"}
                    </div>
                  ))
                : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getSeatTone(seatsAvailable: number, maxEnroll: number) {
  if (maxEnroll <= 0) return "text-slate-600 dark:text-slate-300";
  if (seatsAvailable <= 0) return "text-rose-700 dark:text-rose-300";
  if (seatsAvailable <= Math.max(2, Math.round(maxEnroll * 0.1))) return "text-amber-700 dark:text-amber-300";
  return "text-emerald-700 dark:text-emerald-300";
}

type SectionOptionCardProps = {
  sectionLabel: string;
  instructor?: string;
  crn?: string;
  seatsAvailable: number;
  enrolled: number;
  maxEnroll: number;
  meetings: Meeting[];
  isSelected: boolean;
  hasConflict: boolean;
  conflictingMeetingKeys?: string[];
  onClick: () => void;
};

export function SectionOptionCard({
  sectionLabel,
  instructor,
  crn,
  seatsAvailable,
  enrolled,
  maxEnroll,
  meetings,
  isSelected,
  hasConflict,
  conflictingMeetingKeys = [],
  onClick,
}: SectionOptionCardProps) {
  const seatTone = getSeatTone(seatsAvailable, maxEnroll);
  const conflictingMeetingKeySet = React.useMemo(() => new Set(conflictingMeetingKeys), [conflictingMeetingKeys]);

  return (
    <button
      type="button"
      onClick={onClick}
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
                {sectionLabel}
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
              {instructor || "Instructor TBA"}
              {crn ? ` • CRN ${crn}` : ""}
            </p>
          </div>

          <div className="text-right">
            <p className={cn("text-sm font-semibold", seatTone)}>
              {seatsAvailable} seat{seatsAvailable === 1 ? "" : "s"} available
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {enrolled}/{maxEnroll || "?"} enrolled
            </p>
          </div>
        </div>

        <MiniWeekPreview meetings={meetings} conflictingMeetingKeys={conflictingMeetingKeySet} />
      </div>
    </button>
  );
}
