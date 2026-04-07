import React, { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, Plus as PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchedule } from "../context/schedule-context";
import type { Course } from "../types/schedule";

function formatPrereqs(prereqs: string[]) {
  if (!prereqs || prereqs.length === 0) return "None";
  return prereqs.join(", ");
}

export default function DepartmentBrowser() {
  const { filteredCatalog, addCourse, hasCourse } = useSchedule();
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [query, setQuery] = useState("");

  const departments = useMemo(() => {
    const unique = new Set<string>();
    for (const course of filteredCatalog) {
      if (course.department) unique.add(course.department);
    }
    return ["All Departments", ...Array.from(unique).sort()];
  }, [filteredCatalog]);

  useEffect(() => {
    if (departments.length === 0) return;
    if (!departments.includes(selectedDepartment)) {
      setSelectedDepartment(departments[0]);
    }
  }, [departments, selectedDepartment]);

  const departmentCourses = useMemo(() => {
    const base =
      selectedDepartment === "All Departments"
        ? filteredCatalog
        : filteredCatalog.filter((course) => course.department === selectedDepartment);

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return base.sort((a, b) => a.id.localeCompare(b.id));

    return base
      .filter((course) => {
        const searchable = [course.id, course.title, course.school, course.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(normalizedQuery);
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [filteredCatalog, query, selectedDepartment]);

  const departmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const course of filteredCatalog) {
      const key = course.department || "Unknown";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [filteredCatalog]);

  const selectedCount = departmentCourses.length;

  return (
    <section className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Departments</h2>
          <p className="text-sm text-muted-foreground">Browse by department and select a course to add to your schedule.</p>
        </div>

        <div className="space-y-2">
          {departments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
              No courses available yet.
            </div>
          ) : (
            departments.map((department) => {
              const count = department === "All Departments" ? filteredCatalog.length : departmentCounts.get(department) ?? 0;
              return (
                <button
                  key={department}
                  type="button"
                  onClick={() => setSelectedDepartment(department)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                    department === selectedDepartment
                      ? "border-blue-400 bg-blue-50 text-blue-900"
                      : "border-transparent bg-background hover:border-border"
                  }`}
                >
                  <span className="truncate">{department}</span>
                  <span className="ml-3 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">{count}</span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{selectedDepartment}</h2>
            <p className="text-sm text-muted-foreground">{selectedCount} course{selectedCount === 1 ? "" : "s"} found</p>
          </div>

          <label className="relative w-full max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search within department"
              className="h-11 w-full rounded-xl border border-border bg-background px-10 text-sm text-foreground outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {departmentCourses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/50 p-6 text-center text-sm text-muted-foreground">
            No matching courses found. Try a different department or refine your search.
          </div>
        ) : (
          <div className="space-y-4">
            {departmentCourses.map((course) => (
              <article key={course.id} className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground/80">{course.department}</p>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">{course.id}: {course.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{course.school}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <span className="rounded-full bg-muted px-3 py-1">{course.credits ?? 0} credits</span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addCourse(course)}
                      disabled={hasCourse(course.id)}
                      className="whitespace-nowrap"
                    >
                      {hasCourse(course.id) ? "Added" : "Add to Schedule"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">{course.description || "No description available."}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl bg-surface p-3">
                        <p className="text-[11px] uppercase tracking-[.18em] text-muted-foreground">Prerequisites</p>
                        <p className="mt-2 text-sm text-foreground">{formatPrereqs(course.prereqs)}</p>
                      </div>
                      <div className="rounded-xl bg-surface p-3">
                        <p className="text-[11px] uppercase tracking-[.18em] text-muted-foreground">Offering</p>
                        <p className="mt-2 text-sm text-foreground">{course.offerFrequency || "Not listed"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
