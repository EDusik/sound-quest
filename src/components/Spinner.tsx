"use client";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className = "" }: SpinnerProps) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent ${className}`}
      aria-hidden
    />
  );
}
