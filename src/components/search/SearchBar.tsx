"use client";

import { SearchIcon } from "@/components/icons";
import { CloseIcon } from "@/components/icons";
import { useTranslations } from "@/contexts/I18nContext";

interface SearchBarProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  /** When search is open, show this next to the close button (e.g. another action button). */
  trailingButton?: React.ReactNode;
}

export function SearchBar({
  open,
  onOpen,
  onClose,
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  trailingButton,
}: SearchBarProps) {
  const t = useTranslations();
  const resolvedPlaceholder = placeholder ?? t("common.search");
  const resolvedAriaLabel = ariaLabel ?? t("common.search");

  if (open) {
    return (
      <div
        className="flex w-full max-w-md flex-1 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 sm:min-w-[22rem] sm:w-96 sm:max-w-xl"
        style={{
          animation: "search-bar-in 0.35s cubic-bezier(0.33, 1, 0.68, 1)",
          transformOrigin: "right",
        }}
      >
        <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={resolvedPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder-muted focus:outline-none"
          autoFocus
          aria-label={resolvedAriaLabel}
        />
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded text-muted hover:text-foreground sm:min-h-0 sm:min-w-0 sm:p-0.5"
          aria-label={t("common.closeSearch")}
        >
          <CloseIcon className="h-4 w-4" />
        </button>
        {trailingButton}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-11 w-11 items-center justify-center rounded-md text-muted transition hover:text-foreground sm:h-8 sm:w-8"
      aria-label={resolvedAriaLabel}
      title={resolvedAriaLabel}
    >
      <SearchIcon className="h-4 w-4" />
    </button>
  );
}
