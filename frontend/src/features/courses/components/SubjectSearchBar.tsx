import * as React from "react";
import { Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubjectSearchBarProps {
  query: string;
  onQueryChange: (nextQuery: string) => void;
  onOpenQuickFind: () => void;
}

export function SubjectSearchBar({
  query,
  onQueryChange,
  onOpenQuickFind,
}: SubjectSearchBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[32px] border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-zinc-800 dark:bg-zinc-950">
      <label
        className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 text-slate-900 transition-shadow focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100 dark:focus-within:border-slate-600 dark:focus-within:ring-zinc-800"
        htmlFor="subject-search-input"
      >
        <Search className="h-6 w-6 text-slate-400 dark:text-slate-300" aria-hidden="true" />
        <input
          id="subject-search-input"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search CSCI-1200, Data Structures, algorithms..."
          className="min-w-0 flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-slate-400"
          aria-label="Search classes by course code or title"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Clear subject search"
          >
          <X className="h-4 w-4" />
          </button>
        ) : null}
      </label>

      <div className="flex flex-col gap-2 px-1 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Search by class title or course code, then narrow with filters below.
        </p>
        <button
          type="button"
          onClick={onOpenQuickFind}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all",
            "hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
            "dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800",
          )}
          aria-label="Open quick subject finder"
        >
          <Sparkles className="h-4 w-4" />
          Quick find
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold tracking-[0.2em] text-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-slate-400">
            / or ⌘K
          </span>
        </button>
      </div>
    </div>
  );
}
