import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AppProviders } from "@/providers/AppProviders";
import { AppRoutes } from "@/routes/AppRoutes";
import CatalogLoader from "@/features/schedule/components/CatalogLoader";
import SemesterSelect from "@/features/schedule/components/SemesterSelect";
import { useSchedule } from "@/features/schedule/context/schedule-context";

const mockFetch = () =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve(""),
  });

const originalFetch = global.fetch;
const semesterCsv = `short_name,full_name,course_name,course_type,course_credit_hours,course_days_of_the_week,course_start_time,course_end_time,course_instructor,course_location,course_max_enroll,course_enrolled,course_start_date,course_end_date,semester,course_level,course_section,description,raw_precoreqs,offer_frequency,prerequisites,corequisites,school
CSCI-1100,Computer Science 1,Computer Science 1,LEC,4,MWF,09:00AM,09:50AM,Prof Example,DCC 308,100,80,2026-01-12,2026-05-01,Spring 2026,1000,01,Intro course,,Fall/Spring,[],[],Computer Science
CSCI-1200,Data Structures,Data Structures,LEC,4,TR,10:00AM,11:50AM,Prof Example,DCC 318,100,90,2026-08-31,2026-12-18,Fall 2026,1000,01,DS course,,Fall/Spring,[],[],Computer Science`;

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
  localStorage.clear();
});

afterAll(() => {
  global.fetch = originalFetch;
});

function SelectedSemesterProbe() {
  const { selectedSemester } = useSchedule();
  return <div data-testid="selected-semester">{selectedSemester || "none"}</div>;
}

function ScheduleDataProbe() {
  const { catalog, courses } = useSchedule();
  return (
    <>
      <div data-testid="catalog-courses">{catalog.map((course) => course.id).join(",") || "none"}</div>
      <div data-testid="selected-courses">{courses.map((course) => course.id).join(",") || "none"}</div>
    </>
  );
}

test("renders app shell", async () => {
  render(
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );

  expect(await screen.findByRole("link", { name: /^yacs$/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /semester/i })).toBeInTheDocument();
});

test("stores the selected semester in shared app state", async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(semesterCsv),
    })
  ) as unknown as typeof fetch;

  render(
    <AppProviders>
      <CatalogLoader path="/semesters.csv" />
      <SemesterSelect />
      <SelectedSemesterProbe />
    </AppProviders>
  );

  const select = await screen.findByRole("combobox", { name: /semester/i });

  await waitFor(() => {
    expect(select).toHaveValue("Fall 2026");
    expect(screen.getByTestId("selected-semester")).toHaveTextContent("Fall 2026");
  });

  await userEvent.selectOptions(select, "Spring 2026");

  expect(select).toHaveValue("Spring 2026");
  expect(screen.getByTestId("selected-semester")).toHaveTextContent("Spring 2026");
});

test("filters catalog and selected courses by the selected semester", async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(semesterCsv),
    })
  ) as unknown as typeof fetch;

  function SemesterFilterHarness() {
    const { catalog, addCourse } = useSchedule();
    const addedRef = React.useRef(false);

    React.useEffect(() => {
      const fallCourse = catalog.find((course) => course.id === "CSCI-1200");
      if (!addedRef.current && fallCourse) {
        addedRef.current = true;
        addCourse(fallCourse);
      }
    }, [catalog, addCourse]);

    return (
      <>
        <CatalogLoader path="/semesters.csv" />
        <SemesterSelect />
        <ScheduleDataProbe />
      </>
    );
  }

  render(
    <AppProviders>
      <SemesterFilterHarness />
    </AppProviders>
  );

  const select = await screen.findByRole("combobox", { name: /semester/i });

  await waitFor(() => {
    expect(screen.getByTestId("catalog-courses")).toHaveTextContent("CSCI-1200");
    expect(screen.getByTestId("selected-courses")).toHaveTextContent("CSCI-1200");
  });

  await userEvent.selectOptions(select, "Spring 2026");

  await waitFor(() => {
    expect(screen.getByTestId("catalog-courses")).toHaveTextContent("CSCI-1100");
    expect(screen.getByTestId("selected-courses")).toHaveTextContent("none");
  });
});

