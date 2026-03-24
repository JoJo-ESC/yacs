import React from "react";

import { useSchedule } from "@/features/schedule/context/schedule-context";

export default function FinalsPage() {
  const { courses } = useSchedule();

  // TODO: Replace this derived placeholder list once the backend exposes finals data
  // either on the course model itself or via a dedicated finals endpoint.
  const selectedCourses = courses.map((course) => ({
    id: course.id,
    title: course.title,
  }));

  return (
    <main className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-border bg-surface/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">Finals</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Final exam schedule</h1>
          <p className="mt-3 max-w-2xl text-sm text-foreground/75">
            This page is ready for finals scheduling UI. The frontend shell is in place now, and the next step is wiring in real finals data from the backend.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-background/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Selected courses</h2>
                <p className="text-sm text-foreground/65">
                  {selectedCourses.length} {selectedCourses.length === 1 ? "course" : "courses"} currently in your schedule
                </p>
              </div>
            </div>

            {selectedCourses.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface/40 px-5 py-10 text-center">
                <p className="text-sm text-foreground/70">
                  Add courses to your schedule first, then finals will appear here once the backend data is connected.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {selectedCourses.map((course) => (
                  <article key={course.id} className="rounded-2xl border border-border bg-surface/40 px-4 py-4">
                    <p className="text-sm font-semibold text-foreground">{course.id}</p>
                    <p className="mt-1 text-sm text-foreground/70">{course.title}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-background/70 p-5">
            <h2 className="text-lg font-semibold text-foreground">Backend connection placeholder</h2>
            <div className="mt-5 space-y-4 rounded-2xl border border-dashed border-border bg-surface/35 p-5 text-sm text-foreground/75">
              <p>
                Finals meeting rows will render here after the backend provides exam date, start time, end time, and location for each selected course.
              </p>
              <p>
                Conflict highlighting and finals export should also use that same backend-backed finals dataset instead of trying to infer exam slots on the client.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
