"use client";

import { ChevronDownIcon } from "@/components/icons";

interface CollapsibleSectionProps {
  summary: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  summary,
  children,
  className = "",
}: CollapsibleSectionProps) {
  return (
    <details
      className={`group rounded-lg border border-border bg-card/50 ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-card/80 [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronDownIcon className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      {children}
    </details>
  );
}