test("remembers the last selected semester", async () => {
  localStorage.setItem("yacs:selected-semester", "Spring 2026");
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(semesterCsv),
    })
  ) as unknown as typeof fetch;

  render(
    <AppProviders>
      <CatalogLoader path="/semesters.csv" />
      <SemesterSelect />
      <SelectedSemesterProbe />
    </AppProviders>
  );

  const select = await screen.findByRole("combobox", { name: /semester/i });

  await waitFor(() => {
    expect(select).toHaveValue("Spring 2026");
    expect(screen.getByTestId("selected-semester")).toHaveTextContent("Spring 2026");
  });

  await userEvent.selectOptions(select, "Fall 2026");

  expect(localStorage.getItem("yacs:selected-semester")).toBe("Fall 2026");
});

test("shows the not found page for invalid urls", async () => {
  render(
    <AppProviders>
      <AppRoutes initialEntries={["/missing-page"]} />
    </AppProviders>
  );

  expect(await screen.findByRole("heading", { name: /page not found/i })).toBeInTheDocument();
  expect(screen.getByText(/doesn't exist or may have moved/i)).toBeInTheDocument();
});

test("shows the generic error page when a route crashes", () => {
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

  function CrashingScreen() {
    throw new Error("boom");
  }

  render(
    <MemoryRouter>
      <ErrorBoundary>
        <CrashingScreen />
      </ErrorBoundary>
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
  expect(screen.getByText(/we could not load this screen/i)).toBeInTheDocument();

  consoleErrorSpy.mockRestore();
});

test("renders the finals page shell", async () => {
  render(
    <AppProviders>
      <AppRoutes initialEntries={["/finals"]} />
    </AppProviders>
  );

  expect(await screen.findByRole("heading", { name: /final exam schedule/i })).toBeInTheDocument();
  expect(screen.getByText(/uses placeholder finals data on the frontend for now/i)).toBeInTheDocument();
});

test("renders the professors page shell", async () => {
  render(
    <AppProviders>
      <AppRoutes initialEntries={["/professors"]} />
    </AppProviders>
  );

  expect(await screen.findByRole("heading", { name: /professor directory/i })).toBeInTheDocument();
  expect(screen.getByText(/browse instructors in the current catalog view/i)).toBeInTheDocument();
});

test("shows a loading spinner while courses load", async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn(() => new Promise(() => undefined)) as unknown as typeof fetch;

  render(
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );

  expect(await screen.findByRole("status", { name: /loading courses/i })).toBeInTheDocument();
  expect(screen.getByText(/pulling the catalog into your schedule workspace/i)).toBeInTheDocument();

  global.fetch = originalFetch;
});

test("shows skeleton course cards while the catalog loads", async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn(() => new Promise(() => undefined)) as unknown as typeof fetch;

  render(
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );

  expect(await screen.findByText(/course cards will appear here as soon as the catalog finishes loading/i)).toBeInTheDocument();
  expect(screen.getAllByTestId("course-card-skeleton")).toHaveLength(3);

  global.fetch = originalFetch;
});

test("shows a loading state during login submission", async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input === "/api/session" && init?.method === "POST") {
      return new Promise(() => undefined);
    }
    return mockFetch() as unknown as Promise<Response>;
  }) as unknown as typeof fetch;

  render(
    <AppProviders>
      <AppRoutes initialEntries={["/login"]} />
    </AppProviders>
  );

  userEvent.type(screen.getByLabelText(/email/i), "test@rpi.edu");
  userEvent.type(screen.getByLabelText(/password/i), "test_password");
  userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

  expect(await screen.findAllByRole("status", { name: /signing in/i })).toHaveLength(2);
  expect(screen.getByText(/checking your credentials and starting your session/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();

  global.fetch = originalFetch;
});
