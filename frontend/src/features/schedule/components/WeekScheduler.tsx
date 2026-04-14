import React, { useMemo, useRef, useEffect } from "react";
import { useSchedule } from "@/context/schedule/schedule-context";
import type { Course } from "@/types/schedule";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Mon, 6=Sun

export type WeekSchedulerProps = {
  events?: Array<{
    key: string;
    id: string;
    title: string;
    location?: string;
    day: DayIndex;
    start: string;
    end: string;
    colorClass?: string;
  }>;
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  showWeekend?: boolean;
  onEventClick?: (ev: any) => void;
};

type Interval = {
  key: string;
  id: string;
  day: DayIndex;
  startMin: number;
  endMin: number;
};

export const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const PALETTE = [
  "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-100",
  "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-100",
  "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100",
  "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-100",
  "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-100",
  "border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-900/70 dark:bg-cyan-950/40 dark:text-cyan-100",
  "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900 dark:border-fuchsia-900/70 dark:bg-fuchsia-950/40 dark:text-fuchsia-100",
  "border-lime-200 bg-lime-50 text-lime-900 dark:border-lime-900/70 dark:bg-lime-950/40 dark:text-lime-100",
] as const;

function useCourseColors(courseIds: string[]) {
  const mapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const setIds = new Set(courseIds);
    for (const key of Array.from(mapRef.current.keys())) {
      if (!setIds.has(key)) mapRef.current.delete(key);
    }
    if (courseIds.length === 0) mapRef.current.clear();
  }, [courseIds]);

  const getColor = (id: string) => {
    const m = mapRef.current;
    const existing = m.get(id);
    if (existing) return existing;
    const next = PALETTE[m.size % PALETTE.length];
    m.set(id, next);
    return next;
  };

  return getColor;
}

export function parseTimeToMinutes(t: string): number {
  if (!t) return 0;
  const s = t.trim().toUpperCase();
  const ampm = s.match(/^(\d{1,2}):(\d{2})(AM|PM)$/);
  if (ampm) {
    let hh = parseInt(ampm[1], 10);
    const mm = parseInt(ampm[2], 10);
    const mer = ampm[3];
    if (mer === "AM") {
      if (hh === 12) hh = 0;
    } else {
      if (hh !== 12) hh += 12;
    }
    return hh * 60 + mm;
  }
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const hh = parseInt(m24[1], 10);
    const mm = parseInt(m24[2], 10);
    return hh * 60 + mm;
  }
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function formatTime12h(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const am = h24 < 12;
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  if (m === 0) return `${h12}${am ? "AM" : "PM"}`;
  return `${h12}:${String(m).padStart(2, "0")}${am ? "AM" : "PM"}`;
}

export function formatClock12h(hhmm: string): string {
  return formatTime12h(parseTimeToMinutes(hhmm));
}

export function computeEventPosition(start: string, end: string, startHour: number, endHour: number) {
  const s = parseTimeToMinutes(start);
  const en = parseTimeToMinutes(end);
  const gridStart = startHour * 60;
  const gridEnd = endHour * 60;
  const clampedStart = clamp(s, gridStart, gridEnd);
  const clampedEnd = clamp(en, gridStart, gridEnd);
  const duration = Math.max(0, clampedEnd - clampedStart);
  const totalMinutes = (endHour - startHour) * 60;
  const topPct = ((clampedStart - gridStart) / totalMinutes) * 100;
  const heightPct = (duration / totalMinutes) * 100;
  return { topPct, heightPct, duration };
}

function clampToGrid(mins: number, startHour: number, endHour: number) {
  return clamp(mins, startHour * 60, endHour * 60);
}

type RenderEvent = {
  key: string;
  id: string;
  title: string;
  location?: string;
  colorClass?: string;
  day: DayIndex;
  start: string;
  end: string;
};

const DAY_MAP: Record<string, DayIndex> = { M: 0, T: 1, W: 2, R: 3, F: 4, S: 5, U: 6 };

