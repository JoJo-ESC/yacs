import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

const mockSetSemester = jest.fn();
jest.mock("@/context/semester/semester-context", () => ({useSemester: () => ({semesters: [{term: "202609", name: "Fall 2026"}, {term: "202701", name: "Spring 2027"}], selectedSemester: "202609", setSelectedSemester: mockSetSemester, semestersLoading: false})}));
jest.mock("@/features/schedule/components/ClassSearch", () => () => <input aria-label="Search classes" />);
jest.mock("@/features/courses/components/SubjectNavSearch", () => ({SubjectNavSearch: () => <input aria-label="Search subjects" />}));
jest.mock("@/components/theme/ThemeToggle", () => () => <button>Toggle theme</button>);

test("upstream mobile menu navigates to the schedule and closes", () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>);
  userEvent.click(screen.getByRole("button", {name: "Open menu"}));
  const menu = screen.getByRole("navigation", {name: "Main"});
  const schedule = within(menu).getByRole("link", {name: "Schedule"});
  expect(schedule).toHaveAttribute("href", "/schedule");
  userEvent.click(schedule);
  expect(screen.queryByRole("navigation", {name: "Main"})).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", {name: "Search classes"})).toBeInTheDocument();
});

test("mobile semester picker uses the upstream semester provider and Escape closes the menu", () => {
  render(<MemoryRouter><Navbar /></MemoryRouter>);
  userEvent.click(screen.getByRole("button", {name: "Open menu"}));
  userEvent.selectOptions(within(screen.getByRole("navigation", {name: "Main"})).getByRole("combobox"), "202701");
  expect(mockSetSemester).toHaveBeenCalledWith("202701");
  userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("navigation", {name: "Main"})).not.toBeInTheDocument();
});
