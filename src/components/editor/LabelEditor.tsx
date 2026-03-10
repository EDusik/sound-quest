"use client";

import type { Label } from "@/lib/types";
import { LABEL_TEXT_MAX, LABELS_MAX } from "@/lib/sceneSchema";
import { useTranslations } from "@/contexts/I18nContext";

/** WCAG AA compliant with white text (contrast ≥ 4.5:1) */
const DEFAULT_COLORS = [
  "#b91c1c",
  "#b45309",
  "#4d7c0b",
  "#047857",
  "#0e7490",
  "#1d4ed8",
  "#6d28d9",
  "#a21caf",
];

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface LabelEditorProps {
  labels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  newLabelText: string;
  onNewLabelTextChange: (value: string) => void;
  newLabelColor: string;
  onNewLabelColorChange: (color: string) => void;
  error?: string;
  /** Input id prefix for a11y (e.g. "create" or "edit"). */
  idPrefix?: string;
}

export function LabelEditor({
  labels,
  onLabelsChange,
  newLabelText,
  onNewLabelTextChange,
  newLabelColor,
  onNewLabelColorChange,
  error,
  idPrefix = "labels",
}: LabelEditorProps) {
  const t = useTranslations();

  const addLabel = () => {
    const t = newLabelText.trim().slice(0, LABEL_TEXT_MAX);
    if (!t || labels.length >= LABELS_MAX) return;
    onLabelsChange([
      ...labels,
      { id: generateId(), text: t, color: newLabelColor },
    ]);
    onNewLabelTextChange("");
    onNewLabelColorChange(DEFAULT_COLORS[0]);
  };

  const removeLabel = (id: string) => {
    onLabelsChange(labels.filter((l) => l.id !== id));
  };

  return (
    <div className="min-w-0">
      <label className="block text-sm font-medium text-foreground">
        {t("common.labelsCount", { current: String(labels.length), max: String(LABELS_MAX) })}
      </label>
      <div className="mt-2 flex min-w-0 flex-wrap gap-2">
        {labels.map((l) => (
          <span
            key={l.id}
            className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-3 py-1 text-[12px] text-white sm:text-sm"
            style={{ backgroundColor: l.color }}
          >
            <span className="min-w-0 truncate">{l.text}</span>
            <button
              type="button"
              onClick={() => removeLabel(l.id)}
              className="shrink-0 rounded-full hover:bg-white/20"
              aria-label={t("common.removeLabel", { text: l.text })}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
        <input
          type="text"
          value={newLabelText}
          onChange={(e) =>
            onNewLabelTextChange(e.target.value.slice(0, LABEL_TEXT_MAX))
          }
          maxLength={LABEL_TEXT_MAX}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLabel())}
          className="h-9 min-w-[140px] flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none"
          placeholder={t("common.labelText")}
          id={`${idPrefix}-label-input`}
        />
        <span className="text-xs text-muted tabular-nums shrink-0">
          {newLabelText.length}/{LABEL_TEXT_MAX}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onNewLabelColorChange(color)}
              className="h-6 w-6 shrink-0 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-card sm:h-9 sm:w-9"
              style={{
                backgroundColor: color,
                borderColor: newLabelColor === color ? "white" : "transparent",
              }}
              aria-label={t("common.colorLabel", { color })}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addLabel}
          disabled={labels.length >= LABELS_MAX}
          className="rounded-lg bg-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-border/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("common.addLabel")}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { DEFAULT_COLORS as LABEL_DEFAULT_COLORS };
