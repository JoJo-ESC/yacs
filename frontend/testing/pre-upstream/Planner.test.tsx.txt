import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FourYearPlannerPage from "@/features/planner/routes/FourYearPlannerPage";

afterEach(() => localStorage.clear());

test("adds a requirement course to a chosen term without dragging and persists removal", () => {
  const { unmount } = render(<FourYearPlannerPage />);
  userEvent.selectOptions(screen.getByLabelText("Course"), "PHIL-2140");
  userEvent.selectOptions(screen.getByLabelText("Term"), "SUMMER 2025");
  userEvent.click(screen.getByRole("button", { name: "Add course" }));
  expect(screen.getByRole("status")).toHaveTextContent("Added PHIL-2140 to SUMMER 2025.");
  expect(JSON.parse(localStorage.getItem("four_year_plan_v1")!)["SUMMER 2025"]).toEqual([
    expect.objectContaining({ id: "PHIL-2140" }),
  ]);
  unmount();
  render(<FourYearPlannerPage />);
  userEvent.click(screen.getByRole("button", { name: "Remove PHIL-2140 from SUMMER 2025" }));
  expect(JSON.parse(localStorage.getItem("four_year_plan_v1")!)["SUMMER 2025"]).toEqual([]);
});

test("the ADD shortcut focuses the accessible course picker", () => {
  render(<FourYearPlannerPage />);
  userEvent.click(screen.getByRole("button", { name: "ADD +" }));
  expect(screen.getByLabelText("Course")).toHaveFocus();
  expect(within(screen.getByLabelText("Course")).getAllByRole("option")).toHaveLength(15);
});
