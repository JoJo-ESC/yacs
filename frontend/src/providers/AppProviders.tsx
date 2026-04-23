import React from "react";
import { AppThemeProvider } from "@/components/theme/ThemeProvider";
import { ScheduleProvider } from "@/context/schedule/schedule-context";
import { SemesterProvider } from "@/context/semester/semester-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <SemesterProvider>
        <ScheduleProvider>{children}</ScheduleProvider>
      </SemesterProvider>
    </AppThemeProvider>
  );
}
