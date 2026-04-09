"use client";

/**
 * Skeleton that mirrors the dashboard scene grid layout (ScenesBlock + SceneCard).
 * Same grid, same card height (h-[150px]) to avoid layout shift when content loads.
 */
const CARD_COUNT = 6;

export function DashboardSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2" aria-hidden>
      {Array.from({ length: CARD_COUNT }, (_, i) => (
        <li key={i} className="flex items-stretch rounded-xl">
          <div className="w-8 shrink-0 rounded-l-xl bg-border/30 animate-pulse" />
          <div className="min-w-0 flex-1 h-[150px] rounded-tr-xl rounded-br-xl ring-1 ring-inset ring-border/50 bg-card/50 p-5 pr-12">
            <div className="h-5 w-3/4 max-w-48 rounded bg-border/50 animate-pulse" />
            <div className="mt-2 h-4 w-full max-w-64 rounded bg-border/40 animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}

