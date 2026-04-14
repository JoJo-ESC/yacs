import React from "react";
import { Link, useParams } from "react-router-dom";
import { useSchedule } from "@/features/schedule/context/schedule-context";
import { buildProfessorList } from "@/features/professors/utils/professors";

function buildRateMyProfessorsSearchUrl(name: string) {
  const params = new URLSearchParams({ query: name });
  return `https://www.ratemyprofessors.com/search/professors?${params.toString()}`;
}

export default function ProfessorDetailPage() {
  const { professorSlug } = useParams();
  const { catalog, catalogLoading, selectedSemester } = useSchedule();
  const professors = React.useMemo(() => buildProfessorList(catalog), [catalog]);
  const professor = React.useMemo(
    () => professors.find((entry) => entry.slug === professorSlug),
    [professorSlug, professors]
  );

  return (
    <main className="flex-1 px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-3xl border border-border bg-surface/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">Professors</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">
            {catalogLoading ? "Loading professor" : professor?.name ?? "Professor not found"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-foreground/75">
            {catalogLoading
              ? "Pulling instructor details from the current catalog view."
              : selectedSemester
                ? `Professor details for ${selectedSemester}.`
                : "Professor details from the current catalog view."}
          </p>
        </section>

        <div>
          <Link to="/professors" className="text-sm text-blue-500 hover:text-blue-400">
            Back to professor directory
          </Link>
        </div>

        {catalogLoading ? (
          <section className="rounded-2xl border border-border bg-background/70 p-5">
            <p className="text-sm text-foreground/70">Loading professor details.</p>
          </section>
        ) : !professor ? (
          <section className="rounded-2xl border border-dashed border-border bg-background/50 p-10 text-center">
            <p className="text-sm text-foreground/70">We could not find a professor matching this directory entry.</p>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
              <div className="grid gap-6 md:grid-cols-2">
                <article className="rounded-2xl border border-border bg-surface/35 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/55">Name</p>
                  <p className="mt-3 text-xl font-semibold text-foreground">{professor.name}</p>
                </article>

                <article className="rounded-2xl border border-border bg-surface/35 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/55">Department</p>
                  <p className="mt-3 text-xl font-semibold text-foreground">
                    {professor.departments.length > 0
                      ? professor.departments.join(", ")
                      : "Department details coming soon"}
                  </p>
                </article>
              </div>

              <div className="mt-6">
                <a
                  href={buildRateMyProfessorsSearchUrl(professor.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-blue-300 hover:text-blue-500"
                >
                  View on Rate My Professors
                </a>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-background/70 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Courses taught</h2>
                <p className="text-sm text-foreground/65">
                  {professor.courseCount} {professor.courseCount === 1 ? "course" : "courses"}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {professor.courses.map((course) => (
                  <article key={course.id} className="rounded-2xl border border-border bg-surface/35 p-4">
                    <p className="text-sm font-semibold text-foreground">{course.id}</p>
                    <p className="mt-1 text-sm text-foreground/75">{course.title}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-foreground/55">{course.department}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
