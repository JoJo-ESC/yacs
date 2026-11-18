import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionOptionCard } from "@/features/courses/components/SectionOptionCard";
import { makeMeeting } from "./scheduleFixtures";

const props = {
  sectionLabel: "LEC 01", instructor: "Dr. Test", crn: "12345",
  seatsAvailable: 1, enrolled: 29, maxEnroll: 30, meetings: [makeMeeting()],
  isSelected: false, hasConflict: false, onClick: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

test("displays section details, seat count, and meeting times", () => {
  render(<SectionOptionCard {...props} />);
  expect(screen.getByText("LEC 01")).toBeInTheDocument();
  expect(screen.getByText(/Dr. Test.*CRN 12345/)).toBeInTheDocument();
  expect(screen.getByText("1 seat available")).toBeInTheDocument();
  expect(screen.getByText("29/30 enrolled")).toBeInTheDocument();
  expect(screen.getByTitle("M 09:00AM-09:50AM • DCC 308")).toBeInTheDocument();
  expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  expect(screen.queryByText("Time conflict")).not.toBeInTheDocument();
});

test("displays selection and conflict status together", () => {
  render(<SectionOptionCard {...props} isSelected hasConflict />);
  expect(screen.getByText("Selected")).toBeInTheDocument();
  expect(screen.getByText("Time conflict")).toBeInTheDocument();
});

test("supports keyboard activation", () => {
  render(<SectionOptionCard {...props} />);
  userEvent.tab();
  expect(screen.getByRole("button")).toHaveFocus();
  userEvent.keyboard("{Enter}");
  expect(props.onClick).toHaveBeenCalledTimes(1);
});

test("renders missing instructor, unknown capacity, and unscheduled times", () => {
  render(<SectionOptionCard {...props} instructor="" crn="" maxEnroll={0} seatsAvailable={0}
    meetings={[makeMeeting({ start: "", end: "", days: ["M", "S"], location: "" })]} />);
  expect(screen.getByText("Instructor TBA")).toBeInTheDocument();
  expect(screen.getByText("29/? enrolled")).toBeInTheDocument();
  expect(screen.getByText("0 seats available")).toBeInTheDocument();
  expect(screen.getByText("Time TBA")).toBeInTheDocument();
});
