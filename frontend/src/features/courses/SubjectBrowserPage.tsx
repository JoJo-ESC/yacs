import * as React from "react";
import { useCatalog } from "@/context/schedule/schedule-context";
import { SubjectBrowserSkeleton } from "@/features/courses/components/SubjectBrowserSkeleton";
import { CourseSearchResults } from "@/features/courses/components/CourseSearchResults";
import { SubjectCard } from "@/features/courses/components/SubjectCard";
import { SubjectFilterBar } from "@/features/courses/components/SubjectFilterBar";
import { SubjectQuickOpenDialog } from "@/features/courses/components/SubjectQuickOpenDialog";
import {
  ALL_SUBJECTS_CATEGORY,
  filterSubjects,
  getCategoryCounts,
  getCategoryMeta,
  getCourseCountBySubject,
  getGroupedSubjects,
  searchCatalogCourses,
  type SubjectFilterCategory,
} from "@/lib/courses/subjects";
import { useSubjects } from "@/hooks/courses/useSubjects";
import { useSearchParams } from "react-router-dom";

export default function SubjectBrowserPage() {
  const { subjects, loading, error } = useSubjects();
  const { catalog } = useCatalog();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const deferredQuery = React.useDeferredValue(query);
  const [activeCategory, setActiveCategory] = React.useState<SubjectFilterCategory>(ALL_SUBJECTS_CATEGORY);
  const [isQuickFindOpen, setIsQuickFindOpen] = React.useState(false);

  React.useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "/" && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        setIsQuickFindOpen(true);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsQuickFindOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const courseCounts = React.useMemo(() => getCourseCountBySubject(catalog), [catalog]);
  const categoryCounts = React.useMemo(() => getCategoryCounts(subjects), [subjects]);
  const filteredResults = React.useMemo(
    () => filterSubjects(subjects, deferredQuery, activeCategory, catalog),
    [subjects, deferredQuery, activeCategory, catalog],
  );
  const subjectByCode = React.useMemo(
    () =>
      subjects.reduce<Record<string, (typeof subjects)[number]>>((acc, subject) => {
        acc[subject.code.toUpperCase()] = subject;
        return acc;
      }, {}),
    [subjects],
  );
  const matchingCourses = React.useMemo(
    () =>
      searchCatalogCourses(catalog, deferredQuery)
        .map(({ course, score }) => ({
          course,
          score,
          subject: subjectByCode[course.department.toUpperCase()],
        }))
        .filter(({ subject }) => {
          if (activeCategory === ALL_SUBJECTS_CATEGORY) return true;
          return subject?.category === activeCategory;
        })
        .slice(0, 8),
    [catalog, deferredQuery, subjectByCode, activeCategory],
  );
  const groupedSubjects = React.useMemo(() => getGroupedSubjects(subjects), [subjects]);
  const activeCategoryLabel =
    activeCategory === ALL_SUBJECTS_CATEGORY ? "All subjects" : getCategoryMeta(activeCategory)?.label ?? "Subjects";
  const visibleGroups = React.useMemo(
    () =>
      groupedSubjects
        .filter((group) => activeCategory === ALL_SUBJECTS_CATEGORY || group.category.id === activeCategory)
        .filter((group) => group.subjects.length > 0),
    [groupedSubjects, activeCategory],
  );

  return (
    <main className="relative flex-1 overflow-x-hidden bg-white pb-16 text-[#2b1f17] dark:bg-black dark:text-[#f4ece2]">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-10 pt-4 sm:px-6 lg:px-8">

        {loading ? (
          <SubjectBrowserSkeleton />
        ) : error ? (
          <section className="rounded-[32px] border border-rose-200 bg-rose-50 px-6 py-12 text-center dark:border-rose-900 dark:bg-rose-950/40">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-rose-900 dark:text-rose-100">
              Subject discovery is unavailable right now.
            </h2>
            <p className="mt-3 text-sm leading-6 text-rose-700 dark:text-rose-200">{error}</p>
          </section>
        ) : (
          <>
            <SubjectFilterBar
              categories={categoryCounts}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {deferredQuery.trim() ? (
              <section className="space-y-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-display text-3xl font-semibold tracking-tight text-[#2d1f15] dark:text-[#faf2ea]">
                      {filteredResults.length + matchingCourses.length} match
                      {filteredResults.length + matchingCourses.length === 1 ? "" : "es"} in {activeCategoryLabel}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#837466] dark:text-[#c7b8a9]">
                    <span className="rounded-full bg-[#f8f2ea] px-3 py-1 text-[#7a5230] dark:bg-[#3a281d] dark:text-[#f4e6d6]">
                      {filteredResults.length} subject match{filteredResults.length === 1 ? "" : "es"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-[#2b2b2b] dark:text-neutral-300">
                      {matchingCourses.length} class match{matchingCourses.length === 1 ? "" : "es"}
                    </span>
                  </div>
                </div>

                {filteredResults.length === 0 && matchingCourses.length === 0 ? (
                  <div className="rounded-[32px] border border-dashed border-[#e4d8c9] bg-white px-6 py-16 text-center dark:border-[#433128] dark:bg-[#171210]/70">
                    <p className="font-display text-2xl font-semibold tracking-tight text-[#2d1f15] dark:text-[#faf2ea]">
                      No subjects or classes matched “{query.trim()}”.
                    </p>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#837466] dark:text-[#c7b8a9]">
                      Try a broader keyword, a department code like ECSE, a specific class like CSCI-1200 or Data Structures, or change the active filters.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <div>
                        <h3 className="font-display text-2xl font-semibold tracking-tight text-[#2d1f15] dark:text-[#faf2ea]">
                          Subjects
                        </h3>
                        <p className="text-sm text-[#837466] dark:text-[#c7b8a9]">
                          Departments and subject areas that match your search.
                        </p>
                      </div>
                      {filteredResults.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-[#e4d8c9] bg-white px-6 py-10 text-sm text-[#837466] dark:border-[#433128] dark:bg-[#171210]/70 dark:text-[#c7b8a9]">
                          No subject matches for this query.
                        </div>
                      ) : (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                          {filteredResults.map(({ subject }) => {
                            const category = getCategoryMeta(subject.category);
                            if (!category) return null;
                            return (
                              <SubjectCard
                                key={subject.id}
                                subject={subject}
                                category={category}
                                courseCount={courseCounts[subject.code]}
                                query={query}
                              />
                            );
                          })}
                        </div>
                      )}
                    </section>

                    <section className="space-y-4">
                      <div>
                        <h3 className="font-display text-2xl font-semibold tracking-tight text-[#2d1f15] dark:text-[#faf2ea]">
                          Classes
                        </h3>
                        <p className="text-sm text-[#837466] dark:text-[#c7b8a9]">
                          Catalog class names and course codes that match your search, without replacing the subject results above.
                        </p>
                      </div>
                      {matchingCourses.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-[#e4d8c9] bg-white px-6 py-10 text-sm text-[#837466] dark:border-[#433128] dark:bg-[#171210]/70 dark:text-[#c7b8a9]">
                          No class matches for this query.
                        </div>
                      ) : (
                        <CourseSearchResults
                          results={matchingCourses.map(({ course, subject }) => ({ course, subject }))}
                          query={query}
                        />
                      )}
                    </section>
                  </div>
                )}
              </section>
            ) : (
              <div className="space-y-10">
                {visibleGroups.length === 0 ? (
                  <div className="rounded-[32px] border border-dashed border-[#e4d8c9] bg-white px-6 py-16 text-center dark:border-[#433128] dark:bg-[#171210]/70">
                    <p className="font-display text-2xl font-semibold tracking-tight text-[#2d1f15] dark:text-[#faf2ea]">
                      No subjects match the current filters.
                    </p>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#837466] dark:text-[#c7b8a9]">
                      Switch categories or search by code or name to keep exploring departments.
                    </p>
                  </div>
                ) : null}

                {visibleGroups.map((group) => (
                  <section key={group.category.id} className="space-y-5">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h2 className="font-display text-3xl font-semibold tracking-tight text-[#2d1f15] dark:text-[#faf2ea]">
                          {group.category.label}
                        </h2>
                      </div>
                      <p className="max-w-2xl text-sm text-[#837466] dark:text-[#c7b8a9]">
                        {group.category.description}
                      </p>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {group.subjects.map((subject) => (
                        <SubjectCard
                          key={subject.id}
                          subject={subject}
                          category={group.category}
                          courseCount={courseCounts[subject.code]}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <SubjectQuickOpenDialog
              open={isQuickFindOpen}
              onOpenChange={setIsQuickFindOpen}
              subjects={subjects}
            />
          </>
        )}
      </div>
    </main>
  );
}
