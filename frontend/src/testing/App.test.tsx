import React from "react";
import { render, screen } from "@testing-library/react";
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

test("renders app shell", () => {
  render(
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );

  expect(screen.getByText(/yacs/i)).toBeInTheDocument();
});
