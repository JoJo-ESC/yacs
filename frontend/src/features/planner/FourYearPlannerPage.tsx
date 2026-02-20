import React, { useMemo, useState, useEffect } from "react";
import { GripVertical, Plus, Save } from "lucide-react";

// ---------------------- Types ----------------------
type Course = { id: string; title: string; credits: number; };
type PlacedCourse = Course & { key: string };
type TermId = `${"FALL"|"SPRING"|"SUMMER"} ${number}`;

const catalog: Course[] = [
  { id: "CSCI-1100", title: "Computer Science 1", credits: 4 },
  { id: "CSCI-1200", title: "Data Structures", credits: 4 },
  { id: "MATH-1010", title: "Calculus 1", credits: 4 },
  { id: "MATH-1020", title: "Calculus 2", credits: 4 },
  { id: "PHYS-1100", title: "Physics 1", credits: 4 },
  { id: "BIOL-1010", title: "Intro to Biology", credits: 4 },
  { id: "STSH-1110", title: "Science, Tech & Society", credits: 4 },
  { id: "IHSS-1200", title: "First-Year Writing", credits: 4 },
];

const requirementBuckets: { title: string; pickOne?: boolean; items: Course[] }[] = [
  {
    title: "Computer Science major",
    items: [
      { id: "CSCI-2200", title: "Foundations of CS", credits: 4 },
      { id: "CSCI-2500", title: "Computer Organization", credits: 4 },
      { id: "CSCI-2600", title: "Principles of Software", credits: 4 },
    ],
  },
  {
    title: "(PICK ONE) Physics 1",
    pickOne: true,
    items: [
      { id: "PHYS-1100", title: "Physics 1", credits: 4 },
      { id: "PHYS-1010", title: "Physics 1 (Alt)", credits: 4 },
    ],
  },
  {
    title: "Philosophy minor",
    items: [
      { id: "PHIL-2100", title: "Intro to Philosophy", credits: 4 },
      { id: "PHIL-2140", title: "Logic", credits: 4 },
      { id: "PHIL-4220", title: "Ethics", credits: 4 },
    ],
  },
];

// ---------------------- Utils ----------------------
function uid(prefix = "c"): string { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }
function courseToPlaced(c: Course): PlacedCourse { return { ...c, key: uid("pc") }; }
function termCredits(list: PlacedCourse[]): number { return list.reduce((s, c) => s + c.credits, 0); }

// simple 4-year skeleton
function defaultTerms(startFallYear = 2023): TermId[] {
  const out: TermId[] = [];
  for (let i = 0; i < 4; i++) {
    const y = startFallYear + i;
    out.push(`FALL ${y}`);
    out.push(`SPRING ${y + 1}`);
    out.push(`SUMMER ${y + 1}`);
  }
  return out;
}

// ---------------------- Components ----------------------
const HeaderBar: React.FC<{ total: number; max?: number; onSave: () => void; onAdd: () => void; }>
= ({ total, max = 128, onSave, onAdd }) => (
  <div className="sticky top-[68px] z-30 border-b border-slate-200/60 bg-white/85 px-3 py-3 backdrop-blur-xl shadow-sm shadow-slate-900/5 dark:border-border dark:bg-header/90">
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-muted">
      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-500 ease-out" style={{ width: `${Math.min((total / max) * 100, 100)}%` }} />
    </div>
    <div className="mt-3 flex items-center justify-between">
      <span className="text-sm font-medium text-slate-700 dark:text-foreground/90">{total} / {max} credits</span>
      <div className="flex gap-3">
        <button
          onClick={onAdd}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-border dark:bg-surface dark:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
        <button
          onClick={onSave}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-5 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 transition-all hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl hover:shadow-indigo-600/30"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  </div>
);

