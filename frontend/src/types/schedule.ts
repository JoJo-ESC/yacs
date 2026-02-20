export type Meeting = {
  type: string;              // "LEC" | "LAB" | "REC" | "STU" | ...
  days: string[];            // ["M","W","F"] etc
  start: string;             // "09:00AM"
  end: string;               // "09:50AM"
  location: string;          // "DCC 308"
  instructor: string;        // "Dr. Alan Turing"
  section: string;           // "01", "L1", "R1", ...
};

export type Course = {
  id: string;                // short_name e.g. "CSCI-1100"
  title: string;             // full_name e.g. "Computer Science 1"
  credits: number;           // from course_credit_hours
  level: string;             // course_level e.g. "1100"
  department: string;        // from id prefix e.g. "CSCI"
  school: string;            // "Computer Science", "Mathematics", ...
  description: string;
  offerFrequency: string;    // offer_frequency
  prereqs: string[];         // parsed from prerequisites
  coreqs: string[];          // parsed from corequisites
  maxEnroll: number;         // course_max_enroll
  enrolled: number;          // course_enrolled
  meetings: Meeting[];       // all LEC/LAB/REC instances
};
