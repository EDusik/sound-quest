"use client";

interface ErrorMessageProps {
  message: string;
  className?: string;
  /** When set, shows a dismiss button. Use for transient errors (e.g. reorder failure). */
  onDismiss?: () => void;
}

export function ErrorMessage({
  message,
  className = "",
  onDismiss,
}: ErrorMessageProps) {
  return (
    <div
      className={`rounded-lg bg-red-500/20 p-4 text-red-200 ${className}`}
      role="alert"
    >
      <div className="flex items-center justify-between gap-2">
        <span>{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded p-1 text-red-200 hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
