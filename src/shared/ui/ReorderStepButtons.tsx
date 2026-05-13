"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

type ReorderStepButtonsProps = {
  moveUpDisabled: boolean;
  moveDownDisabled: boolean;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  moveUpLabel: string;
  moveDownLabel: string;
  className?: string;
};

export function ReorderStepButtons({
  moveUpDisabled,
  moveDownDisabled,
  disabled,
  onMoveUp,
  onMoveDown,
  moveUpLabel,
  moveDownLabel,
  className = "",
}: ReorderStepButtonsProps) {
  const btn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-border hover:text-foreground disabled:pointer-events-none disabled:opacity-40";
  return (
    <div
      className={`flex shrink-0 flex-col justify-center gap-px border border-border/50 border-r-0 bg-card/50 py-1 pl-1 pr-0.5 ${className}`.trim()}
    >
      <button
        type="button"
        disabled={disabled || moveUpDisabled}
        onClick={onMoveUp}
        className={btn}
        aria-label={moveUpLabel}
        title={moveUpLabel}
      >
        <ChevronUp className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled || moveDownDisabled}
        onClick={onMoveDown}
        className={btn}
        aria-label={moveDownLabel}
        title={moveDownLabel}
      >
        <ChevronDown className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
