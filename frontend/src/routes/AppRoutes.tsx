import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "@/app/App";
import SubjectBrowserPage from "@/features/courses/SubjectBrowserPage";
import SubjectCoursesPage from "@/features/courses/SubjectCoursesPage";
import HomePage from "@/features/schedule/HomePage";
import FourYearPlannerPage from "@/features/planner/FourYearPlannerPage";
import ProfilePage from "@/features/profile/ProfilePage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<SubjectBrowserPage />} />
          <Route path="schedule" element={<HomePage />} />
          <Route path="courses" element={<SubjectBrowserPage />} />
          <Route path="courses/:subjectCode" element={<SubjectCoursesPage />} />
          <Route path="planner" element={<FourYearPlannerPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
