import * as React from "react";

import { cn } from "@/lib/utils";

type SpinnerProps = React.ComponentProps<"div"> & {
  size?: "sm" | "md" | "lg";
  label?: string;
};

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export function Spinner({
  className,
  size = "md",
  label = "Loading",
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <span
        className={cn(
          "inline-block animate-spin rounded-full border-solid border-foreground/20 border-t-footer",
          sizeClasses[size]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
