import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AppProviders } from "@/providers/AppProviders";
import { AppRoutes } from "@/routes/AppRoutes";

const mockFetch = () =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve(""),
  });

const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

test("renders app shell", async () => {
  render(
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );

  expect(await screen.findByRole("link", { name: /^yacs$/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /semester/i })).toBeInTheDocument();
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
