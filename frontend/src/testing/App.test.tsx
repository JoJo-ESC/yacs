import React from "react";
import { render, screen } from "@testing-library/react";
import { AppRoutes } from "@/routes/AppRoutes";

jest.mock("@/lib/analytics", () => ({ trackPageview: jest.fn() }));
jest.mock("@/features/auth/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false, isGuest: false }) }));
jest.mock("@/features/auth/routes/LandingAuthPage", () => () => <h1>Sign in</h1>);
jest.mock("@/app/App", () => () => <div>Protected app</div>);

test("upstream authentication still protects the merged app", () => {
  window.history.replaceState({}, "", "/schedule");
  render(<AppRoutes />);
  expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/login");
  expect(screen.queryByText("Protected app")).not.toBeInTheDocument();
});
