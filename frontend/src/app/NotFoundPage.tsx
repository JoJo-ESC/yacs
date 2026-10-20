import React from "react";
import { Link, useLocation } from "react-router-dom";

// Shown for any URL that doesn't match a route, instead of a blank page.
export default function NotFoundPage() {
  const location = useLocation();

  return (
    <main className="flex-1 bg-white dark:bg-black">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Page not found
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Nothing lives at{" "}
          <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 text-slate-800 dark:bg-[#262626] dark:text-neutral-200">
            {location.pathname}
          </code>
          . The link may be out of date, or the address may have a typo.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-full border border-[#dfc9ae] bg-[#f4ebe0] px-5 text-sm font-semibold text-[#7a5230] transition-colors hover:bg-[#efe1d0] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6] dark:hover:bg-[#46301f]"
          >
            Browse classes
          </Link>
          <Link
            to="/schedule"
            className="inline-flex h-11 items-center rounded-full border border-slate-200/80 px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-[#3a3a3a] dark:text-neutral-200 dark:hover:bg-[#1f1f1f]"
          >
            Go to my schedule
          </Link>
        </div>
      </div>
    </main>
  );
}
