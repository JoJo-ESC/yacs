import React from "react";
import { Bars3Icon } from "@heroicons/react/24/solid";
import ClassSearch from "@/components/schedule/ClassSearch";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { NavLink } from "react-router-dom";

function Navbar() {
  const link = ({ isActive }: { isActive: boolean }) =>
    `px-4 h-11 inline-flex items-center rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? "text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/40"
        : "text-slate-700 hover:bg-slate-100 dark:text-foreground dark:hover:bg-muted"
    }`;
  return (
    <>
      <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 text-input-foreground backdrop-blur-xl shadow-sm shadow-slate-900/5 dark:border-border dark:bg-header/90">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-4 md:gap-8">
            <a href="/" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-foreground">YACS</a>
            <div className="w-full max-w-md">
              <ClassSearch />
            </div>
          </div>
          <div className="invisible flex h-11 items-center gap-2 sm:visible">
            <NavLink to="/planner" className={link}>4-Year Plan</NavLink>
            <NavLink to="/" className={link} end>Schedule</NavLink>
            <NavLink to="/profile" className={link}>Profile</NavLink>

            <ThemeToggle />
          </div>
          <Bars3Icon className="h-6 w-6 text-slate-700 sm:hidden dark:text-foreground" />
        </div>
      </div>
      <div id="class-search-results-slot" className="w-full"></div>
    </>
  );
}
export default Navbar;