const TermColumn: React.FC<{
  id: TermId;
  items: PlacedCourse[];
  onDropCourse: (term: TermId, c: Course) => void;
  onRemove: (term: TermId, key: string) => void;
}> = ({ id, items, onDropCourse, onRemove }) => {
  const credits = termCredits(items);
  return (
    <div className="min-h-[160px] rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/5 dark:border-border dark:bg-surface">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-base font-semibold tracking-tight text-slate-900 dark:text-foreground">{id.split(" ")[0]} {id.split(" ")[1]}</div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-foreground/70">credits: {String(credits).padStart(2, "0")}</div>
        </div>
        {credits >= 20 && <span className="text-[16px]" style={{ color: "var(--footer)" }} title="Heavy load">❗</span>}
      </div>

      {/* Drop area */}
      <div
        className="mt-4 flex h-40 flex-col items-center justify-center gap-2 overflow-y-auto rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 dark:border-border dark:bg-background/60"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const payload = e.dataTransfer.getData("text/plain");
          if (!payload) return;
          try {
            const c = JSON.parse(payload) as Course;
            onDropCourse(id, c);
          } catch {}
        }}
      >
        {items.length === 0 && (
          <div className="text-sm text-slate-400 dark:text-foreground/60">
            Drop some classes here!
          </div>
        )}
        <ul className="w-full space-y-2 p-1.5">
          {items.map((c) => (
            <li key={c.key} className="group flex items-center justify-between rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50/50 px-2.5 py-2 shadow-sm shadow-indigo-500/5 dark:border-indigo-900/40 dark:from-indigo-900/30 dark:to-purple-900/25">
              <div className="flex min-w-0 items-start gap-2.5">
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400 transition-colors group-hover:text-indigo-600 dark:text-indigo-300 dark:group-hover:text-indigo-200" />
                <div className="truncate text-sm text-slate-800 dark:text-foreground" title={`${c.id} : ${c.title}`}>
                  <b>{c.id}</b> : {c.title}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-xs text-slate-500 opacity-0 transition-all hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:text-foreground/80 dark:hover:bg-red-950/40"
                  onClick={() => onRemove(id, c.key)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const CatalogCard: React.FC<{ c: Course }>= ({ c }) => {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div
      className={`group cursor-grab select-none rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50/50 px-3 py-2.5 text-foreground transition-all hover:shadow-md hover:shadow-indigo-500/10 dark:border-indigo-900/40 dark:from-indigo-900/30 dark:to-purple-900/25 ${
        isDragging ? "scale-95 opacity-55" : "opacity-100"
      }`}
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        e.dataTransfer.setData("text/plain", JSON.stringify(c));
      }}
      onDragEnd={() => setIsDragging(false)}
      title={`${c.id} • ${c.title}`}
    >
      <div className="flex items-start gap-2.5">
        <GripVertical className={`mt-0.5 h-4 w-4 shrink-0 transition-colors ${isDragging ? "text-blue-700 dark:text-blue-300" : "text-indigo-400 group-hover:text-indigo-600 dark:text-indigo-300 dark:group-hover:text-indigo-200"}`} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-900 dark:text-foreground">{c.id} : {c.title}</div>
          <div className="text-xs text-slate-500 dark:text-foreground/70">{c.credits} credits</div>
        </div>
      </div>
    </div>
  );
};

const RightSidebar: React.FC<{ }> = () => (
  <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-2 lg:h-[calc(100vh-16px)] overflow-auto space-y-4">
    {requirementBuckets.map((b, i) => (
      <div key={i} className="rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-900/5 dark:border-border dark:bg-surface">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 text-slate-900 dark:border-border dark:text-foreground">
          <span>{b.title}</span>
          {b.pickOne && <span className="text-xs" style={{ color: "var(--foreground)", opacity: 0.7 }}>(pick one)</span>}
        </div>
        <div className="space-y-2 p-3">
          {b.items.map((c) => (
            <CatalogCard key={c.id} c={c} />
          ))}
        </div>
      </div>
    ))}
  </aside>
);

// ---------------------- Main Page ----------------------
const STORAGE_KEY = "four_year_plan_v1";
type PlanState = Record<TermId, PlacedCourse[]>;

export default function FourYearPlannerPage() {
  const terms = useMemo(() => defaultTerms(2023), []);
  const [plan, setPlan] = useState<PlanState>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { return JSON.parse(raw); } catch {} }
    const empty: PlanState = Object.fromEntries(terms.map((t) => [t, []])) as PlanState;
    empty["FALL 2023"] = [courseToPlaced(catalog[0]), courseToPlaced(catalog[2]), courseToPlaced(catalog[5])];
    empty["SPRING 2024"] = [courseToPlaced(catalog[1]), courseToPlaced(catalog[3])];
    return empty;
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)); }, [plan]);
  const totalCredits = useMemo(() => Object.values(plan).flat().reduce((s, c) => s + c.credits, 0), [plan]);

  function handleDrop(term: TermId, c: Course)   { setPlan((p) => ({ ...p, [term]: [...p[term], courseToPlaced(c)] })); }
  function handleRemove(term: TermId, key: string){ setPlan((p) => ({ ...p, [term]: p[term].filter((x) => x.key !== key) })); }
  function handleSave() { alert("Plan saved locally (localStorage)"); }
  function handleAdd()  {
    const firstEmpty = terms.find((t) => plan[t].length === 0) ?? terms[0];
    handleDrop(firstEmpty as TermId, catalog[0]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 text-foreground dark:from-background dark:via-background dark:to-background">
      <HeaderBar total={totalCredits} onSave={handleSave} onAdd={handleAdd} />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        {/* Left: terms grid */}
        <main className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {terms.map((t) => (
              <TermColumn key={t} id={t} items={plan[t]} onDropCourse={handleDrop} onRemove={handleRemove} />
            ))}
          </div>

          {/* Notes card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-border dark:bg-surface">
            <div className="mb-2 text-sm font-semibold tracking-wide text-slate-900 dark:text-foreground">NOTES</div>
            <ul className="text-sm text-slate-600 dark:text-foreground/75">
              <li>All computer science majors must declare a concentration sophomore year.</li>
              <li>Meet with your advisor to confirm your four-year plan and requirements.</li>
              <li>YACS is not responsible for scheduling mishaps.</li>
            </ul>
          </div>
        </main>

        {/* Right: requirements / draggable catalog */}
        <RightSidebar />
      </div>

      {/* Bottom catalog scroller */}
      <div className="sticky bottom-0 border-t border-border bg-header/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-slate-700 dark:text-foreground/90">Catalog (drag to term)</div>
            <input
              placeholder="Search catalog…"
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-border dark:bg-input dark:text-[color:var(--input-foreground)] dark:placeholder:text-foreground/60"
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                const items = document.querySelectorAll<HTMLElement>("[data-catalog-item]");
                items.forEach((el) => {
                  const text = (el.dataset.text || "").toLowerCase();
                  el.style.display = text.includes(q) ? "" : "none";
                });
              }}
            />
          </div>
          <div className="grid grid-flow-col auto-cols-[260px] gap-2 overflow-x-auto pb-2">
            {catalog.map((c) => (
              <div key={c.id} data-catalog-item data-text={`${c.id} ${c.title}`}>
                <CatalogCard c={c} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
