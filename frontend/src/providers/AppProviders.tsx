import React from "react";
import { AppThemeProvider } from "@/components/theme/ThemeProvider";
import { ScheduleProvider } from "@/features/schedule/context/schedule-context";
import { AuthProvider } from "@/features/auth/context/AuthContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <ScheduleProvider>{children}</ScheduleProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
