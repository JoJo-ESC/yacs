import React from "react";
import { useSchedule } from "@/features/schedule/context/schedule-context";

type ProfessorSummary = {
  name: string;
  departments: string[];
  courseCount: number;
};

function buildProfessorList(catalog: ReturnType<typeof useSchedule>["catalog"]): ProfessorSummary[] {
  const byProfessor = new Map<string, { departments: Set<string>; courseIds: Set<string> }>();

  for (const course of catalog) {
    for (const meeting of course.meetings) {
      const instructor = meeting.instructor?.trim();
      if (!instructor) continue;

      const entry = byProfessor.get(instructor) ?? {
        departments: new Set<string>(),
        courseIds: new Set<string>(),
      };

      if (course.department) entry.departments.add(course.department);
      entry.courseIds.add(course.id);
      byProfessor.set(instructor, entry);
    }
  }

  return Array.from(byProfessor.entries())
    .map(([name, value]) => ({
      name,
      departments: Array.from(value.departments).sort((left, right) => left.localeCompare(right)),
      courseCount: value.courseIds.size,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export default function ProfessorsPage() {
  const { catalog, catalogLoading, selectedSemester } = useSchedule();
  const professors = React.useMemo(() => buildProfessorList(catalog), [catalog]);

  return (
    <main className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-border bg-surface/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">Professors</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Professor directory</h1>
          <p className="mt-3 max-w-2xl text-sm text-foreground/75">
            Browse instructors in the current catalog view{selectedSemester ? ` for ${selectedSemester}` : ""}.
          </p>
        </section>

        {catalogLoading ? (
          <section className="rounded-2xl border border-border bg-background/70 p-5">
            <p className="text-sm text-foreground/70">Loading professor directory from the current course catalog.</p>
          </section>
        ) : professors.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border bg-background/50 p-10 text-center">
            <p className="text-sm text-foreground/70">No professors are available in this catalog view yet.</p>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">All professors</h2>
              <p className="text-sm text-foreground/65">
                {professors.length} {professors.length === 1 ? "professor" : "professors"}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {professors.map((professor) => (
                <article
                  key={professor.name}
                  className="rounded-2xl border border-border bg-background/70 p-5 shadow-sm"
                >
                  <p className="text-lg font-semibold text-foreground">{professor.name}</p>
                  <p className="mt-2 text-sm text-foreground/70">
                    {professor.departments.length > 0
                      ? professor.departments.join(", ")
                      : "Department details coming soon"}
                  </p>
                  <p className="mt-4 text-sm text-foreground/65">
                    {professor.courseCount} {professor.courseCount === 1 ? "course" : "courses"} in this view
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
