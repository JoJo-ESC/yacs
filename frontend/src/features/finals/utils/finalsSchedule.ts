import type { Course } from "@/features/schedule/types/schedule";

export type FinalExam = {
  courseId: string;
  courseTitle: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  notes?: string;
  semester?: string;
};

const PLACEHOLDER_FINALS_BY_COURSE: Record<
  string,
  {
    startDateTime: string;
    endDateTime: string;
    location: string;
    notes?: string;
    semester?: string;
  }
> = {
  "CSCI-1100": {
    startDateTime: "2024-12-12T13:00:00",
    endDateTime: "2024-12-12T16:00:00",
    location: "DCC 308",
    notes: "Placeholder finals slot until backend data is available.",
    semester: "FALL 2024",
  },
  "MATH-1010": {
    startDateTime: "2024-12-13T09:00:00",
    endDateTime: "2024-12-13T12:00:00",
    location: "JROWL 2W19",
    notes: "Placeholder finals slot until backend data is available.",
    semester: "FALL 2024",
  },
  "PHYS-1100": {
    startDateTime: "2024-12-14T14:00:00",
    endDateTime: "2024-12-14T17:00:00",
    location: "EMPAC Concert Hall",
    notes: "Placeholder finals slot until backend data is available.",
    semester: "FALL 2024",
  },
};

export function getFinalsForCourses(courses: Course[]): FinalExam[] {
  return courses.flatMap((course) => {
    // TODO: Replace this placeholder lookup with backend finals data.
    const finalsData = PLACEHOLDER_FINALS_BY_COURSE[course.id];
    if (!finalsData) return [];

    return [
      {
        courseId: course.id,
        courseTitle: course.title,
        startDateTime: finalsData.startDateTime,
        endDateTime: finalsData.endDateTime,
        location: finalsData.location,
        notes: finalsData.notes,
        semester: finalsData.semester,
      },
    ];
  });
}
