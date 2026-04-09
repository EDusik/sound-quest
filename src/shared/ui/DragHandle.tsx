"use client";

import { DragHandleIcon } from "@/components/icons";
import { useTranslations } from "@/contexts/I18nContext";

interface DragHandleProps {
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  "aria-label"?: string;
  title?: string;
  /** Optional extra class for the wrapper (e.g. rounded-l-xl for scenes, rounded-l-lg for audios). */
  className?: string;
}

export function DragHandle({
  onDragStart,
  onDragEnd,
  "aria-label": ariaLabel,
  title: titleProp,
  className = "",
}: DragHandleProps) {
  const t = useTranslations();
  const label = t("common.dragToReorder");
  const ariaLabelResolved = ariaLabel ?? label;
  const title = titleProp ?? label;
  return (
    <div
      role="button"
      data-drag-handle
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`flex cursor-grab active:cursor-grabbing touch-none flex-col justify-center border border-border/50 border-r-0 bg-card/50 py-2 pl-2 pr-1 text-muted hover:bg-border/50 hover:text-muted ${className}`}
      title={title}
      aria-label={ariaLabelResolved}
    >
      <DragHandleIcon className="h-5 w-5 pointer-events-none" />
    </div>
  );
}

