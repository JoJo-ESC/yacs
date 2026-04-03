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
  const [hoveredCategory, setHoveredCategory] = React.useState<SubjectFilterCategory | null>(null);
  const buttonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [bubbleStyle, setBubbleStyle] = React.useState({ x: 0, width: 0, opacity: 0 });
  const bubbleCategory = hoveredCategory ?? activeCategory;

  React.useEffect(() => {
    const updateBubble = () => {
      const el = buttonRefs.current[bubbleCategory];
      if (!el) {
        setBubbleStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }

      setBubbleStyle({
        x: el.offsetLeft,
        width: el.offsetWidth,
        opacity: 1,
      });
    };

    updateBubble();
    window.addEventListener("resize", updateBubble);
    return () => window.removeEventListener("resize", updateBubble);
  }, [bubbleCategory, categories]);

  return (
    <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.12)] backdrop-blur dark:border-[#303030] dark:bg-[#1a1a1a] dark:shadow-[0_18px_45px_-28px_rgba(0,0,0,0.7)]">
      <div>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-slate-950 dark:text-neutral-50">
            Filter subjects
          </p>
        </div>
      </div>

      <div
        className="overflow-x-auto pb-1"
        onMouseLeave={() => setHoveredCategory(null)}
      >
        <div className="relative flex w-max gap-2">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 rounded-full border border-[#dfc9ae] bg-[#f4ebe0] shadow-[0_8px_20px_-14px_rgba(107,75,44,0.28)] transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-[#6d4f36] dark:bg-[#3a281d]"
            style={{
              width: `${bubbleStyle.width}px`,
              opacity: bubbleStyle.opacity,
              transform: `translateX(${bubbleStyle.x}px)`,
            }}
          />
          <button
            type="button"
            onClick={() => onCategoryChange(ALL_SUBJECTS_CATEGORY)}
            ref={(node) => {
              buttonRefs.current[ALL_SUBJECTS_CATEGORY] = node;
            }}
            onMouseEnter={() => setHoveredCategory(ALL_SUBJECTS_CATEGORY)}
            onFocus={() => setHoveredCategory(ALL_SUBJECTS_CATEGORY)}
            onBlur={() => setHoveredCategory(null)}
            className={cn(
              "relative z-10 inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-[color,border-color,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4b28d] dark:focus-visible:ring-[rgba(122,82,48,0.45)]",
              bubbleCategory === ALL_SUBJECTS_CATEGORY
                ? "border-transparent bg-transparent text-[#7a5230] dark:text-[#f4e6d6]"
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
              ref={(node) => {
                buttonRefs.current[category.id] = node;
              }}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onFocus={() => setHoveredCategory(category.id)}
              onBlur={() => setHoveredCategory(null)}
              className={cn(
                "relative z-10 inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-[color,border-color,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4b28d] dark:focus-visible:ring-[rgba(122,82,48,0.45)]",
                bubbleCategory === category.id
                  ? "border-transparent bg-transparent text-[#7a5230] dark:text-[#f4e6d6]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-[#343434] dark:bg-[#222222] dark:text-neutral-300 dark:hover:border-[#4a4a4a] dark:hover:bg-[#2a2a2a]",
              )}
            >
              {category.shortLabel}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold transition-colors duration-300",
                  bubbleCategory === category.id
                    ? "bg-white/65 text-[#7a5230] dark:bg-[#4a3324] dark:text-[#f4e6d6]"
                    : "bg-slate-100 text-slate-500 dark:bg-[#303030] dark:text-neutral-300",
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
