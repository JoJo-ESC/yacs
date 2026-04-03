import React from "react";

import { Button } from "@/components/ui/button";
import { useSchedule } from "@/features/schedule/context/schedule-context";
import { downloadFinalsIcs, printFinalsPdf } from "@/features/schedule/utils/exportSchedule";
import { getFinalsForCourses } from "@/features/finals/utils/finalsSchedule";

export default function FinalsPage() {
  const { courses } = useSchedule();

  const selectedCourses = courses.map((course) => ({
    id: course.id,
    title: course.title,
  }));
  const finals = getFinalsForCourses(courses);

  return (
    <main className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-border bg-surface/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">Finals</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Final exam schedule</h1>
          <p className="mt-3 max-w-2xl text-sm text-foreground/75">
            This uses placeholder finals data on the frontend for now. Replace that adapter with backend finals data once the data is available.
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
              {finals.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printFinalsPdf(finals)}
                    className="border-border text-muted-foreground hover:bg-surface hover:text-foreground"
                  >
                    Export finals PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFinalsIcs(finals)}
                    className="border-border text-muted-foreground hover:bg-surface hover:text-foreground"
                  >
                    Export finals ICS
                  </Button>
                </div>
              )}
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
            <h2 className="text-lg font-semibold text-foreground">Final exam export</h2>
            {finals.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface/35 p-5 text-sm text-foreground/75">
                No placeholder finals entries exist for the currently selected courses yet.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {finals.map((exam) => (
                  <article key={`${exam.courseId}-${exam.startDateTime}`} className="rounded-2xl border border-border bg-surface/35 p-4">
                    <p className="text-sm font-semibold text-foreground">{exam.courseId} final</p>
                    <p className="mt-1 text-sm text-foreground/70">{exam.courseTitle}</p>
                    <p className="mt-2 text-sm text-foreground/75">
                      {new Date(exam.startDateTime).toLocaleString()} to {new Date(exam.endDateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className="mt-1 text-sm text-foreground/70">{exam.location}</p>
                    {exam.notes && <p className="mt-2 text-xs text-foreground/60">{exam.notes}</p>}
                  </article>
                ))}
              </div>
            )}
            <div className="mt-5 space-y-3 rounded-2xl border border-dashed border-border bg-surface/20 p-4 text-sm text-foreground/75">
              <p>
                TODO for backend: replace the placeholder finals adapter with real finals date, start time, end time, and location from the data.
              </p>
              <p>
                Finals conflict detection should read from that same backend-backed finals dataset once it exists.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
