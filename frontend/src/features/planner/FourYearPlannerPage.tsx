import React, { useMemo, useState, useEffect } from "react";
import { GripVertical, Plus, Save } from "lucide-react";
import { firstInteger } from "@/lib/planner/creditParsing";

// ---------------------- Types ----------------------
type Course = { id: string; title: string; credits: number; };
type PlacedCourse = Course & { key: string };
type TermId = `${"FALL"|"SPRING"|"SUMMER"} ${number}`;
type RequirementItem = {
  label: string;
  credits: string;
  kind: "required" | "choice" | "elective" | "track";
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
  description?: string;
  requirementSections: { heading: string; items: RequirementItem[] }[];
};
type PathwayTemplate = {
  id: string;
  name: string;
  targetCredits: string;
  description: string;
  introRequirement?: RequirementItem;
  remainingCreditRule: string;
  sampleCourses: Course[];
  compatibleMinorIds: string[];
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
    description: "Students complete 12-16 credits in Philosophy with foundation and upper-level coverage.",
    requirementSections: [
      {
        heading: "Required",
        items: [
          { label: "PHIL 2100 - Intro to Philosophy", credits: "4", kind: "required" },
          { label: "PHIL 2140 - Logic", credits: "4", kind: "required" },
          { label: "One ethics-focused PHIL course", credits: "4", kind: "required" },
        ],
      },
      {
        heading: "Remaining credits from the following options",
        items: [
          { label: "Any 4000-level PHIL course", credits: "4", kind: "choice" },
          { label: "Advisor-approved PHIL seminar or capstone", credits: "4", kind: "choice" },
        ],
      },
    ],
  },
  {
    id: "econ",
    name: "Economics Minor",
    targetCredits: "16",
    description: "Students must complete 16 credits for the Economics Minor.",
    requirementSections: [
      {
        heading: "Required",
        items: [
          { label: "INQR 1200 - Principles of Economics or ECON 1200 - Introductory Economics", credits: "4", kind: "required" },
          { label: "ECON 2010 - Intermediate Microeconomic Theory", credits: "4", kind: "required" },
        ],
      },
      {
        heading: "Remaining credits from the following options",
        items: [
          { label: "Any 2000-level Economics course", credits: "4", kind: "choice" },
          { label: "Any 4000-level Economics course", credits: "4", kind: "choice" },
        ],
      },
    ],
  },
];

