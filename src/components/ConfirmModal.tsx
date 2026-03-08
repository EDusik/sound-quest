"use client";

import { useEffect } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  message: React.ReactNode;
  confirmLabel: string;
  /** Shown when loading (e.g. "Deleting…"). If not set, shows confirmLabel + "…". */
  loadingConfirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  /** e.g. "bg-red-600 hover:bg-red-500" for destructive. */
  confirmVariant?: "danger" | "primary";
}

export function ConfirmModal({
  open,
  onClose,
  title,
  titleId,
  message,
  confirmLabel,
  loadingConfirmLabel,
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  confirmVariant = "danger",
}: ConfirmModalProps) {
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  const confirmClass =
    confirmVariant === "danger"
      ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-foreground hover:bg-red-500 disabled:opacity-50"
      : "rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent-hover disabled:opacity-50";
  const confirmButtonText = loading ? (loadingConfirmLabel ?? `${confirmLabel}…`) : confirmLabel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={() => !loading && onClose()}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-semibold text-foreground"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-card disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={confirmClass}
            aria-busy={loading}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
