import React from "react";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { Separator } from "@/components/ui/Separator";
import ClassSearch from "@/features/schedule/components/ClassSearch";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isGuest, user, logout, isBusy } = useAuth();

  const link = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1 rounded hover:text-blue-500 ${isActive ? "text-blue-400" : "text-text"}`;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <>
    <div className="flex justify-between items-center p-4 text-input-foreground bg-header border-b border-b-border">
    <div className="flex items-center space-x-4">
      <NavLink to="/app" className="text-l font-bold">YACS</NavLink>
      <ClassSearch/>
    </div>
    <div className="flex items-center space-x-3 h-6 invisible sm:visible">
      <NavLink to="/app/planner" className={link}>4-Year Plan</NavLink>
      <Separator orientation="vertical" />
      <NavLink to="/app" className={link} end>Schedule</NavLink>
      <Separator orientation ="vertical" />
      {isAuthenticated ? (
        <NavLink to="/app/profile" className={link}>Profile</NavLink>
      ) : (
        <NavLink to="/" className={link}>Sign in</NavLink>
      )}
      <Separator orientation="vertical" />
      {isAuthenticated ? (
        <button
          type="button"
          onClick={handleLogout}
          disabled={isBusy}
          className="rounded border border-border px-3 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50"
        >
          {isBusy ? "..." : "Log out"}
        </button>
      ) : (
        <span className="text-xs text-input-foreground/70">
          {isGuest ? "Guest mode" : "Signed out"}
        </span>
      )}
      {isAuthenticated && user && (
        <span className="text-xs text-input-foreground/70">{user.email}</span>
      )}
      <ThemeToggle />
    </div>
    <Bars3Icon className="absolute top-[24px] left-[90%] h-6 w-6 sm:hidden"/>
    </div>
    <div id="class-search-results-slot" className="w-full"></div>
    </>
  );
}
export default Navbar;
