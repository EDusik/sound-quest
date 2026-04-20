"use client";

interface CollapsibleSectionProps {
  summary: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** @deprecated Ignored — a secção já não é recolhível. */
  defaultOpen?: boolean;
}

/** Painel com título e corpo; não usa `<details>` (sem accordion nativo). */
export function CollapsibleSection({
  summary,
  children,
  className = "",
}: CollapsibleSectionProps) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-border bg-card/50 ${className}`}
    >
      <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">
        {summary}
      </div>
      <div>{children}</div>
    </section>
  );
}