const pathwayTemplates: PathwayTemplate[] = [
  {
    id: "econ-pathway",
    name: "Economics Pathway",
    targetCredits: "12",
    description:
      "Economics is the study of human behavior, incentives, markets, and governments. Students learn models of decision-making, market dynamics, policy-making, globalization, and finance.",
    introRequirement: {
      label: "INQR 1200 (or transfer credit for ECON 1200) is required.",
      credits: "4",
      kind: "required",
    },
    remainingCreditRule:
      "Choose remaining credits from acceptable ECON 2000/4000-level courses, excluding ECON 2940 and ECON 2941.",
    sampleCourses: [
      { id: "ECON-2010", title: "Intermediate Microeconomic Theory", credits: 4 },
      { id: "ECON-2020", title: "Intermediate Macroeconomic Theory", credits: 4 },
      { id: "ECON-2100", title: "Economic Data Analysis and Applications", credits: 4 },
      { id: "ECON-4570", title: "Econometrics", credits: 4 },
    ],
    compatibleMinorIds: ["econ"],
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
const plannerPickerClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-[var(--app-accent)] focus:bg-white focus:ring-4 focus:ring-[var(--app-accent-ring)] dark:border-[#303030] dark:bg-[#101010] dark:text-neutral-100";

const plannerActiveTabClass =
  "border-[#dfc9ae] bg-[#f8f2ea] text-[#7a5230] shadow-sm dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6]";

const HeaderBar: React.FC<{ total: number; max?: number; onSave: () => void; onAdd: () => void; }>
= ({ total, max = 128, onSave, onAdd }) => {
  const progress = Math.min((total / max) * 100, 100);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Credit Progress</span>
            <span className="inline-flex items-center rounded-full border border-[color:var(--app-border)] bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-[#303030] dark:bg-[#1a1a1a] dark:text-neutral-300">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative flex-1">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#262626]">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%`, backgroundColor: "var(--app-accent)", opacity: 0.85 }}
                />
              </div>
              <span
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white shadow-sm dark:border-[#151515]"
                style={{
                  left: `clamp(0.5rem, calc(${progress}% - 0.5rem), calc(100% - 0.5rem))`,
                  backgroundColor: "var(--app-accent)",
                }}
              />
            </div>
            <span className="shrink-0 text-sm font-medium text-slate-700 dark:text-neutral-200">{total} / {max}</span>
          </div>
        </div>

        <div className="flex gap-3 self-end md:self-auto">
          <button
            onClick={onAdd}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-[#303030] dark:bg-[#171717] dark:text-neutral-100 dark:hover:bg-[#222222]"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
          <button
            onClick={onSave}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfc9ae] bg-[#f8f2ea] px-5 text-sm font-medium text-[#7a5230] shadow-sm transition-all hover:bg-[#f4ebe0] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6] dark:hover:bg-[#422f22]"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const TermColumn: React.FC<{
  id: TermId;
  items: PlacedCourse[];
  onDropCourse: (term: TermId, c: Course) => void;
  onRemove: (term: TermId, key: string) => void;
}> = ({ id, items, onDropCourse, onRemove }) => {
  const credits = termCredits(items);
  return (
    <div className="min-h-[160px] rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-base font-semibold tracking-tight text-slate-900 dark:text-neutral-100">{id.split(" ")[0]} {id.split(" ")[1]}</div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">credits: {String(credits).padStart(2, "0")}</div>
        </div>
        {credits >= 20 && <span className="text-[16px] text-[#9B6B3F]" title="Heavy load">❗</span>}
      </div>

      {/* Drop area */}
      <div
        className="mt-4 flex h-40 flex-col items-center justify-center gap-2 overflow-y-auto rounded-xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 dark:border-[#303030] dark:bg-[#111111]"
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
            <li key={c.key} className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#1a1a1a]">
              <div className="flex min-w-0 items-start gap-2.5">
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#b08a66] transition-colors group-hover:text-[#9B6B3F] dark:text-[#8c6542] dark:group-hover:text-[#b08a66]" />
                <div className="truncate text-sm text-slate-800 dark:text-neutral-100" title={`${c.id} : ${c.title}`}>
                  <b>{c.id}</b> : {c.title}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-xs text-slate-500 opacity-0 transition-all hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:text-neutral-400 dark:hover:bg-red-950/40"
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
      className={`group cursor-grab select-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-foreground transition-all hover:shadow-md hover:shadow-slate-900/10 dark:border-[#303030] dark:bg-[#171717] ${
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
        <GripVertical className={`mt-0.5 h-4 w-4 shrink-0 transition-colors ${isDragging ? "text-[#9B6B3F] dark:text-[#b08a66]" : "text-[#b08a66] group-hover:text-[#9B6B3F] dark:text-[#8c6542] dark:group-hover:text-[#b08a66]"}`} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">{c.id} : {c.title}</div>
          <div className="text-xs text-slate-500 dark:text-neutral-400">{c.credits} credits</div>
        </div>
      </div>
    </div>
  );
};

function requirementKindClass(kind: RequirementItem["kind"]) {
  if (kind === "required") return "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900";
  if (kind === "choice") return "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900";
  if (kind === "track") return "bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-900";
  return "bg-slate-50 text-slate-600 border-slate-300 dark:bg-[#101010] dark:text-neutral-300 dark:border-[#4a4a4a]";
}

const RequirementRow: React.FC<{ item: RequirementItem }> = ({ item }) => (
  <div className="flex items-start justify-between gap-2 rounded-lg border border-slate-200/80 px-2 py-2 dark:border-[#303030] dark:bg-[#101010]">
    <div className="text-xs text-slate-700 dark:text-neutral-200">{item.label}</div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-neutral-400">{item.credits}</span>
      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${requirementKindClass(item.kind)}`}>
        {item.kind}
      </span>
    </div>
  </div>
);

const RightSidebar: React.FC<{ }> = () => {
  const [tab, setTab] = useState<"requirements" | "catalog">("requirements");
  const [query, setQuery] = useState("");
  const NONE_MAJOR_ID = "__none_major__";
  const NONE_MINOR_ID = "__none_minor__";
  const NONE_PATHWAY_ID = "__none_pathway__";
  const [selectedMajorId, setSelectedMajorId] = useState<string>(majorTemplates[0]?.id ?? "");
  const [selectedMinorId, setSelectedMinorId] = useState<string>(minorTemplates[0]?.id ?? "");
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>(pathwayTemplates[0]?.id ?? "");

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
  const selectedPathway = useMemo(
    () => pathwayTemplates.find((p) => p.id === selectedPathwayId),
    [selectedPathwayId]
  );
  const compatibleMinors = useMemo(
    () => minorTemplates.filter((minor) => selectedPathway?.compatibleMinorIds.includes(minor.id)),
    [selectedPathway]
  );
  const pathwayRemainingCredits = useMemo(() => {
    if (!selectedPathway) return "";
    const targetCredits = firstInteger(selectedPathway.targetCredits);
    const introCredits = selectedPathway.introRequirement ? firstInteger(selectedPathway.introRequirement.credits) : null;
    if (targetCredits === null) return selectedPathway.targetCredits;
    if (introCredits === null) return String(targetCredits);
    return String(Math.max(targetCredits - introCredits, 0));
  }, [selectedPathway]);

  return (
    <aside className="w-full lg:w-96 shrink-0 lg:sticky lg:top-2 lg:h-[calc(100vh-16px)] overflow-auto space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab("requirements")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              tab === "requirements"
                ? plannerActiveTabClass
                : "bg-slate-100 text-slate-700 dark:bg-[#101010] dark:text-neutral-300"
            }`}
          >
            Requirements
          </button>
          <button
            type="button"
            onClick={() => setTab("catalog")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              tab === "catalog"
                ? plannerActiveTabClass
                : "bg-slate-100 text-slate-700 dark:bg-[#101010] dark:text-neutral-300"
            }`}
          >
            Catalog
          </button>
        </div>
      </div>

      {tab === "requirements" ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">Major Template</div>
            <select
              value={selectedMajorId}
              onChange={(e) => setSelectedMajorId(e.target.value)}
              className={plannerPickerClass}
            >
              <option value={NONE_MAJOR_ID}>(None)</option>
              {majorTemplates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {selectedMajor && (
              <div className="mt-2 text-sm text-slate-600 dark:text-neutral-400">Entry: {selectedMajor.entry}</div>
            )}
          </div>

          {selectedMajor ? (
            selectedMajor.years.map((year) => (
              <div
                key={year.label}
                className="rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]"
              >
                <div className="border-b border-slate-200/70 px-4 py-3 text-slate-900 dark:border-[#303030] dark:text-neutral-100">
                  <div className="text-base font-semibold">{year.label}</div>
                </div>
                <div className="space-y-3 p-3">
                  {year.terms.map((term) => (
                    <div key={term.label} className="rounded-xl border border-slate-200/70 p-3 dark:border-[#303030] dark:bg-[#101010]">
                      <div className="mb-2 text-sm font-semibold text-slate-800 dark:text-neutral-200">{term.label}</div>
                      <div className="space-y-2">
                        {term.items.map((item, idx) => (
                          <RequirementRow key={`${term.label}-${idx}`} item={item} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-[#303030] dark:bg-[#171717] dark:text-neutral-400">
              Select a major template to view year-by-year requirements.
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">HASS Pathway</div>
            <select
              value={selectedPathwayId}
              onChange={(e) => setSelectedPathwayId(e.target.value)}
              className={plannerPickerClass}
            >
              <option value={NONE_PATHWAY_ID}>(None)</option>
              {pathwayTemplates.map((pathway) => (
                <option key={pathway.id} value={pathway.id}>
                  {pathway.name}
                </option>
              ))}
            </select>
          </div>

          {selectedPathway ? (
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
              <div className="border-b border-slate-200/70 px-4 py-3 text-slate-900 dark:border-[#303030] dark:text-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold">{selectedPathway.name}</div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">{selectedPathway.targetCredits} credits</div>
                </div>
              </div>
              <div className="space-y-3 p-3">
                <p className="text-sm text-slate-700 dark:text-neutral-300">{selectedPathway.description}</p>
                {selectedPathway.introRequirement && (
                  <RequirementRow item={selectedPathway.introRequirement} />
                )}
                <RequirementRow
                  item={{
                    label: `Remaining credits rule: ${selectedPathway.remainingCreditRule}`,
                    credits: pathwayRemainingCredits,
                    kind: "choice",
                  }}
                />
                <div className="rounded-xl border border-slate-200/70 p-3 dark:border-[#303030] dark:bg-[#101010]">
                  <div className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">Sample Courses</div>
                  <div className="space-y-2">
                    {selectedPathway.sampleCourses.map((course) => (
                      <RequirementRow
                        key={course.id}
                        item={{
                          label: `${course.id} - ${course.title}`,
                          credits: String(course.credits),
                          kind: "choice",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/70 p-3 dark:border-[#303030] dark:bg-[#101010]">
                  <div className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">Compatible Minor</div>
                  {compatibleMinors.length > 0 ? (
                    <div className="space-y-2">
                      {compatibleMinors.map((minor) => (
                        <RequirementRow
                          key={minor.id}
                          item={{
                            label: `${minor.name} (often one additional course beyond pathway credits)`,
                            credits: "4",
                            kind: "elective",
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-700 dark:text-neutral-200">
                      No compatible minors configured for this pathway.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-[#303030] dark:bg-[#171717] dark:text-neutral-400">
              Select a pathway to view 12-credit requirement details and compatible minors.
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
            <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">Minor Template</div>
            <select
              value={selectedMinorId}
              onChange={(e) => setSelectedMinorId(e.target.value)}
              className={plannerPickerClass}
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
            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
              <div className="border-b border-slate-200/70 px-4 py-3 text-slate-900 dark:border-[#303030] dark:text-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold">{selectedMinor.name}</div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">{selectedMinor.targetCredits} credits</div>
                </div>
              </div>
              <div className="space-y-4 p-3">
                {selectedMinor.description && (
                  <p className="text-sm text-slate-700 dark:text-neutral-300">{selectedMinor.description}</p>
                )}
                {selectedMinor.requirementSections.map((section) => (
                  <div key={section.heading} className="rounded-xl border border-slate-200/70 p-3 dark:border-[#303030] dark:bg-[#101010]">
                    <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-neutral-100">{section.heading}</div>
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <RequirementRow key={`${section.heading}-${item.label}`} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-3 text-xs text-slate-600 dark:border-[#303030] dark:bg-[#101010] dark:text-neutral-300">
                  To add minor courses to your plan, use the Catalog tab and drag courses into terms.
                </div>
              </div>
            </div>
          )}

          {!selectedMinor && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-[#303030] dark:bg-[#171717] dark:text-neutral-400">
              Select a minor template to view requirement details.
            </div>
          )}

        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
          <div className="border-b border-slate-200/70 px-4 py-3 dark:border-[#303030]">
            <div className="text-base font-semibold text-slate-900 dark:text-neutral-100">All Catalog Courses</div>
            <div className="mt-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by course id or title..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[var(--app-accent)] focus:bg-white focus:ring-4 focus:ring-[var(--app-accent-ring)] dark:border-[#303030] dark:bg-[#101010] dark:text-neutral-100 dark:placeholder:text-neutral-500"
              />
            </div>
          </div>
          <div className="max-h-[70vh] space-y-2 overflow-auto p-3">
            {filteredCatalog.map((c) => (
              <CatalogCard key={c.id} c={c} />
            ))}
            {filteredCatalog.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-[#303030] dark:text-neutral-400">
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

function createEmptyPlan(terms: TermId[]): PlanState {
  return Object.fromEntries(terms.map((t) => [t, [] as PlacedCourse[]])) as PlanState;
}

function createDemoPlan(terms: TermId[]): PlanState {
  const empty = createEmptyPlan(terms);
  empty["FALL 2023"] = [courseToPlaced(catalog[0]), courseToPlaced(catalog[2]), courseToPlaced(catalog[5])];
  empty["SPRING 2024"] = [courseToPlaced(catalog[1]), courseToPlaced(catalog[3])];
  return empty;
}

function normalizeStoredPlan(terms: TermId[], parsed: unknown): PlanState {
  const base = createEmptyPlan(terms);
  if (!parsed || typeof parsed !== "object") return base;
  const stored = parsed as Record<string, unknown>;
  for (const term of terms) {
    if (Array.isArray(stored[term])) {
      base[term] = stored[term] as PlacedCourse[];
    }
  }
  return base;
}

export default function FourYearPlannerPage() {
  const terms = useMemo(() => defaultTerms(2023), []);
  const [plan, setPlan] = useState<PlanState>(() => {
    if (typeof window === "undefined") return createDemoPlan(terms);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return normalizeStoredPlan(terms, JSON.parse(raw));
      } catch {}
    }
    return createDemoPlan(terms);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);
  const totalCredits = useMemo(() => Object.values(plan).flat().reduce((s, c) => s + c.credits, 0), [plan]);

  function handleDrop(term: TermId, c: Course)   { setPlan((p) => ({ ...p, [term]: [...p[term], courseToPlaced(c)] })); }
  function handleRemove(term: TermId, key: string){ setPlan((p) => ({ ...p, [term]: p[term].filter((x) => x.key !== key) })); }
  function handleSave() { alert("Plan saved locally (localStorage)"); }
  function handleAdd()  {
    const firstEmpty = terms.find((t) => plan[t].length === 0) ?? terms[0];
    handleDrop(firstEmpty, catalog[0]);
  }

  return (
    <div className="min-h-screen bg-white text-foreground dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <HeaderBar total={totalCredits} onSave={handleSave} onAdd={handleAdd} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: terms grid */}
          <main className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {terms.map((t) => (
                <TermColumn key={t} id={t} items={plan[t]} onDropCourse={handleDrop} onRemove={handleRemove} />
              ))}
            </div>

            {/* Notes card */}
            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-[#303030] dark:bg-[#171717]">
              <div className="mb-2 text-sm font-semibold tracking-wide text-slate-900 dark:text-neutral-100">NOTES</div>
              <ul className="text-sm text-slate-600 dark:text-neutral-300">
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
    </div>
  );
}
