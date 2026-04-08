"use client";

const sizeClass = {
  md: "h-8 w-8 border-2",
  sm: "h-4 w-4 border-2",
  xs: "h-3.5 w-3.5 border-2",
} as const;

interface SpinnerProps {
  className?: string;
  /** Default `md` matches legacy full-page loaders. */
  size?: keyof typeof sizeClass;
}

export function Spinner({ className = "", size = "md" }: SpinnerProps) {
  return (
    <div
      className={`shrink-0 animate-spin rounded-full border-accent border-t-transparent ${sizeClass[size]} ${className}`}
      aria-hidden
    />
  );
}
