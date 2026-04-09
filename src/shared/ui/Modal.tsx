"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/components/icons";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useTranslations } from "@/contexts/I18nContext";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  children: React.ReactNode;
  /** Optional. If not set, no close button in header. */
  showCloseButton?: boolean;
  /** Close when clicking the backdrop. Default true. */
  closeOnBackdropClick?: boolean;
  /** Close when pressing Escape. Default true. */
  closeOnEscape?: boolean;
  /** Max width class. Default max-w-lg. */
  maxWidth?: "max-w-sm" | "max-w-lg" | "max-w-xl" | "max-w-2xl";
  /** Extra class for the panel (e.g. max-h-[90vh] overflow-y-auto). */
  panelClassName?: string;
}

export function Modal({
  open,
  onClose,
  title,
  titleId,
  children,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  maxWidth = "max-w-lg",
  panelClassName = "",
}: ModalProps) {
  const trapRef = useFocusTrap(open);
  const t = useTranslations();

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, closeOnEscape]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        className={`w-full min-w-0 rounded-xl border border-border bg-card shadow-xl ${maxWidth} ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label={t("common.close")}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

