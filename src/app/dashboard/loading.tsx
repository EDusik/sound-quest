import { DashboardSkeleton } from "@/features/scenes/components/DashboardSkeleton";

export default function DashboardLoading() {
  return (
    <div className="bg-background">
      <div
        className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4"
        aria-hidden
      >
        <div className="h-8 w-8 rounded-md bg-border/30 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-20 rounded-md bg-border/25 animate-pulse" />
          <div className="h-8 w-8 rounded-md bg-border/25 animate-pulse" />
        </div>
      </div>
      <section className="mx-auto max-w-6xl px-4 py-4 pb-24 bg-background min-h-[60vh]">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div className="h-7 w-24 rounded bg-border/40 animate-pulse" />
          <div className="flex items-center gap-1">
            <div className="h-9 w-32 rounded bg-border/30 animate-pulse" />
            <div className="h-9 w-9 rounded bg-border/30 animate-pulse" />
          </div>
        </div>
        <DashboardSkeleton />
      </section>
    </div>
  );
}
