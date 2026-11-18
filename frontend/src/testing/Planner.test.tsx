import React from "react";
import { render, screen } from "@testing-library/react";
import FourYearPlannerPage from "@/features/planner/FourYearPlannerPage";

jest.mock("@/features/auth/hooks/useAuth", () => ({useAuth: () => ({user: {entryYear: 2026}})}));
jest.mock("@/lib/analytics", () => ({track: jest.fn()}));
jest.mock("@/api/client", () => ({apiFetch: () => Promise.reject(new Error("Offline"))}));

afterEach(() => localStorage.clear());

test("upstream planner preserves compatible locally saved courses when offline", async () => {
  localStorage.setItem("four_year_plan_v1", JSON.stringify({"FALL 2026": [{id: "CSCI-1100", title: "Computer Science 1", credits: 4, key: "saved"}]}));
  render(<FourYearPlannerPage />);
  expect(await screen.findByText("CSCI-1100")).toBeInTheDocument();
  expect(screen.getByText("FALL 2026")).toBeInTheDocument();
});
