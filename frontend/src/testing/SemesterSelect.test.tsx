import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SemesterSelect from "@/features/schedule/components/SemesterSelect";
import { useSemester } from "@/context/semester/semester-context";

jest.mock("@/context/semester/semester-context", () => ({ useSemester: jest.fn() }));
const mockUseSemester = useSemester as jest.MockedFunction<typeof useSemester>;
const setSelectedSemester = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSemester.mockReturnValue({
    semesters: [{ term: "202609", name: "Fall 2026" }, { term: "202701", name: "Spring 2027" }],
    selectedSemester: "202609", semestersLoading: false, setSelectedSemester,
  });
});

test("shows the active semester and passes changes to the provider", () => {
  render(<SemesterSelect />);
  const picker = screen.getByRole("combobox", { name: "Semester" });
  expect(picker).toHaveValue("202609");
  userEvent.selectOptions(picker, "202701");
  expect(setSelectedSemester).toHaveBeenCalledWith("202701");
});

test("disables selection while semesters load", () => {
  mockUseSemester.mockReturnValue({ ...mockUseSemester(), semestersLoading: true });
  render(<SemesterSelect />);
  expect(screen.getByRole("combobox", { name: "Semester" })).toBeDisabled();
});

test("shows a disabled placeholder when no semesters are available", () => {
  mockUseSemester.mockReturnValue({ ...mockUseSemester(), semesters: [], selectedSemester: "" });
  render(<SemesterSelect />);
  expect(screen.getByRole("combobox", { name: "Semester" })).toBeDisabled();
  expect(screen.getByRole("option", { name: "Semester selection coming soon" })).toBeInTheDocument();
});
