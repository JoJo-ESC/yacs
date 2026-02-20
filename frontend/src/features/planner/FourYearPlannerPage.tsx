import React, { useMemo, useState, useEffect } from "react";
import { GripVertical, Plus, Save } from "lucide-react";

// ---------------------- Types ----------------------
type Course = { id: string; title: string; credits: number; };
type PlacedCourse = Course & { key: string };
type TermId = `${"FALL"|"SPRING"|"SUMMER"} ${number}`;
type RequirementItem = {
  label: string;
  credits: string;
  kind: "required" | "choice" | "elective" | "track" | "bucket";
};
type TermTemplate = { label: string; items: RequirementItem[] };
type YearTemplate = { label: string; terms: TermTemplate[] };
type MajorTemplate = {
  id: string;
  name: string;
  entry: string;
  years: YearTemplate[];
};
type MinorTemplate = {
  id: string;
  name: string;
  targetCredits: string;
  requirementTypes: string[];
  courses: Course[];
};

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

const majorTemplates: MajorTemplate[] = [{
  id: "csci-f25",
  name: "Computer Science (F25/S26 Entry)",
  entry: "Fall 2025 / Spring 2026",
  years: [
    {
      label: "First Year",
      terms: [
        {
          label: "Fall 2025",
          items: [
            { label: "CSCI-1100 Computer Science I", credits: "4", kind: "required" },
            { label: "MATH-1010 Calculus I", credits: "4", kind: "required" },
            { label: "PHYS-1100 Physics I", credits: "4", kind: "choice" },
            { label: "HASS Elective", credits: "4", kind: "elective" },
          ],
        },
        {
          label: "Spring 2026",
          items: [
            { label: "CSCI-1200 Data Structures", credits: "4", kind: "required" },
            { label: "MATH-1020 Calculus II", credits: "4", kind: "required" },
            { label: "BIOL-1010 Intro to Biology", credits: "3", kind: "choice" },
            { label: "BIOL-1015/1016 Biology Lab", credits: "1", kind: "choice" },
            { label: "HASS Elective", credits: "4", kind: "elective" },
          ],
        },
      ],
    },
    {
      label: "Second Year",
      terms: [
        {
          label: "Fall 2026",
          items: [
            { label: "CSCI-2200 Foundations of CS", credits: "4", kind: "required" },
            { label: "CSCI-2300/2800 Architecture & OS", credits: "4", kind: "required" },
            { label: "MATH-2010 Multivariable Calc", credits: "4", kind: "required" },
            { label: "HASS Elective", credits: "4", kind: "elective" },
            { label: "RCOS / URP", credits: "2-4", kind: "elective" },
          ],
        },
        {
          label: "Spring 2027",
          items: [
            { label: "CSCI-2300 Intro to Algorithms", credits: "4", kind: "required" },
            { label: "CSCI-2600 Principles of Software", credits: "4", kind: "required" },
            { label: "Math/Science Track Option", credits: "4", kind: "track" },
            { label: "HASS Elective", credits: "4", kind: "elective" },
            { label: "ADMN-1030 ARCH Exploration", credits: "0", kind: "required" },
          ],
        },
      ],
    },
    {
      label: "Third Year",
      terms: [
        {
          label: "Arch Summer 2027",
          items: [
            { label: "CSCI 4000-level Track Course", credits: "4", kind: "track" },
            { label: "HASS Elective", credits: "4", kind: "elective" },
            { label: "Free Elective", credits: "4", kind: "elective" },
            { label: "Free Elective", credits: "4", kind: "elective" },
          ],
        },
        {
          label: "Fall 2027 or Spring 2028",
          items: [
            { label: "CSCI 4000-level Track Course", credits: "4", kind: "track" },
            { label: "Science Option", credits: "4", kind: "track" },
            { label: "HASS Elective", credits: "4", kind: "elective" },
            { label: "Free Elective", credits: "4", kind: "elective" },
          ],
        },
      ],
    },
    {
      label: "Fourth Year",
      terms: [
        {
          label: "Fall 2028",
          items: [
            { label: "CSCI 4000-level Track Course", credits: "4", kind: "track" },
            { label: "CSCI 4000-level Track Course", credits: "4", kind: "track" },
            { label: "Free Elective", credits: "4", kind: "elective" },
            { label: "Free Elective", credits: "4", kind: "elective" },
          ],
        },
        {
          label: "Spring 2029",
          items: [
            { label: "CSCI 4000-level Track Course", credits: "4", kind: "track" },
            { label: "CSCI 4000-level Track Course", credits: "4", kind: "track" },
            { label: "Free Elective", credits: "4", kind: "elective" },
            { label: "Free Elective", credits: "4", kind: "elective" },
          ],
        },
      ],
    },
  ],
}];

