import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CatalogLoader from "@/features/schedule/components/CatalogLoader";
import { appConfig } from "@/config";
import { cn } from "@/lib/utils";

export default function App() {
  const location = useLocation();
  const isSubjectBrowserRoute = location.pathname === "/" || location.pathname === "/courses";
  const isSubjectDetailRoute = location.pathname.startsWith("/courses/");

  return (
    <div className="min-h-screen flex flex-col">
      <CatalogLoader path={appConfig.catalogCsvPath} />
      <Navbar />
      <div
        className={cn(
          "flex-1 pt-24 sm:pt-28",
          isSubjectBrowserRoute && "bg-white dark:bg-black",
          isSubjectDetailRoute &&
            "bg-[radial-gradient(circle_at_top_left,_rgba(147,197,253,0.12),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(176,129,89,0.12),_transparent_20%),linear-gradient(180deg,_#fffefd_0%,_#fffdfa_38%,_#ffffff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(161,98,7,0.18),_transparent_24%),linear-gradient(180deg,_#120d09_0%,_#16110d_42%,_#09090b_100%)]",
        )}
      >
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
