import React from "react";
import { render, screen } from "@testing-library/react";
import { AppProviders } from "@/providers/AppProviders";
import { AppRoutes } from "@/routes/AppRoutes";

const mockFetch = () =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve(""),
  });

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

test("renders app shell", async () => {
  render(
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );

  expect(await screen.findByRole("button", { name: /continue as guest/i })).toBeInTheDocument();
});
