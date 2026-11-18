import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  SectionOptionList, groupMeetingOptions, getSelectedOptionKey, isMultiSectionSelected,
} from "@/features/courses/components/SectionOptionList";
import { makeMeeting } from "./scheduleFixtures";

const first = makeMeeting();
const second = makeMeeting({ section: "02", crn: "22222", start: "10:00AM", end: "10:50AM" });
const options = groupMeetingOptions([first, second]);

test("groups meetings by type, section, and CRN without mutating the input", () => {
  const meetings = [
    makeMeeting({ section: "10", crn: "10" }),
    makeMeeting({ section: "2", crn: "2", instructor: "" }),
    makeMeeting({ section: "2", crn: "2", days: ["F"], instructor: "Lab instructor" }),
    makeMeeting({ section: "2", crn: "different" }),
    makeMeeting({ section: "2", crn: "2", type: "LAB" }),
  ];
  const before = JSON.stringify(meetings);
  const grouped = groupMeetingOptions(meetings);
  expect(grouped).toHaveLength(4);
  expect(grouped.find((option) => option.key === "LEC::2::2")).toMatchObject({
    meetings: [meetings[1], meetings[2]], instructor: "Lab instructor",
  });
  const lectures = grouped.filter((option) => option.type === "LEC");
  expect(lectures.map((option) => option.section)).toEqual(["2", "2", "10"]);
  expect(JSON.stringify(meetings)).toBe(before);
});

test("distinguishes no selection, multiple meetings in one section, and multiple sections", () => {
  expect(groupMeetingOptions([])).toEqual([]);
  expect(getSelectedOptionKey([])).toBeNull();
  expect(getSelectedOptionKey([first])).toBe("LEC::01::12345");
  expect(isMultiSectionSelected([])).toBe(false);
  expect(isMultiSectionSelected([first, { ...first, days: ["F"] }])).toBe(false);
  expect(isMultiSectionSelected([first, second])).toBe(true);
});

test("selecting a section passes the complete option to the parent", () => {
  const onApplyOption = jest.fn();
  render(<SectionOptionList options={options} selectedMeetings={[first]} otherMeetings={[]}
    onApplyOption={onApplyOption} onApplyAllNonConflicting={jest.fn()} />);
  const selected = screen.getByRole("button", { name: /LEC 01/ });
  expect(within(selected).getByText("Selected")).toBeInTheDocument();
  userEvent.click(screen.getByRole("button", { name: /LEC 02/ }));
  expect(onApplyOption).toHaveBeenCalledTimes(1);
  expect(onApplyOption).toHaveBeenCalledWith(options[1]);
});

test("bulk selection excludes an entire section if any of its meetings conflict", () => {
  const onApplyAll = jest.fn();
  const multiMeetingOptions = groupMeetingOptions([first, { ...first, days: ["T"] }, second]);
  render(<SectionOptionList options={multiMeetingOptions} selectedMeetings={[]}
    otherMeetings={[makeMeeting({ days: ["T"] })]}
    onApplyOption={jest.fn()} onApplyAllNonConflicting={onApplyAll} />);
  expect(within(screen.getByRole("button", { name: /LEC 01/ })).getByText("Time conflict")).toBeInTheDocument();
  userEvent.click(screen.getByRole("button", { name: "Select all available" }));
  expect(onApplyAll).toHaveBeenCalledWith([multiMeetingOptions[1]], false);
});

test("bulk toggle recognizes all selected meetings regardless of order", () => {
  const onApplyAll = jest.fn();
  render(<SectionOptionList options={options} selectedMeetings={[second, first]} otherMeetings={[]}
    onApplyOption={jest.fn()} onApplyAllNonConflicting={onApplyAll} />);
  expect(screen.getAllByText("Selected")).toHaveLength(2);
  userEvent.click(screen.getByRole("button", { name: "Deselect all" }));
  expect(onApplyAll).toHaveBeenCalledWith(options, true);
});

test("a partial selection still offers select all", () => {
  render(<SectionOptionList options={options} selectedMeetings={[first]} otherMeetings={[]}
    onApplyOption={jest.fn()} onApplyAllNonConflicting={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Select all available" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Deselect all" })).not.toBeInTheDocument();
});

test("hides the bulk action when every section conflicts", () => {
  render(<SectionOptionList options={options} selectedMeetings={[]} otherMeetings={[
    makeMeeting({ start: "08:00AM", end: "11:00AM" }),
  ]} onApplyOption={jest.fn()} onApplyAllNonConflicting={jest.fn()} />);
  expect(screen.queryByRole("button", { name: "Select all available" })).not.toBeInTheDocument();
  expect(screen.getAllByText("Time conflict")).toHaveLength(2);
});

test("renders an empty option list without selection actions", () => {
  render(<SectionOptionList options={[]} selectedMeetings={[]} otherMeetings={[]}
    onApplyOption={jest.fn()} onApplyAllNonConflicting={jest.fn()} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
