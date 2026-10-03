import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import "./Navbar.css";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import ClassSearch from "@/features/schedule/components/ClassSearch";
import SemesterSelect from "@/features/schedule/components/SemesterSelect";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { NavLink, useLocation } from "react-router-dom";

const links = [
  { to: "/login", label: "Login" },
  { to: "/planner", label: "4-Year Plan" },
  { to: "/", label: "Schedule" },
  { to: "/professors", label: "Professors" },
  { to: "/profile", label: "Profile" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => setMenuOpen(false), [location]);

  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const navigationLinks = links.map(({ to, label }) => (
    <NavLink
      key={to}
      to={to}
      end={to === "/"}
      onClick={() => setMenuOpen(false)}
      className={({ isActive }) => `flex min-h-[44px] items-center rounded px-3 py-2 hover:bg-muted hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${isActive ? "text-blue-400" : "text-foreground"}`}
    >
      {label}
    </NavLink>
  ));

  return (
    <>
      <header className="border-b border-border bg-header p-4 text-input-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-l font-bold">YACS</a>
          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 xl:hidden"
                aria-label="Open navigation menu"
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="mobile-nav-backdrop fixed inset-0 z-50 bg-black/50" />
              <Dialog.Content
                aria-describedby={undefined}
                className="mobile-nav-drawer fixed inset-y-0 right-0 z-50 flex w-80 max-w-[calc(100%-2rem)] flex-col overflow-y-auto overscroll-contain border-l border-border bg-header p-4 text-input-foreground shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-3">
                  <Dialog.Title className="text-lg font-semibold">Navigation</Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close navigation menu"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>
                <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
                  {navigationLinks}
                </nav>
                <div className="mt-4 border-t border-border pt-4">
                  <ThemeToggle className="h-11 w-11" />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <div className="order-2 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:order-none xl:w-auto xl:flex-1">
            <div className="min-w-0 flex-1"><ClassSearch /></div>
            <SemesterSelect />
          </div>
          <nav aria-label="Primary navigation" className="hidden items-center gap-2 xl:flex">
            {navigationLinks}
            <ThemeToggle className="h-11 w-11" />
          </nav>
        </div>
      </header>
      <div id="class-search-results-slot" className="w-full"></div>
    </>
  );
}
export default Navbar;