function expandCoursesToRenderEvents(courses: Course[]): RenderEvent[] {
  const out: RenderEvent[] = [];
  for (const c of courses) {
    for (const m of c.meetings) {
      for (const d of m.days) {
        const dayIdx = DAY_MAP[d];
        if (dayIdx === undefined) continue;
        out.push({
          key: `${c.id}-${m.section}-${d}`,
          id: c.id,
          title: c.title,
          location: m.location,
          start: m.start,
          end: m.end,
          day: dayIdx,
        });
      }
    }
  }
  return out;
}

function toInterval(
  e: RenderEvent,
  startHour: number,
  endHour: number
): Interval | null {
  const s = clampToGrid(parseTimeToMinutes(e.start), startHour, endHour);
  const en = clampToGrid(parseTimeToMinutes(e.end), startHour, endHour);
  if (en <= s) return null;
  return { key: e.key, id: e.id, day: e.day, startMin: s, endMin: en };
}

function computeConflictingEventKeys(
  events: RenderEvent[],
  startHour: number,
  endHour: number,
  daysToRender: number
): Set<string> {
  const conflictKeys = new Set<string>();

  for (let d = 0; d < daysToRender; d++) {
    const intervals = events
      .filter((e) => e.day === d)
      .map((e) => toInterval(e, startHour, endHour))
      .filter((x): x is Interval => x !== null)
      .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

    const active: Interval[] = [];
    let head = 0;

    for (const curr of intervals) {
      while (head < active.length && active[head].endMin <= curr.startMin) head++;

      if (head < active.length) {
        conflictKeys.add(curr.key);
        for (let i = head; i < active.length; i++) {
          conflictKeys.add(active[i].key);
        }
      }

      active.push(curr);

      let i = active.length - 1;
      while (i - 1 >= head && active[i - 1].endMin > active[i].endMin) {
        const tmp = active[i - 1];
        active[i - 1] = active[i];
        active[i] = tmp;
        i--;
      }
    }
  }

  return conflictKeys;
}

