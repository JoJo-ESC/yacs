import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function decodeHtmlEntities(value: string) {
  if (!value || typeof document === "undefined") return value

  const textarea = document.createElement("textarea")
  textarea.innerHTML = value
  return textarea.value
}
