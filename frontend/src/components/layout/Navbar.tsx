import React from "react";
import { Bars3Icon } from "@heroicons/react/24/solid";
import ClassSearch from "@/features/schedule/components/ClassSearch";
import { SubjectNavSearch } from "@/features/courses/components/SubjectNavSearch";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { NavLink, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const isBrowseRoute = location.pathname === "/" || location.pathname.startsWith("/courses");
  const link = ({ isActive }: { isActive: boolean }) =>
    `px-5 h-11 inline-flex items-center rounded-full text-sm font-semibold transition-all ${
      isActive
        ? "bg-[#f4ebe0] text-[#7a5230] shadow-[0_8px_20px_-14px_rgba(107,75,44,0.28)] dark:bg-[#3a281d] dark:text-[#f4e6d6]"
        : "text-slate-700 hover:bg-slate-100 dark:text-neutral-200 dark:hover:bg-[#201813]"
    }`;
  return (
    <>
      <div className="fixed inset-x-0 top-4 z-40 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(255,255,255,0.96)_0%,_rgba(252,249,244,0.96)_100%)] px-5 py-3 text-input-foreground shadow-[0_18px_50px_-24px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-[#343434] dark:bg-[linear-gradient(135deg,_rgba(22,22,22,0.96)_0%,_rgba(28,28,28,0.96)_100%)] dark:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.6)]">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            <BrandLogo imageClassName="h-12" />
            <div className="w-full max-w-2xl">
              {isBrowseRoute ? (
                <SubjectNavSearch />
              ) : (
                <div className="max-w-md">
                  <ClassSearch />
                </div>
              )}
            </div>
          </div>
          <div className="invisible flex h-11 items-center gap-2 sm:visible">
            <NavLink
              to="/"
              className={() =>
                `px-5 h-11 inline-flex items-center rounded-full text-sm font-semibold transition-all ${
                  isBrowseRoute
                    ? "bg-[#f4ebe0] text-[#7a5230] shadow-[0_8px_20px_-14px_rgba(107,75,44,0.28)] dark:bg-[#3a281d] dark:text-[#f4e6d6]"
                    : "text-slate-700 hover:bg-slate-100 dark:text-neutral-200 dark:hover:bg-[#201813]"
                }`
              }
              end
            >
              Browse
            </NavLink>
            <NavLink to="/planner" className={link}>4-Year Plan</NavLink>
            <NavLink to="/schedule" className={link}>Schedule</NavLink>
            <NavLink to="/profile" className={link}>Profile</NavLink>

            <ThemeToggle className="h-11 w-11 rounded-full text-slate-700 hover:bg-slate-100 dark:text-neutral-200 dark:hover:bg-[#201813]" />
          </div>
          <Bars3Icon className="h-6 w-6 text-slate-700 sm:hidden dark:text-neutral-200" />
        </div>
      </div>
      <div id="class-search-results-slot" className="w-full"></div>
    </>
  );
}
export default Navbar;
