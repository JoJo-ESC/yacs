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
        "flex w-full items-center gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-3 text-slate-800 transition-shadow",
        "focus-within:border-[#caa57a] focus-within:ring-4 focus-within:ring-[#f5eadb]",
        "dark:border-[#3a3a3a] dark:bg-[#181818] dark:text-neutral-100 dark:focus-within:border-[#8c6542] dark:focus-within:ring-[rgba(122,82,48,0.25)]",
      )}
      htmlFor={id}
    >
      <Search className="h-5 w-5 shrink-0 text-slate-400 dark:text-neutral-500" aria-hidden="true" />
      <input
        id={id}
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-neutral-500"
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
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#caa57a] dark:text-neutral-500 dark:hover:bg-[#262626] dark:hover:text-neutral-100"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </label>
  );
}
