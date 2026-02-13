import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "@/app/App";
import HomePage from "@/features/schedule/routes/HomePage";
import FourYearPlannerPage from "@/features/planner/routes/FourYearPlannerPage";
import ProfilePage from "@/features/profile/routes/ProfilePage";
import LandingAuthPage from "@/features/auth/routes/LandingAuthPage";
import RequireAppAccess from "@/features/auth/components/RequireAppAccess";
import RequireAuthenticated from "@/features/auth/components/RequireAuthenticated";
import { Navigate } from "react-router-dom";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingAuthPage />} />
        <Route element={<RequireAppAccess />}>
          <Route path="/app" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="planner" element={<FourYearPlannerPage />} />
            <Route element={<RequireAuthenticated />}>
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
