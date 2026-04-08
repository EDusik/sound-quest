"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/contexts/I18nContext";
import { formatLibraryType } from "@/lib/format-library-type";
import { AUDIO_LIBRARY_TYPES } from "@/lib/validators/api";

export type LibraryCategoryValue = (typeof AUDIO_LIBRARY_TYPES)[number];

interface LibraryCategorySelectProps {
  value: LibraryCategoryValue;
  onChange: (value: LibraryCategoryValue) => void;
  disabled?: boolean;
  compact?: boolean;
  label: string;
}

type PanelCoords = { top: number; left: number; width: number };

export function LibraryCategorySelect({
  value,
  onChange,
  disabled = false,
  compact = false,
  label,
}: LibraryCategorySelectProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [coords, setCoords] = useState<PanelCoords>({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const labelId = useId();
  const listboxId = useId();

  const close = useCallback(() => setOpen(false), []);

  const updatePanelPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    setCoords({
      top: r.bottom + gap,
      left: r.left,
      width: r.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    window.addEventListener("scroll", updatePanelPosition, true);
    window.addEventListener("resize", updatePanelPosition);
    return () => {
      window.removeEventListener("scroll", updatePanelPosition, true);
      window.removeEventListener("resize", updatePanelPosition);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const triggerClass = compact
    ? "inline-flex h-8 min-w-[8.25rem] max-w-[14rem] items-center justify-between gap-2 rounded-xl border border-border/80 bg-linear-to-b from-card/95 to-background/70 px-2.5 py-0 text-xs font-medium text-foreground shadow-sm ring-1 ring-black/4 transition hover:border-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 dark:from-card dark:to-card/80 dark:ring-white/6"
    : "inline-flex h-10 min-w-[11rem] max-w-[18rem] items-center justify-between gap-2 rounded-xl border border-border/80 bg-linear-to-b from-card to-background/80 px-3 py-0 text-sm font-medium text-foreground shadow-sm ring-1 ring-black/4 transition hover:border-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 dark:from-card dark:to-card/90 dark:ring-white/6";

  const panelClass = compact
    ? "overflow-hidden rounded-xl border border-border/80 bg-card py-1 shadow-xl ring-1 ring-black/8 dark:bg-card dark:ring-white/10"
    : "overflow-hidden rounded-xl border border-border/80 bg-card py-1.5 shadow-xl ring-1 ring-black/8 dark:bg-card dark:ring-white/10";

  const optionClass = (selected: boolean) =>
    compact
      ? `flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs transition ${
          selected
            ? "bg-accent/12 font-semibold text-accent"
            : "text-foreground hover:bg-border/50"
        }`
      : `flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition ${
          selected
            ? "bg-accent/12 font-semibold text-accent"
            : "text-foreground hover:bg-border/50"
        }`;

  const wrapperClass = compact
    ? "flex flex-wrap items-center gap-2"
    : "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3";

  const listbox =
    open && !disabled && mounted ? (
      <ul
        ref={panelRef}
        id={listboxId}
        role="listbox"
        aria-labelledby={labelId}
        className={panelClass}
        style={{
          position: "fixed",
          top: coords.top,
          left: coords.left,
          width: Math.max(coords.width, compact ? 132 : 176),
          zIndex: 200,
        }}
      >
        {AUDIO_LIBRARY_TYPES.map((ty) => {
          const selected = ty === value;
          return (
            <li key={ty} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                className={optionClass(selected)}
                onClick={() => {
                  onChange(ty);
                  close();
                  triggerRef.current?.focus();
                }}
              >
                <span
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-accent sm:h-4 sm:w-4"
                  aria-hidden
                >
                  {selected ? (
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                  ) : null}
                </span>
                <span className="min-w-0 truncate">{formatLibraryType(ty, t)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div className={wrapperClass}>
      <span
        id={labelId}
        className={
          compact
            ? "shrink-0 text-[11px] font-medium text-muted-foreground"
            : "shrink-0 text-xs font-medium text-muted-foreground"
        }
      >
        {label}
      </span>
      <div className="relative min-w-0" ref={containerRef}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          id={`${listboxId}-trigger`}
          className={triggerClass}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-labelledby={labelId}
          onClick={() => !disabled && setOpen((o) => !o)}
        >
          <span className="min-w-0 truncate">{formatLibraryType(value, t)}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 sm:h-4 sm:w-4 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
        {listbox ? createPortal(listbox, document.body) : null}
      </div>
    </div>
  );
}
