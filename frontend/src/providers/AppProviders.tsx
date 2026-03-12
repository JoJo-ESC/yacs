import React from "react";
import { AppThemeProvider } from "@/components/theme/ThemeProvider";
import { ScheduleProvider } from "@/context/schedule-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <ScheduleProvider>{children}</ScheduleProvider>
    </AppThemeProvider>
  );
}
