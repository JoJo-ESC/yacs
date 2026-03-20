import * as React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SubjectCategory } from "@/types/courses";
import type { SubjectFilterCategory } from "@/lib/courses/subjects";
import { ALL_SUBJECTS_CATEGORY } from "@/lib/courses/subjects";

interface SubjectFilterBarProps {
  categories: Array<{ category: SubjectCategory; count: number }>;
  activeCategory: SubjectFilterCategory;
  onCategoryChange: (category: SubjectFilterCategory) => void;
  featuredOnly: boolean;
  onFeaturedOnlyChange: (nextValue: boolean) => void;
}

export function SubjectFilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  featuredOnly,
  onFeaturedOnlyChange,
}: SubjectFilterBarProps) {
  return (
    <div className="sticky top-[73px] z-30 flex flex-col gap-3 rounded-[28px] border border-slate-200/70 bg-white/90 p-4 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
            Filter subjects
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Filters combine with search instantly.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onFeaturedOnlyChange(!featuredOnly)}
          className={cn(
            "rounded-full border px-4 text-sm",
            featuredOnly
              ? "border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800",
          )}
          aria-pressed={featuredOnly}
        >
          <Star className={cn("h-4 w-4", featuredOnly && "fill-current")} />
          Featured
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange(ALL_SUBJECTS_CATEGORY)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
            activeCategory === ALL_SUBJECTS_CATEGORY
              ? "border-slate-300 bg-slate-100 text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800",
          )}
        >
          All subjects
        </button>
        {categories.map(({ category, count }) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
              activeCategory === category.id
                ? "border-slate-300 bg-slate-100 text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800",
            )}
          >
            {category.shortLabel}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
