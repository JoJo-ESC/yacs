import * as React from "react";
import { Search, X } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

export function SubjectNavSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const targetPath = location.pathname === "/" ? "/" : "/courses";

  function updateQuery(nextQuery: string) {
    const nextParams = new URLSearchParams();

    if (nextQuery.trim()) {
      nextParams.set("q", nextQuery);
    }

    navigate(
      {
        pathname: targetPath,
        search: nextParams.toString() ? `?${nextParams.toString()}` : "",
      },
      { replace: location.pathname === targetPath },
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <label
        className={cn(
          "flex items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-3 text-slate-900 transition-shadow",
          "focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-200",
          "dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100 dark:focus-within:border-slate-600 dark:focus-within:ring-zinc-800",
        )}
        htmlFor="subject-nav-search-input"
      >
        <Search className="h-5 w-5 text-slate-400 dark:text-slate-300" aria-hidden="true" />
        <input
          id="subject-nav-search-input"
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Search classes"
          className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-slate-400"
          aria-label="Search subjects by subject code or name"
        />
        {query ? (
          <button
            type="button"
            onClick={() => updateQuery("")}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Clear subject search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </label>
    </div>
  );
}
