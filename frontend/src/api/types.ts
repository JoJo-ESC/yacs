export interface ApiMeetingTimeResponse {
  id: number;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  begin_time: string | null;
  end_time: string | null;
  building: string | null;
  building_description: string | null;
  room: string | null;
  start_date: string | null;
  end_date: string | null;
  meeting_schedule_type: string | null;
  instructor_name: string | null;
}

export interface ApiCourseResponse {
  id: number;
  term: string | null;
  term_desc: string | null;
  crn: string | null;
  subject: string | null;
  subject_description: string | null;
  course_number: string | null;
  course_title: string | null;
  credit_hours: number | null;
  max_enrollment: number | null;
  enrollment: number | null;
  seats_available: number | null;
  section: string | null;
  schedule_type: string | null;
  instructional_method: string | null;
  meeting_times: ApiMeetingTimeResponse[];
}

export interface ApiPaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiCourseListResponse {
  data: ApiCourseResponse[];
  pagination: ApiPaginationMeta;
}

export interface ApiSemesterResponse {
  term: string;
  name: string;
}

export interface ApiDepartmentResponse {
  code: string;
  name: string;
}

export interface ApiScheduleResponse {
  id: number;
  name: string;
  semester: string;
  crns: string[];
  created_at: string;
  updated_at: string;
}

export interface ApiSaveScheduleRequest {
  name: string;
  semester: string;
  crns: string[];
}

export interface ApiSaveScheduleResponse {
  success: boolean;
  schedule: ApiScheduleResponse;
}

export interface ApiDeleteScheduleResponse {
  success: boolean;
  message?: string;
}
