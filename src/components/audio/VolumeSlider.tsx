"use client";

import { useTranslations } from "@/contexts/I18nContext";

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function VolumeSlider({
  value,
  onChange,
  disabled = false,
  compact = false,
}: VolumeSliderProps) {
  const t = useTranslations();
  const disabledClass = disabled ? "opacity-40 pointer-events-none" : "";

  return (
    <label
      className={`flex w-full items-center gap-0.5 text-muted sm:w-auto ${compact ? "text-[10px]" : "gap-1 text-xs"} ${disabledClass}`}
    >
      <span>{t("common.vol")}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`flex-1 min-w-0 sm:flex-initial accent-accent border-0 outline-none ${compact ? "w-14" : "w-20"}`}
      />
    </label>
  );
}
