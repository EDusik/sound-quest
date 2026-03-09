"use client";

import { SearchIcon } from "@/components/icons";
import { CloseIcon } from "@/components/icons";

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
  placeholder = "Search…",
  "aria-label": ariaLabel = "Search",
  trailingButton,
}: SearchBarProps) {
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
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder-muted focus:outline-none"
          autoFocus
          aria-label={ariaLabel}
        />
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-0.5 text-muted hover:text-foreground"
          aria-label="Close search"
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
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:text-foreground"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <SearchIcon className="h-4 w-4" />
    </button>
  );
}
