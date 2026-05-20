import React, { useEffect, useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import { apiFetch } from "@/api/client";

// ---------------------- Types ----------------------
type Course = { id: string; title: string; credits: number };
type PlacedCourse = Course & { key: string };
type TermId = `${"FALL" | "SPRING"} ${number}`;

type ApiCourse = {
  subject: string;
  course_number: string;
  course_title: string;
  credit_hours: number;
};

// ---------------------- Utils ----------------------
function uid(): string { return Math.random().toString(36).slice(2, 9); }
function courseToPlaced(c: Course): PlacedCourse { return { ...c, key: uid() }; }
function termCredits(list: PlacedCourse[]): number { return list.reduce((s, c) => s + c.credits, 0); }

function defaultTerms(startFallYear = 2023): TermId[] {
  const out: TermId[] = [];
  for (let i = 0; i < 4; i++) {
    const y = startFallYear + i;
    out.push(`FALL ${y}`);
    out.push(`SPRING ${y + 1}`);
  }
  return out;
}

// ---------------------- TermColumn ----------------------
const TermColumn: React.FC<{
  id: TermId;
  items: PlacedCourse[];
  onDrop: (term: TermId, c: Course) => void;
  onRemove: (term: TermId, key: string) => void;
}> = ({ id, items, onDrop, onRemove }) => {
  const credits = termCredits(items);
  const [season, year] = id.split(" ");

  return (
    <div className="min-h-[160px] rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-base font-semibold tracking-tight text-slate-900 dark:text-neutral-100">
            {season} {year}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
            {credits} credits
          </div>
        </div>
        {credits > 21 && (
          <span className="text-base text-[#9B6B3F]" title="Heavy load">❗</span>
        )}
      </div>

      <div
        className="flex min-h-[120px] flex-col gap-2 rounded-xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 p-2 dark:border-[#303030] dark:bg-[#111111]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const payload = e.dataTransfer.getData("text/plain");
          if (!payload) return;
          try { onDrop(id, JSON.parse(payload) as Course); } catch {}
        }}
      >
        {items.length === 0 && (
          <p className="m-auto text-xs text-slate-400 dark:text-slate-500">
            Drag courses here
          </p>
        )}
        {items.map((c) => (
          <div
            key={c.key}
            className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm dark:border-[#303030] dark:bg-[#1a1a1a]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <GripVertical className="h-4 w-4 shrink-0 text-[#b08a66] dark:text-[#8c6542]" />
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-900 dark:text-neutral-100">
                  {c.id}
                </div>
                <div className="truncate text-xs text-slate-500 dark:text-neutral-400">
                  {c.title} · {c.credits} cr
                </div>
              </div>
            </div>
            <button
              onClick={() => onRemove(id, c.key)}
              className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 opacity-0 transition hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/40"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------- CourseSearchSidebar ----------------------
const CourseSearchSidebar: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch<{ data: ApiCourse[] }>(
          `/api/courses/search?q=${encodeURIComponent(q)}&per_page=80`
        );
        const seen = new Set<string>();
        const courses: Course[] = [];
        for (const c of data.data) {
          const id = `${c.subject}-${c.course_number}`;
          if (!seen.has(id)) {
            seen.add(id);
            courses.push({ id, title: c.course_title, credits: c.credit_hours });
          }
        }
        setResults(courses);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-2 lg:h-[calc(100vh-16px)] flex flex-col gap-3">
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-[#303030] dark:bg-[#171717]">
        <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-neutral-100">
          Course Search
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by course code or title..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[var(--app-accent)] focus:bg-white focus:ring-4 focus:ring-[var(--app-accent-ring)] dark:border-[#303030] dark:bg-[#101010] dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>

      <div className="flex-1 overflow-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-[#303030] dark:bg-[#171717]">
        {!query.trim() ? (
          <p className="p-4 text-sm text-slate-400 dark:text-neutral-500">
            Search for a course to add it to your plan.
          </p>
        ) : isLoading ? (
          <p className="p-4 text-sm text-slate-400 dark:text-neutral-500">Searching...</p>
        ) : results.length === 0 ? (
          <p className="p-4 text-sm text-slate-400 dark:text-neutral-500">No courses found.</p>
        ) : (
          <ul className="space-y-2 p-3">
            {results.map((c) => (
              <DraggableCourseCard key={c.id} c={c} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

const DraggableCourseCard: React.FC<{ c: Course }> = ({ c }) => {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <li
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        e.dataTransfer.setData("text/plain", JSON.stringify(c));
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`cursor-grab select-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-all hover:shadow-md dark:border-[#303030] dark:bg-[#171717] ${
        isDragging ? "scale-95 opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#b08a66] dark:text-[#8c6542]" />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-900 dark:text-neutral-100">{c.id}</div>
          <div className="truncate text-xs text-slate-500 dark:text-neutral-400">
            {c.title} · {c.credits} cr
          </div>
        </div>
      </div>
    </li>
  );
};

// ---------------------- Plan State ----------------------
const STORAGE_KEY = "four_year_plan_v1";
type PlanState = Record<TermId, PlacedCourse[]>;

function createEmptyPlan(terms: TermId[]): PlanState {
  return Object.fromEntries(terms.map((t) => [t, [] as PlacedCourse[]])) as PlanState;
}

function normalizeStoredPlan(terms: TermId[], parsed: unknown): PlanState {
  const base = createEmptyPlan(terms);
  if (!parsed || typeof parsed !== "object") return base;
  const stored = parsed as Record<string, unknown>;
  for (const term of terms) {
    if (Array.isArray(stored[term])) base[term] = stored[term] as PlacedCourse[];
  }
  return base;
}

// ---------------------- Main Page ----------------------
export default function FourYearPlannerPage() {
  const terms = useMemo(() => defaultTerms(2023), []);

  const [plan, setPlan] = useState<PlanState>(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try { return normalizeStoredPlan(terms, JSON.parse(raw)); } catch {}
    }
    return createEmptyPlan(terms);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  function handleDrop(term: TermId, c: Course) {
    setPlan((p) => ({ ...p, [term]: [...p[term], courseToPlaced(c)] }));
  }

  function handleRemove(term: TermId, key: string) {
    setPlan((p) => ({ ...p, [term]: p[term].filter((x) => x.key !== key) }));
  }

  return (
    <div className="min-h-screen bg-white text-foreground dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">

          {/* Term grid */}
          <main className="flex-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {terms.map((t) => (
                <TermColumn
                  key={t}
                  id={t}
                  items={plan[t]}
                  onDrop={handleDrop}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </main>

          {/* Course search */}
          <CourseSearchSidebar />

        </div>
      </div>
    </div>
  );
}
