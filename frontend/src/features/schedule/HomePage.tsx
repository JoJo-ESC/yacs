import React from "react";
import ScheduleList from "@/features/schedule/components/ScheduleList";
import WeekScheduler from "@/features/schedule/components/WeekScheduler";

export default function HomePage() {
  return (
    <main className="relative flex-1 overflow-x-hidden bg-white pb-16 dark:bg-none dark:bg-black">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[40px] border border-white/80 bg-white/82 p-6 shadow-[0_28px_100px_-56px_rgba(15,23,42,0.45)] backdrop-blur dark:border-[#3a3a3a] dark:bg-[#171717] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] app-text-muted">
                Weekly schedule
              </p>
              <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl dark:text-white">
                Build a schedule that stays readable while you compare sections.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Search from the navbar, review conflicts in the calendar, and adjust section combinations below without leaving the page.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] app-text-muted">
                  Calendar view
                </div>
                <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Mon-Fri
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Selected meetings stay aligned to the week grid with conflict awareness.
                </p>
              </div>
              <div className="rounded-[28px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] app-text-muted">
                  Section control
                </div>
                <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Live
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Swap lecture, lab, and recitation options below while keeping the current schedule logic intact.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Weekly overview
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Schedule grid
            </h2>
          </div>
          <WeekScheduler events={[]} startHour={8} endHour={20} showWeekend={false} />
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Selected courses
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Manage sections
            </h2>
          </div>
          <ScheduleList />
        </section>
      </div>
    </main>
  );
}
