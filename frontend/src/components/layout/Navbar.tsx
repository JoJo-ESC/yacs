import React from "react";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { Separator } from "@/components/ui/Separator";
import ClassSearch from "@/features/schedule/components/ClassSearch";
import SemesterSelect from "@/features/schedule/components/SemesterSelect";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { NavLink } from "react-router-dom";

function Navbar() {
  const link = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1 rounded hover:text-blue-500 ${isActive ? "text-blue-400" : "text-text"}`;
  return (
    <>
    <div className="flex justify-between items-center p-4 text-input-foreground bg-header border-b border-b-border">
    <div className="flex items-center space-x-4">
      <a href="/" className="text-l font-bold">YACS</a>
      <ClassSearch/>
      <SemesterSelect />
    </div>
    <div className="flex items-center space-x-3 h-6 invisible sm:visible">
      <NavLink to="/login" className={link}>Login</NavLink>
      <Separator orientation="vertical" />
      <NavLink to="/planner" className={link}>4-Year Plan</NavLink>
      <Separator orientation="vertical" />
      <NavLink to="/" className={link} end>Schedule</NavLink>
      <Separator orientation ="vertical" />
      <NavLink to="/professors" className={link}>Professors</NavLink>
      <Separator orientation ="vertical" />
      <NavLink to="/profile" className={link}>Profile</NavLink>
      
      <ThemeToggle />
    </div>
    <Bars3Icon className="absolute top-[24px] left-[90%] h-6 w-6 sm:hidden"/>
    </div>
    <div id="class-search-results-slot" className="w-full"></div>
    </>
  );
}
export default Navbar;
