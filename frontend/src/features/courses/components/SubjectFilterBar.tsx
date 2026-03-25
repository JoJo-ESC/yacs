import * as React from "react";
import { cn } from "@/lib/utils";
import type { SubjectCategory } from "@/types/courses";
import type { SubjectFilterCategory } from "@/lib/courses/subjects";
import { ALL_SUBJECTS_CATEGORY } from "@/lib/courses/subjects";

interface SubjectFilterBarProps {
  categories: Array<{ category: SubjectCategory; count: number }>;
  activeCategory: SubjectFilterCategory;
  onCategoryChange: (category: SubjectFilterCategory) => void;
}

export function SubjectFilterBar({
  categories,
  activeCategory,
  onCategoryChange,
}: SubjectFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.12)] backdrop-blur dark:border-[#303030] dark:bg-[#1a1a1a] dark:shadow-[0_18px_45px_-28px_rgba(0,0,0,0.7)]">
      <div>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-slate-950 dark:text-neutral-50">
            Filter subjects
          </p>
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            Filters combine with search instantly.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange(ALL_SUBJECTS_CATEGORY)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4b28d] dark:focus-visible:ring-[rgba(122,82,48,0.45)]",
            activeCategory === ALL_SUBJECTS_CATEGORY
              ? "border-[#dfc9ae] bg-[#f8f2ea] text-[#7a5230] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6]"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-[#343434] dark:bg-[#222222] dark:text-neutral-300 dark:hover:border-[#4a4a4a] dark:hover:bg-[#2a2a2a]",
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
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4b28d] dark:focus-visible:ring-[rgba(122,82,48,0.45)]",
              activeCategory === category.id
                ? "border-[#dfc9ae] bg-[#f8f2ea] text-[#7a5230] dark:border-[#6d4f36] dark:bg-[#3a281d] dark:text-[#f4e6d6]"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-[#343434] dark:bg-[#222222] dark:text-neutral-300 dark:hover:border-[#4a4a4a] dark:hover:bg-[#2a2a2a]",
            )}
          >
            {category.shortLabel}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-[#303030] dark:text-neutral-300">
              {count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
