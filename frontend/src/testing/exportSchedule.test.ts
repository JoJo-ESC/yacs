import { buildFinalsIcs, buildScheduleIcs, buildScheduleImageSvg, buildSchedulePrintHtml, buildScheduleText } from "@/features/schedule/utils/exportSchedule";
import type { FinalExam } from "@/features/finals/utils/finalsSchedule";
import type { Course } from "@/features/schedule/types/schedule";

const courses: Course[] = [
  {
    id: "CSCI-1100",
    title: "Computer Science 1",
    credits: 4,
    level: "1100",
    department: "CSCI",
    school: "Computer Science",
    description: "",
    offerFrequency: "Fall",
    prereqs: [],
    coreqs: [],
    maxEnroll: 100,
    enrolled: 50,
    meetings: [
      {
        type: "LEC",
        days: ["M", "W", "F"],
        start: "09:00AM",
        end: "09:50AM",
        location: "DCC 308",
        instructor: "Dr. Alan Turing",
        section: "01",
        startDate: "2024-08-28",
        endDate: "2024-12-20",
        semester: "FALL 2024",
      },
    ],
  },
];

test("builds recurring ics events for selected course meetings", () => {
  const ics = buildScheduleIcs(courses);

  expect(ics).toContain("BEGIN:VCALENDAR");
  expect(ics).toContain("SUMMARY:CSCI-1100 Computer Science 1");
  expect(ics).toContain("LOCATION:DCC 308");
  expect(ics).toContain("DTSTART:20240828T090000");
  expect(ics).toContain("DTEND:20240828T095000");
  expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20241220T235900");
  expect(ics).toContain("END:VCALENDAR");
});

test("builds printable schedule html for pdf export", () => {
  const html = buildSchedulePrintHtml(courses);

  expect(html).toContain("<title>YACS Schedule Export</title>");
  expect(html).toContain("FALL 2024");
  expect(html).toContain("Computer Science 1");
  expect(html).toContain("LEC 01");
  expect(html).toContain("Mon, Wed, Fri");
  expect(html).toContain("09:00AM - 09:50AM");
  expect(html).toContain("DCC 308");
});

test("builds schedule svg markup for png export", () => {
  const svg = buildScheduleImageSvg(courses);

  expect(svg).toContain("<svg");
  expect(svg).toContain("YACS Schedule Export");
  expect(svg).toContain("CSCI-1100");
  expect(svg).toContain("Computer Science 1");
  expect(svg).toContain("Mon, Wed, Fri");
  expect(svg).toContain("09:00AM - 09:50AM");
  expect(svg).toContain("DCC 308");
});

test("builds plain text schedule output for clipboard export", () => {
  const text = buildScheduleText(courses);

  expect(text).toContain("YACS Schedule Export");
  expect(text).toContain("FALL 2024");
  expect(text).toContain("CSCI-1100 - Computer Science 1");
  expect(text).toContain("LEC 01 | Mon, Wed, Fri | 09:00AM - 09:50AM | DCC 308 | Dr. Alan Turing");
});

test("builds finals ics events for finals export", () => {
  const finals: FinalExam[] = [
    {
      courseId: "CSCI-1100",
      courseTitle: "Computer Science 1",
      startDateTime: "2024-12-12T13:00:00",
      endDateTime: "2024-12-12T16:00:00",
      location: "DCC 308",
      notes: "Placeholder finals slot until backend data is available.",
      semester: "FALL 2024",
    },
  ];

  const ics = buildFinalsIcs(finals);

  expect(ics).toContain("BEGIN:VCALENDAR");
  expect(ics).toContain("PRODID:-//YACS//Finals Export//EN");
  expect(ics).toContain("SUMMARY:CSCI-1100 Final Exam");
  expect(ics).toContain("DTSTART:20241212T130000");
  expect(ics).toContain("DTEND:20241212T160000");
  expect(ics).toContain("LOCATION:DCC 308");
});
