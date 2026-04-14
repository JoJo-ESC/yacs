import React from "react";
import { Link } from "react-router-dom";
import { useSchedule } from "@/features/schedule/context/schedule-context";
import { buildProfessorList } from "@/features/professors/utils/professors";

export default function ProfessorsPage() {
  const { catalog, catalogLoading, selectedSemester } = useSchedule();
  const professors = React.useMemo(() => buildProfessorList(catalog), [catalog]);
  const [query, setQuery] = React.useState("");
  const filteredProfessors = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return professors;
    return professors.filter((professor) => professor.name.toLowerCase().includes(normalizedQuery));
  }, [professors, query]);

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
              <div>
                <h2 className="text-lg font-semibold text-foreground">All professors</h2>
                <p className="mt-1 text-sm text-foreground/65">
                  {filteredProfessors.length} {filteredProfessors.length === 1 ? "professor" : "professors"} shown
                </p>
              </div>
              <label className="block">
                <span className="sr-only">Search professors</span>
                <input
                  type="search"
                  aria-label="Search professors"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by professor name"
                  className="h-10 w-64 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
              </label>
            </div>

            {filteredProfessors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background/50 p-10 text-center">
                <p className="text-sm text-foreground/70">No professors match that search yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProfessors.map((professor) => (
                  <Link
                    key={professor.name}
                    to={`/professors/${professor.slug}`}
                    className="rounded-2xl border border-border bg-background/70 p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
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
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
