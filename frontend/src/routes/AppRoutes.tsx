import React from "react";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import App from "@/app/App";
import LoginPage from "@/features/auth/routes/LoginPage";
import ErrorBoundary from "@/components/ErrorBoundary";
import FinalsPage from "@/features/finals/routes/FinalsPage";
import HomePage from "@/features/schedule/routes/HomePage";
import FourYearPlannerPage from "@/features/planner/routes/FourYearPlannerPage";
import ProfilePage from "@/features/profile/routes/ProfilePage";
import ProfessorsPage from "@/features/professors/routes/ProfessorsPage";
import ProfessorDetailPage from "@/features/professors/routes/ProfessorDetailPage";
import NotFoundPage from "@/pages/NotFoundPage";

type AppRoutesProps = {
  initialEntries?: string[];
};

export function AppRoutes({ initialEntries }: AppRoutesProps) {
  const Router = initialEntries ? MemoryRouter : BrowserRouter;
  const routerProps = initialEntries ? { initialEntries } : {};

  return (
    <Router {...routerProps}>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="finals" element={<FinalsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="planner" element={<FourYearPlannerPage />} />
            <Route path="professors" element={<ProfessorsPage />} />
            <Route path="professors/:professorSlug" element={<ProfessorDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
