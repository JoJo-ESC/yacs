import * as React from "react";
import { createPortal } from "react-dom";
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check as CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSchedule } from "@/context/schedule/schedule-context";
import type { Course, Meeting } from "@/types/schedule";
import { NavbarSearchField } from "@/components/ui/NavbarSearchField";

function pickDefaultMeetings(c: Course): Meeting[] {
  const chosen = new Map<string, Meeting>();
  for (const m of c.meetings) if (!chosen.has(m.type)) chosen.set(m.type, m);
  return Array.from(chosen.values());
}

export function ClassSearch({
  dropdownContainerId = "class-search-results-slot",
  maxResults = 100,
  itemHeight = 40,
  listMaxHeight = 320,
}: {
  dropdownContainerId?: string;
  maxResults?: number;
  itemHeight?: number;
  listMaxHeight?: number;
}) {
  const { catalog, addCourse, hasCourse } = useSchedule();

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const deferredQuery = React.useDeferredValue(query);
  const debouncedQuery = useDebouncedValue(deferredQuery, 120);

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  const [portalEl, setPortalEl] = React.useState<Element | null>(null);
  React.useEffect(() => {
    setPortalEl(document.getElementById(dropdownContainerId) || null);
  }, [dropdownContainerId]);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        (wrapperRef.current && wrapperRef.current.contains(t)) ||
        (dropdownRef.current && dropdownRef.current.contains(t))
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  type Indexed = { id: string; title: string; idL: string; titleL: string; raw: Course };
  const indexedCatalog = React.useMemo<Indexed[]>(() => {
    const items = Array.isArray(catalog) ? catalog : [];
    return items.map((c) => ({
      id: c.id,
      title: c.title,
      idL: c.id.toLowerCase(),
      titleL: c.title.toLowerCase(),
      raw: c,
    }));
  }, [catalog]);

  const filtered = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return indexedCatalog.slice(0, maxResults);
    
    const out: Indexed[] = [];
    for (let i = 0; i < indexedCatalog.length; i++) {
      const item = indexedCatalog[i];
      if (item.idL.includes(q) || item.titleL.includes(q)) {
        out.push(item);
        if (out.length >= maxResults) break;
      }
    }
    return out;
  }, [debouncedQuery, indexedCatalog, maxResults]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5
  });

  const isOpen = open;

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      className={cn("w-full overflow-hidden bg-header text-input-foreground")}
      id="class-search-dropdown-listbox"
      role="listbox"
      aria-label="Search results"
    >
      {filtered.length === 0 ? (
        <div className="p-3 text-sm opacity-80">No classes found.</div>
      ) : (
        <div 
          className="max-h-80"
          style={{ contain: 'paint' }}
        >
          <div
            ref={parentRef}
            className="overscroll-contain"
            style={{
              height: Math.min(listMaxHeight, filtered.length * itemHeight),
              overflow: 'auto',
              willChange: 'transform',
              transform: 'translateZ(0)',
              width: '100%'
            }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative'
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const c = filtered[virtualRow.index];
                const already = hasCourse(c.id);
                return (
                  <div
                    key={c.id}

                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <li
                      className={cn(
                        "flex cursor-pointer items-center gap-2 px-3 border-b border-border h-[40px]",
                        already ? "opacity-60 cursor-not-allowed" : "hover:bg-muted"
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (already) return;
                        const selectedMeetings = pickDefaultMeetings(c.raw);
                        const selectedCourse: Course = { ...c.raw, meetings: selectedMeetings };
                        addCourse(selectedCourse);
                        setOpen(true);
                        inputRef.current?.focus();
                      }}
                      role="option"
                      aria-selected={already}
                      aria-disabled={already}
                    >
                      <CheckIcon className={cn("h-4 w-4", already ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">
                        {c.id} - {c.title}
                      </span>
                    </li>
                  </div>
                );
              })}
            </div>
          </div>
          {filtered.length === maxResults && (
            <div className="px-3 py-1 text-xs opacity-70 border-t border-border">
              Showing first {maxResults} results. Refine your search…
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={wrapperRef}
        className="w-full"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <NavbarSearchField
          id="class-search-input"
          value={query}
          inputRef={inputRef}
          onChange={(nextValue) => {
            setQuery(nextValue);
            if (!isOpen) setOpen(true);
          }}
          onClear={() => {
            setQuery("");
            setOpen(true);
            inputRef.current?.focus();
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Search classes..."
          ariaLabel="Search classes"
          ariaExpanded={isOpen}
          ariaHaspopup="listbox"
          ariaControls="class-search-dropdown-listbox"
          role="combobox"
        />
      </div>
      {portalEl && dropdown ? createPortal(dropdown, portalEl) : null}
    </>
  );
}

export default ClassSearch;
