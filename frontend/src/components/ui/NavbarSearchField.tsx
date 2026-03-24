import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarSearchFieldProps {
  id: string;
  value: string;
  onChange: (nextValue: string) => void;
  onClear: () => void;
  placeholder: string;
  ariaLabel: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  ariaExpanded?: boolean;
  ariaHaspopup?: "listbox" | "dialog" | "grid" | "tree" | "menu";
  ariaControls?: string;
  role?: string;
}

export function NavbarSearchField({
  id,
  value,
  onChange,
  onClear,
  placeholder,
  ariaLabel,
  inputRef,
  onFocus,
  onKeyDown,
  ariaExpanded,
  ariaHaspopup,
  ariaControls,
  role,
}: NavbarSearchFieldProps) {
  return (
    <label
      className={cn(
        "flex w-full items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-3 text-slate-900 transition-shadow",
        "focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-200",
        "dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100 dark:focus-within:border-slate-600 dark:focus-within:ring-zinc-800",
      )}
      htmlFor={id}
    >
      <Search className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-300" aria-hidden="true" />
      <input
        id={id}
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-slate-400"
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        aria-controls={ariaControls}
        role={role}
      />
      {value ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onClear();
          }}
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </label>
  );
}