const minorTemplates: MinorTemplate[] = [
  {
    id: "phil",
    name: "Philosophy Minor",
    targetCredits: "12-16",
    requirementTypes: [
      "Intro course",
      "Logic requirement",
      "History requirement",
      "Ethics requirement",
      "Two upper-level electives",
      "Capstone/seminar option",
    ],
    courses: [
      { id: "PHIL-2100", title: "Intro to Philosophy", credits: 4 },
      { id: "PHIL-2140", title: "Logic", credits: 4 },
      { id: "PHIL-4220", title: "Ethics", credits: 4 },
      { id: "PHIL-4XXX", title: "Upper-level Philosophy Elective", credits: 4 },
    ],
  },
  {
    id: "econ",
    name: "Economics Minor",
    targetCredits: "12-16",
    requirementTypes: [
      "Microeconomics",
      "Macroeconomics",
      "Statistics/econometrics",
      "Two upper-level ECON electives",
      "Policy/theory distribution",
      "Advisor-approved elective",
    ],
    courses: [
      { id: "ECON-2010", title: "Intermediate Microeconomics", credits: 4 },
      { id: "ECON-2020", title: "Intermediate Macroeconomics", credits: 4 },
      { id: "ECON-4130", title: "Econometrics", credits: 4 },
      { id: "ECON-4XXX", title: "Upper-level ECON Elective", credits: 4 },
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
      <span className="text-sm font-medium text-slate-700 dark:text-foreground">{total} / {max} credits</span>
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
    <div className="min-h-[160px] rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/5 dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-base font-semibold tracking-tight text-slate-900 dark:text-foreground">{id.split(" ")[0]} {id.split(" ")[1]}</div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-foreground/70">credits: {String(credits).padStart(2, "0")}</div>
        </div>
        {credits >= 20 && <span className="text-[16px]" style={{ color: "var(--footer)" }} title="Heavy load">❗</span>}
      </div>

      {/* Drop area */}
      <div
        className="mt-4 flex h-40 flex-col items-center justify-center gap-2 overflow-y-auto rounded-xl border-2 border-dashed border-slate-200/80 bg-indigo-50/40 dark:border-zinc-800 dark:bg-zinc-950/70"
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
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Drop some classes here!
          </div>
        )}
        <ul className="w-full space-y-2 p-1.5">
          {items.map((c) => (
            <li key={c.key} className="group flex items-center justify-between rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50/50 px-2.5 py-2 shadow-sm shadow-indigo-500/5 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
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
      className={`group cursor-grab select-none rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50/50 px-3 py-2.5 text-foreground transition-all hover:shadow-md hover:shadow-indigo-500/10 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 ${
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

function requirementKindClass(kind: RequirementItem["kind"]) {
  if (kind === "required") return "bg-emerald-500/20 text-emerald-700 border-emerald-700/70 dark:text-emerald-300";
  if (kind === "choice") return "bg-amber-500/20 text-amber-700 border-amber-700/70 dark:text-amber-300";
  if (kind === "track") return "bg-blue-500/20 text-blue-700 border-blue-700/70 dark:text-blue-300";
  if (kind === "bucket") return "bg-violet-500/20 text-violet-700 border-violet-700/70 dark:text-violet-300";
  return "bg-zinc-500/20 text-zinc-700 border-zinc-700/70 dark:text-zinc-300";
}

const RightSidebar: React.FC<{ }> = () => {
  const [tab, setTab] = useState<"requirements" | "catalog">("requirements");
  const [query, setQuery] = useState("");
  const NONE_MAJOR_ID = "__none_major__";
  const NONE_MINOR_ID = "__none_minor__";
  const [selectedMajorId, setSelectedMajorId] = useState<string>(majorTemplates[0]?.id ?? "");
  const [selectedMinorId, setSelectedMinorId] = useState<string>(minorTemplates[0]?.id ?? "");

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((c) => `${c.id} ${c.title}`.toLowerCase().includes(q));
  }, [query]);
  const selectedMajor = useMemo(
    () => majorTemplates.find((m) => m.id === selectedMajorId),
    [selectedMajorId]
  );
  const selectedMinor = useMemo(
    () => minorTemplates.find((m) => m.id === selectedMinorId),
    [selectedMinorId]
  );

  return (
    <aside className="w-full lg:w-96 shrink-0 lg:sticky lg:top-2 lg:h-[calc(100vh-16px)] overflow-auto space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm shadow-slate-900/5 dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab("requirements")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              tab === "requirements"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            Requirements
          </button>
          <button
            type="button"
            onClick={() => setTab("catalog")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              tab === "catalog"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            Catalog
          </button>
        </div>
      </div>

      {tab === "requirements" ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">Major Template</div>
            <select
              value={selectedMajorId}
              onChange={(e) => setSelectedMajorId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-foreground dark:focus:border-zinc-700 dark:focus:ring-zinc-800/40"
            >
              <option value={NONE_MAJOR_ID}>(None)</option>
              {majorTemplates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {selectedMajor && (
              <div className="mt-2 text-sm text-slate-600 dark:text-zinc-400">Entry: {selectedMajor.entry}</div>
            )}
          </div>

          {selectedMajor ? (
            selectedMajor.years.map((year) => (
              <div
                key={year.label}
                className="rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-900/5 dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950"
              >
                <div className="border-b border-slate-200/70 px-4 py-3 text-slate-900 dark:border-zinc-800 dark:text-foreground">
                  <div className="text-base font-semibold">{year.label}</div>
                </div>
                <div className="space-y-3 p-3">
                  {year.terms.map((term) => (
                    <div key={term.label} className="rounded-xl border border-slate-200/70 p-3 dark:border-zinc-800">
                      <div className="mb-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">{term.label}</div>
                      <div className="space-y-2">
                        {term.items.map((item, idx) => (
                          <div key={`${term.label}-${idx}`} className="flex items-start justify-between gap-2 rounded-lg border border-zinc-200/80 px-2 py-2 dark:border-zinc-800">
                            <div className="text-xs text-slate-700 dark:text-zinc-200">{item.label}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 dark:text-zinc-400">{item.credits}</span>
                              <span className={`rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${requirementKindClass(item.kind)}`}>
                                {item.kind}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-zinc-700 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 dark:text-zinc-400">
              Select a major template to view year-by-year requirements.
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">Minor Template</div>
            <select
              value={selectedMinorId}
              onChange={(e) => setSelectedMinorId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-foreground dark:focus:border-zinc-700 dark:focus:ring-zinc-800/40"
            >
              <option value={NONE_MINOR_ID}>(None)</option>
              {minorTemplates.map((minor) => (
                <option key={minor.id} value={minor.id}>
                  {minor.name}
                </option>
              ))}
            </select>
          </div>

          {selectedMinor && (
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-900/5 dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950">
              <div className="border-b border-slate-200/70 px-4 py-3 text-slate-900 dark:border-zinc-800 dark:text-foreground">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold">{selectedMinor.name}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">{selectedMinor.targetCredits} credits</div>
                </div>
              </div>
              <div className="space-y-4 p-3">
                <div className="rounded-xl border border-slate-200/70 p-3 dark:border-zinc-800">
                  <div className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">Required Buckets</div>
                  <div className="space-y-2">
                    {selectedMinor.requirementTypes.map((req) => (
                      <div
                        key={req}
                        className="flex items-start justify-between gap-2 rounded-lg border border-zinc-200/80 px-2 py-2 dark:border-zinc-800"
                      >
                        <div className="text-xs text-slate-700 dark:text-zinc-200">{req}</div>
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${requirementKindClass("bucket")}`}>
                          bucket
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/70 p-3 dark:border-zinc-800">
                  <div className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400">Drag Minor Courses</div>
                  <div className="space-y-2">
                    {selectedMinor.courses.map((course) => (
                      <CatalogCard key={course.id} c={course} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedMinor && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-zinc-700 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 dark:text-zinc-400">
              Select a minor template to view required buckets and draggable minor courses.
            </div>
          )}

        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-900/5 dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950">
          <div className="border-b border-slate-200/70 px-4 py-3 dark:border-zinc-800">
            <div className="text-base font-semibold text-slate-900 dark:text-foreground">All Catalog Courses</div>
            <div className="mt-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by course id or title..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-foreground dark:placeholder:text-zinc-400 dark:focus:border-zinc-700 dark:focus:ring-zinc-800/40"
              />
            </div>
          </div>
          <div className="max-h-[70vh] space-y-2 overflow-auto p-3">
            {filteredCatalog.map((c) => (
              <CatalogCard key={c.id} c={c} />
            ))}
            {filteredCatalog.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                No matching courses.
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

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

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_380px]">
        {/* Left: terms grid */}
        <main className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {terms.map((t) => (
              <TermColumn key={t} id={t} items={plan[t]} onDropCourse={handleDrop} onRemove={handleRemove} />
            ))}
          </div>

          {/* Notes card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-zinc-800 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950">
            <div className="mb-2 text-sm font-semibold tracking-wide text-slate-900 dark:text-foreground">NOTES</div>
            <ul className="text-sm text-slate-600 dark:text-foreground/75">
              <li>All computer science majors must declare a concentration sophomore year.</li>
              <li>Meet with your advisor to confirm your four-year plan and requirements.</li>
              <li>YACS is not responsible for scheduling mishaps.</li>
            </ul>
          </div>
        </main>

        {/* Right: requirements + catalog tabs */}
        <RightSidebar />
      </div>
    </div>
  );
}
