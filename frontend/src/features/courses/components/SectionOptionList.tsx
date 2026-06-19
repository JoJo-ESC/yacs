import * as React from "react";
import { Zap, ZapOff } from "lucide-react";
import { hasScheduleConflict } from "@/lib/schedule/schedule";
import type { Meeting } from "@/types/schedule";
import { cn } from "@/lib/utils";
import { SectionOptionCard } from "./SectionOptionCard";

export type SectionOption = {
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

export function groupMeetingOptions(meetings: Meeting[]): SectionOption[] {
  const options: SectionOption[] = [];

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
    a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: "base" }),
  );
}

export function getMeetingKey(meeting: Meeting) {
  return `${meeting.type}::${meeting.section}::${meeting.crn}::${meeting.start}::${meeting.end}`;
}

export function getSelectedOptionKey(meetings: Meeting[]) {
  const first = meetings[0];
  if (!first) return null;
  return `${first.type}::${first.section}::${first.crn}`;
}

export function isMultiSectionSelected(meetings: Meeting[]) {
  return new Set(meetings.map((m) => `${m.type}::${m.section}::${m.crn}`)).size > 1;
}

interface SectionOptionListProps {
  options: SectionOption[];
  selectedMeetings: Meeting[];
  otherMeetings: Meeting[];
  onApplyOption: (option: SectionOption) => void;
  onApplyAllNonConflicting: (nonConflictingOptions: SectionOption[], isAllSelected: boolean) => void;
}

export function SectionOptionList({
  options,
  selectedMeetings,
  otherMeetings,
  onApplyOption,
  onApplyAllNonConflicting,
}: SectionOptionListProps) {
  const nonConflictingOptions = React.useMemo(
    () => options.filter((opt) => !opt.meetings.some((m) => hasScheduleConflict(otherMeetings, m))),
    [options, otherMeetings],
  );

  const selectedMeetingKeys = React.useMemo(
    () => new Set(selectedMeetings.map(getMeetingKey)),
    [selectedMeetings],
  );

  const allNonConflictingKeys = React.useMemo(
    () => new Set(nonConflictingOptions.flatMap((opt) => opt.meetings.map(getMeetingKey))),
    [nonConflictingOptions],
  );

  const isAllSelected =
    allNonConflictingKeys.size > 0 &&
    allNonConflictingKeys.size === selectedMeetingKeys.size &&
    Array.from(allNonConflictingKeys).every((k) => selectedMeetingKeys.has(k));

  const isMulti = isMultiSectionSelected(selectedMeetings);
  const singleSelectedKey = isMulti ? null : getSelectedOptionKey(selectedMeetings);

  return (
    <>
      {nonConflictingOptions.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {nonConflictingOptions.length} section{nonConflictingOptions.length === 1 ? "" : "s"} available
          </p>
          <button
            type="button"
            onClick={() => onApplyAllNonConflicting(nonConflictingOptions, isAllSelected)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              isAllSelected
                ? "border-sky-300 bg-sky-100 text-sky-700 hover:bg-sky-200 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200 dark:hover:bg-sky-900/60"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#d8c3aa] hover:bg-[#fbf7f1] dark:border-[#3a3a3a] dark:bg-[#2a2a2a] dark:text-slate-300 dark:hover:border-[#6d4f36] dark:hover:bg-[#2a221d]",
            )}
          >
            {isAllSelected ? (
              <>
                <ZapOff className="h-3.5 w-3.5" />
                Deselect all
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Select all available
              </>
            )}
          </button>
        </div>
      )}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = isAllSelected
            ? nonConflictingOptions.some((o) => o.key === option.key)
            : singleSelectedKey === option.key;
          const conflictingMeetings = option.meetings.filter((m) => hasScheduleConflict(otherMeetings, m));

          return (
            <SectionOptionCard
              key={option.key}
              onClick={() => onApplyOption(option)}
              sectionLabel={`${option.type} ${option.section}`}
              instructor={option.instructor}
              crn={option.crn}
              seatsAvailable={option.seatsAvailable}
              enrolled={option.enrolled}
              maxEnroll={option.maxEnroll}
              meetings={option.meetings}
              isSelected={isSelected}
              hasConflict={conflictingMeetings.length > 0}
              conflictingMeetingKeys={conflictingMeetings.map(getMeetingKey)}
            />
          );
        })}
      </div>
    </>
  );
}
