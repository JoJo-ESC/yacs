import React from "react";
import { useSchedule } from "../context/schedule-context";

function getSemesterOptions(semesters: string[]) {
  if (semesters.length > 0) return semesters;
  return ["Semester selection coming soon"];
}

export default function SemesterSelect() {
  const { availableSemesters, catalogLoading, selectedSemester, setSelectedSemester } = useSchedule();
  const options = React.useMemo(() => getSemesterOptions(availableSemesters), [availableSemesters]);
  const disabled = catalogLoading || availableSemesters.length === 0;

  return (
    <label className="flex items-center gap-2 text-sm text-input-foreground">
      <span className="hidden md:inline">Semester</span>
      <select
        aria-label="Semester"
        className="h-9 min-w-44 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={disabled}
        value={selectedSemester || options[0] || ""}
        onChange={(event) => setSelectedSemester(event.target.value)}
      >
        {options.map((semester) => (
          <option key={semester} value={semester}>
            {semester}
          </option>
        ))}
      </select>
    </label>
  );
}
