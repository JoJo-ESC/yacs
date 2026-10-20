import React from "react";
  import { AppThemeProvider } from "@/components/theme/ThemeProvider";           
  import { ScheduleProvider } from "@/context/schedule/schedule-context";
  import { SemesterProvider } from "@/context/semester/semester-context";
  import { AuthProvider } from "@/features/auth/context/AuthContext";               
   
  export function AppProviders({ children }: { children: React.ReactNode }) {       
    return (           
      <AppThemeProvider>
        <AuthProvider>
          <SemesterProvider>                                                        
            <ScheduleProvider>{children}</ScheduleProvider>
          </SemesterProvider>                                                       
        </AuthProvider>
      </AppThemeProvider>
    );
  }
