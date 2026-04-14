import React from "react";
import { Link, useParams } from "react-router-dom";
import { useSchedule } from "@/features/schedule/context/schedule-context";
import { buildProfessorList } from "@/features/professors/utils/professors";

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
          </section>
        )}
      </div>
    </main>
  );
}
