import * as React from "react";
import { useCatalog } from "@/context/schedule/schedule-context";
import { SubjectBrowserSkeleton } from "@/features/courses/components/SubjectBrowserSkeleton";
import { SubjectCard } from "@/features/courses/components/SubjectCard";
import { SubjectFilterBar } from "@/features/courses/components/SubjectFilterBar";
import { SubjectQuickOpenDialog } from "@/features/courses/components/SubjectQuickOpenDialog";
import { SubjectSearchBar } from "@/features/courses/components/SubjectSearchBar";
import {
  ALL_SUBJECTS_CATEGORY,
  filterSubjects,
  getCategoryCounts,
  getCategoryMeta,
  getCourseCountBySubject,
  getGroupedSubjects,
  type SubjectFilterCategory,
} from "@/lib/courses/subjects";
import { useSubjects } from "@/hooks/courses/useSubjects";

export default function SubjectBrowserPage() {
  const { subjects, loading, error } = useSubjects();
  const { catalog } = useCatalog();
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query);
  const [activeCategory, setActiveCategory] = React.useState<SubjectFilterCategory>(ALL_SUBJECTS_CATEGORY);
  const [featuredOnly, setFeaturedOnly] = React.useState(false);
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
    () => filterSubjects(subjects, deferredQuery, activeCategory, featuredOnly),
    [subjects, deferredQuery, activeCategory, featuredOnly],
  );
  const groupedSubjects = React.useMemo(() => getGroupedSubjects(subjects), [subjects]);
  const activeCategoryLabel =
    activeCategory === ALL_SUBJECTS_CATEGORY ? "All subjects" : getCategoryMeta(activeCategory)?.label ?? "Subjects";
  const visibleGroups = React.useMemo(
    () =>
      groupedSubjects
        .filter((group) => activeCategory === ALL_SUBJECTS_CATEGORY || group.category.id === activeCategory)
        .map((group) => ({
          ...group,
          subjects: featuredOnly ? group.subjects.filter((subject) => subject.featured) : group.subjects,
        }))
        .filter((group) => group.subjects.length > 0),
    [groupedSubjects, activeCategory, featuredOnly],
  );

  return (
    <main className="relative flex-1 overflow-x-hidden bg-slate-50 pb-16 text-slate-900 dark:bg-zinc-950 dark:text-slate-100">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-10 pt-8 sm:px-6 lg:px-8">

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
            <section className="w-full">
              <SubjectSearchBar
                query={query}
                onQueryChange={setQuery}
                onOpenQuickFind={() => setIsQuickFindOpen(true)}
              />
            </section>

            <SubjectFilterBar
              categories={categoryCounts}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              featuredOnly={featuredOnly}
              onFeaturedOnlyChange={setFeaturedOnly}
            />

            {deferredQuery.trim() ? (
              <section className="space-y-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {filteredResults.length} match{filteredResults.length === 1 ? "" : "es"} in {activeCategoryLabel}
                    </h2>
                  </div>
                  <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                    Matching across subject code, name, school, and aliases.
                  </p>
                </div>

                {filteredResults.length === 0 ? (
                  <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-950/60">
                    <p className="font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      No subjects matched “{query.trim()}”.
                    </p>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Try a broader keyword, a department code like ECSE, or change the active filters.
                    </p>
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
            ) : (
              <div className="space-y-10">
                {visibleGroups.length === 0 ? (
                  <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-950/60">
                    <p className="font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      No subjects match the current filters.
                    </p>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Clear the featured filter or switch categories to keep exploring departments.
                    </p>
                  </div>
                ) : null}

                {visibleGroups.map((group) => (
                  <section key={group.category.id} className="space-y-5">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                          {group.category.label}
                        </h2>
                      </div>
                      <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
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
