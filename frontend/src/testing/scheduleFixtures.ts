import type { Course, Meeting } from "@/types/schedule";

export function makeMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    type: "LEC", days: ["M", "W"], start: "09:00AM", end: "09:50AM",
    location: "DCC 308", instructor: "Dr. Test", section: "01", crn: "12345",
    seatsAvailable: 10, enrolled: 20, maxEnroll: 30, ...overrides,
  };
}

export function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "CSCI-1100", title: "Computer Science 1", credits: 4, level: "1100",
    department: "CSCI", school: "Science", description: "An introductory course",
    offerFrequency: "Fall", prereqs: [], coreqs: [], maxEnroll: 30, enrolled: 20,
    meetings: [makeMeeting()], ...overrides,
  };
}
