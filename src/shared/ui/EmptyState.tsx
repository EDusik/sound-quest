"use client";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-border bg-card/50 p-12 text-center ${className}`}
    >
      <p className="text-muted">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent-hover"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

