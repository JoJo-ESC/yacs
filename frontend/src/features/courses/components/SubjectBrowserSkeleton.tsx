import * as React from "react";

export function SubjectBrowserSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-[32px] border border-slate-200/80 bg-white/80 p-8 dark:border-slate-800 dark:bg-slate-950/70">
        <div className="h-4 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-12 max-w-xl rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3 h-5 max-w-3xl rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 rounded-[24px] bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/70">
        <div className="h-12 rounded-[20px] bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 flex gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-64 rounded-[28px] border border-slate-200/80 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="mt-5 h-7 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-5 w-1/2 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="mt-6 space-y-2">
              <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-5/6 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
