import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

jest.mock("@/features/schedule/components/ClassSearch", () => () => <input aria-label="Search classes" />);
jest.mock("@/features/schedule/components/SemesterSelect", () => () => <select aria-label="Semester" />);
jest.mock("@/components/theme/ThemeToggle", () => () => <button>Toggle theme</button>);

let navigate: ReturnType<typeof useNavigate>;
function RouteChange() {
  navigate = useNavigate();
  return null;
}

function renderNavbar() {
  render(<MemoryRouter><Navbar /><RouteChange /></MemoryRouter>);
  return screen.getByRole("button", { name: "Open navigation menu" });
}

test("opens a modal drawer with the keyboard and restores focus on Escape", async () => {
  const toggle = renderNavbar();
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  toggle.focus();
  userEvent.keyboard("{Enter}");
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("dialog", { name: "Navigation" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Close navigation menu" })).toHaveFocus();
  expect(document.body).toHaveAttribute("data-scroll-locked");
  screen.getByRole("link", { name: "Login" }).focus();
  userEvent.keyboard("{Escape}");
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  await waitFor(() => expect(toggle).toHaveFocus());
  expect(document.body).not.toHaveAttribute("data-scroll-locked");
  userEvent.click(toggle);
  userEvent.click(screen.getByRole("button", { name: "Close navigation menu" }));
  expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("provides all destinations and closes even when selecting the current route", () => {
  const toggle = renderNavbar();
  userEvent.click(toggle);
  for (const label of ["Login", "4-Year Plan", "Schedule", "Professors", "Profile"]) {
    expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
  }
  expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  userEvent.click(screen.getByRole("link", { name: "Schedule" }));
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  userEvent.click(toggle);
  userEvent.click(screen.getByRole("link", { name: "Professors" }));
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("link", { name: "Professors" })).toHaveAttribute("aria-current", "page");
});

test("dismisses on backdrop taps and external route changes", async () => {
  const toggle = renderNavbar();
  userEvent.click(toggle);
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  fireEvent.pointerDown(document.querySelector(".mobile-nav-backdrop")!, { button: 0, ctrlKey: false });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  userEvent.click(toggle);
  act(() => navigate("/profile"));
  expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("resets the mobile menu when switching to desktop", () => {
  let onChange: () => void = () => {};
  const media = {
    matches: false,
    addEventListener: jest.fn((_event, listener) => { onChange = listener; }),
    removeEventListener: jest.fn(),
  };
  const matchMedia = jest.spyOn(window, "matchMedia").mockReturnValue(media as unknown as MediaQueryList);
  try {
    const toggle = renderNavbar();
    userEvent.click(toggle);
    media.matches = true;
    act(() => onChange());
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  } finally {
    matchMedia.mockRestore();
  }
});


test("keeps keyboard focus inside the open drawer", () => {
  userEvent.click(renderNavbar());
  const close = screen.getByRole("button", { name: "Close navigation menu" });
  const theme = screen.getByRole("button", { name: "Toggle theme" });
  theme.focus();
  userEvent.tab();
  expect(close).toHaveFocus();
  userEvent.tab({ shift: true });
  expect(theme).toHaveFocus();
});
