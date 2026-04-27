import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "@/app/App";
import ClassSectionsPage from "@/features/courses/ClassSectionsPage";
import SubjectBrowserPage from "@/features/courses/SubjectBrowserPage";
import SubjectCoursesPage from "@/features/courses/SubjectCoursesPage";
import SchedulePage from "@/features/schedule/SchedulePage";
import FourYearPlannerPage from "@/features/planner/FourYearPlannerPage";
import ProfilePage from "@/features/profile/ProfilePage";
import LandingAuthPage from "@/features/auth/routes/LandingAuthPage";
import RequireAppAccess from "@/features/auth/components/RequireAppAccess";
import RequireAuthenticated from "@/features/auth/components/RequireAuthenticated";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LandingAuthPage />} />
        <Route element={<RequireAppAccess />}>
          <Route path="/" element={<App />}>
            <Route index element={<SubjectBrowserPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="courses" element={<SubjectBrowserPage />} />
            <Route path="courses/class/:courseId" element={<ClassSectionsPage />} />
            <Route path="courses/:subjectCode" element={<SubjectCoursesPage />} />
            <Route path="planner" element={<FourYearPlannerPage />} />
            <Route element={<RequireAuthenticated />}>
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
