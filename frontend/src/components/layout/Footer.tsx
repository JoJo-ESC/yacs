import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";

const REPO_URL = "https://github.com/JoJo-ESC/yacs";
const RCOS_URL = "https://rcos.io";

// Same destinations and labels as the navbar; keep the two in sync.
const siteLinks = [
  { label: "Browse", to: "/" },
  { label: "4-Year Plan", to: "/planner" },
  { label: "Schedule", to: "/schedule" },
  { label: "Profile", to: "/profile" },
];

const projectLinks = [
  { label: "GitHub", href: REPO_URL },
  { label: "Report a bug", href: `${REPO_URL}/issues/new?labels=bug` },
  { label: "Request a feature", href: `${REPO_URL}/issues/new?labels=enhancement` },
  { label: "The YACS team", href: `${REPO_URL}/graphs/contributors` },
  { label: "About RCOS", href: RCOS_URL },
];

const headingClasses =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400";
const linkClasses =
  "inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition-colors hover:text-[#7a5230] dark:text-neutral-200 dark:hover:text-[#f4e6d6]";

function Footer() {
  return (
    <footer className="bg-white px-4 pb-6 pt-10 dark:bg-black sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl rounded-[28px] border border-slate-200/80 bg-white/95 px-6 py-8 text-input-foreground shadow-[0_20px_60px_-42px_rgba(15,23,42,0.14)] dark:border-[#3a3a3a] dark:bg-[#171717] sm:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <BrandLogo imageClassName="h-9" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
              Yet Another Course Scheduler. Search RPI classes, build conflict-free schedules, and plan your four years.
            </p>
            <a
              href={RCOS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-9 items-center gap-1 rounded-full border border-[#dfc9ae] bg-[#f4ebe0] px-4 text-sm font-semibold text-[#7a5230] transition-colors hover:bg-[#efe1d0] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6] dark:hover:bg-[#46301f]"
            >
              An RCOS project
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <nav aria-label="Site">
            <h2 className={headingClasses}>Explore</h2>
            <ul className="mt-4 space-y-3">
              {siteLinks.map((link) => (
                <li key={link.to}>
                  <Link className={linkClasses} to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Project">
            <h2 className={headingClasses}>Project</h2>
            <ul className="mt-4 space-y-3">
              {projectLinks.map((link) => (
                <li key={link.href}>
                  <a className={linkClasses} href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-1 border-t border-slate-200/80 pt-5 text-xs text-slate-500 dark:border-[#303030] dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The YACS Team</p>
          <p>Built by students at Rensselaer Polytechnic Institute</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
