"use client";

export function GlobalAuthLoading() {
  return (
    <div
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-zinc-950"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      <p className="mt-4 text-sm text-zinc-400">Loading…</p>
    </div>
  );
}
