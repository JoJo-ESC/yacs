import React from "react";
import { useSchedule } from "../context/schedule-context";

function getSemesterOptions(semesters: string[]) {
  if (semesters.length > 0) return semesters;
  return ["Semester selection coming soon"];
}

export default function SemesterSelect() {
  const { catalog, catalogLoading } = useSchedule();

  const semesters = React.useMemo(() => {
    const values = new Set<string>();

    for (const course of catalog) {
      for (const meeting of course.meetings) {
        const semester = meeting.semester?.trim();
        if (semester) values.add(semester);
      }
    }

    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [catalog]);

  const options = React.useMemo(() => getSemesterOptions(semesters), [semesters]);
  const [selectedSemester, setSelectedSemester] = React.useState(options[0] ?? "");

  React.useEffect(() => {
    setSelectedSemester(options[0] ?? "");
  }, [options]);

  const disabled = catalogLoading || semesters.length === 0;

  return (
    <label className="flex items-center gap-2 text-sm text-input-foreground">
      <span className="hidden md:inline">Semester</span>
      <select
        aria-label="Semester"
        className="h-9 min-w-44 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={disabled}
        value={selectedSemester}
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