export default function WeekScheduler({
  events,
  startHour = 8,
  endHour = 20,
  slotMinutes = 60,
  showWeekend = true,
  onEventClick,
}: WeekSchedulerProps) {
  const { courses } = useSchedule();
  const daysToRender = showWeekend ? 7 : 5;
  const totalMinutes = (endHour - startHour) * 60;

  const eventsExpanded: RenderEvent[] = useMemo(() => {
    return events && events.length ? (events as RenderEvent[]) : expandCoursesToRenderEvents(courses);
  }, [events, courses]);

  const courseIds = useMemo(
    () => Array.from(new Set(eventsExpanded.map((e) => e.id))),
    [eventsExpanded]
  );
  const getColor = useCourseColors(courseIds);

  const layout = useMemo(() => {
    return (eventsExpanded || [])
      .map((e) => {
        const { topPct, heightPct } = computeEventPosition(e.start, e.end, startHour, endHour);
        return { ...e, topPct, heightPct, colorClass: getColor(e.id) };
      })
      .filter((e) => e.heightPct > 0);
  }, [eventsExpanded, startHour, endHour, getColor]);

  const timeMarks = useMemo(() => {
    const marks: { label: string; minutes: number }[] = [];
    const step = slotMinutes;
    for (let t = startHour * 60; t <= endHour * 60; t += step) {
      const hh = Math.floor(t / 60);
      const mm = t % 60;
      marks.push({
        label: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
        minutes: t,
      });
    }
    return marks;
  }, [startHour, endHour, slotMinutes]);

  const conflictKeys = useMemo(() => {
    return computeConflictingEventKeys(eventsExpanded || [], startHour, endHour, daysToRender);
  }, [eventsExpanded, startHour, endHour, daysToRender]);

  const conflicts = useMemo(() => {
    const set = new Set<string>();
    const byKey = new Map(eventsExpanded.map((e) => [e.key, e]));
    conflictKeys.forEach((k) => {
      const ev = byKey.get(k);
      if (ev) set.add(ev.title);
    });
    return Array.from(set);
  }, [conflictKeys, eventsExpanded]);

  return (
    <section className="overflow-hidden rounded-[32px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow)]">
      {conflicts.length > 0 && (
        <div className="border-b border-rose-200 bg-rose-50/80 px-5 py-4 dark:border-rose-900/60 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-200">
                Conflict detected
              </p>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-200">
                One or more selected meetings overlap in the current schedule.
              </p>
            </div>
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-700 dark:text-rose-200">
            {conflicts.map((title, i) => (
              <li key={i}>{title}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-b border-[color:var(--app-border)] px-5 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] app-text-muted">
              Calendar
            </p>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Weekly meeting view
            </h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scroll horizontally on smaller screens to compare the full week.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto px-3 pb-3 pt-3 sm:px-4">
        <div className="min-w-[760px] overflow-hidden rounded-[28px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)]">
          <div className="grid" style={{ gridTemplateColumns: `72px repeat(${daysToRender}, minmax(120px, 1fr))` }}>
            <div
              className="border-b border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-3"
              aria-hidden="true"
            />
            {Array.from({ length: daysToRender }).map((_, d) => {
              const isWeekend = d >= 5;
              return (
                <div
                  key={d}
                  className={cn(
                    "border-b border-l border-[color:var(--app-border)] p-3 text-center text-sm font-semibold tracking-[0.16em]",
                    isWeekend
                      ? "bg-[color:var(--app-accent-soft)] app-accent-text"
                      : "bg-[color:var(--app-surface)] text-slate-700 dark:text-slate-100",
                  )}
                >
                  {dayNames[d]}
                </div>
              );
            })}
          </div>

          <div
            className="grid min-h-[720px]"
            style={{ gridTemplateColumns: `72px repeat(${daysToRender}, minmax(120px, 1fr))` }}
          >
            <div className="relative bg-[color:var(--app-surface)]">
              <div className="absolute inset-0">
                {timeMarks.map((m, i) =>
                  m.minutes % 60 === 0 ? (
                    <div
                      key={i}
                      className="absolute inset-x-0 flex justify-end pr-3 text-[11px] font-medium app-text-muted"
                      style={{ top: `${((m.minutes - startHour * 60) / totalMinutes) * 100}%` }}
                    >
                      <span className="-translate-y-1/2 select-none rounded-full bg-[color:var(--app-surface)] px-2 py-0.5">
                        {formatTime12h(m.minutes)}
                      </span>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {Array.from({ length: daysToRender }).map((_, d) => (
              <div key={d} className="relative border-l border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
                <div className="pointer-events-none absolute inset-0">
                  {timeMarks.map((m, i) => (
                    <div
                      key={i}
                      className="absolute inset-x-0 border-t border-[color:var(--app-border)]/70"
                      style={{ top: `${((m.minutes - startHour * 60) / totalMinutes) * 100}%` }}
                    />
                  ))}
                </div>

                <div className="absolute inset-0 p-1.5">
                  {layout
                    .filter((e) => e.day === d)
                    .map((e) => {
                      const start12 = formatClock12h(e.start);
                      const end12 = formatClock12h(e.end);
                      const titleLabel = `${e.title} • ${start12}–${end12}${e.location ? ` @ ${e.location}` : ""}`;

                      return (
                        <button
                          key={e.key}
                          onClick={() => onEventClick?.(e)}
                          className={cn(
                            "group absolute left-[4%] w-[92%] overflow-hidden rounded-2xl border text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2 focus:ring-offset-[color:var(--app-surface)]",
                            e.colorClass,
                            conflictKeys.has(e.key) && "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-100",
                          )}
                          style={{ top: `${e.topPct}%`, height: `${e.heightPct}%` }}
                          title={titleLabel}
                        >
                          <div className="flex h-full flex-col overflow-hidden px-2.5 py-2">
                            <div className="line-clamp-2 text-[11px] font-semibold leading-tight sm:text-xs">
                              {e.title}
                            </div>
                            <div className="mt-1 text-[10px] font-medium opacity-80">
                              {start12}–{end12}
                            </div>
                            {e.location ? (
                              <div className="mt-1 line-clamp-2 text-[10px] opacity-75">
                                {e.location}
                              </div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
