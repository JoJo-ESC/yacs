import React from "react";
import ScheduleList from "../components/ScheduleList";
import WeekScheduler from "../components/WeekScheduler";
import DepartmentBrowser from "../components/DepartmentBrowser";
import { useSchedule } from "../context/schedule-context";

export default function HomePage() {
  const { selectedSemester } = useSchedule();

  return (
    <main className="flex-1 p-4">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Schedule</h1>
          <p className="text-sm text-muted-foreground">Semester: {selectedSemester}</p>
        </div>
      </div>

      <DepartmentBrowser />

      <div className="mt-8 space-y-6">
        <WeekScheduler events={[]} startHour={8} endHour={20} showWeekend={false} />
        <ScheduleList />
      </div>
    </main>
  );
}
