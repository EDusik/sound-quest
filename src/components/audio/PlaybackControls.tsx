"use client";

import { useTranslations } from "@/contexts/I18nContext";
import { PlayIcon, PauseIcon, StopIcon, LoopIcon } from "@/components/icons";

interface PlaybackControlsProps {
  isPlaying: boolean;
  loop: boolean;
  disabled?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onLoop: () => void;
  /** No pause toggle: play button stays visible; use stop to end. Play restarts from the beginning if already playing. */
  omitPause?: boolean;
  /** Hide stop (square) control. */
  omitStop?: boolean;
  /** Hide loop / repeat. */
  omitLoop?: boolean;
  /** Smaller buttons (e.g. default catalog cards). */
  compact?: boolean;
}

export function PlaybackControls({
  isPlaying,
  loop,
  disabled = false,
  onPlay,
  onPause,
  onStop,
  onLoop,
  omitPause = false,
  omitStop = false,
  omitLoop = false,
  compact = false,
}: PlaybackControlsProps) {
  const t = useTranslations();
  const disabledClass = disabled ? "opacity-40 pointer-events-none" : "";
  const btnBase = compact
    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg";
  const btnPrimary =
    "bg-accent text-background hover:bg-accent-hover";
  const btnSecondary =
    "bg-border text-foreground hover:bg-border/80";
  const iconClass = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  const playOrPause =
    omitPause || !isPlaying ? (
      <button
        type="button"
        onClick={onPlay}
        className={`${btnBase} ${btnPrimary}`}
        title={t("common.play")}
        aria-label={t("common.play")}
      >
        <PlayIcon className={iconClass} />
      </button>
    ) : (
      <button
        type="button"
        onClick={onPause}
        className={`${btnBase} ${btnPrimary}`}
        title={t("common.pause")}
        aria-label={t("common.pause")}
      >
        <PauseIcon className={iconClass} />
      </button>
    );

  return (
    <div
      className={`flex items-center ${compact ? "gap-1.5" : "gap-2"} ${disabledClass}`}
    >
      {playOrPause}
      {!omitStop && (
        <button
          type="button"
          onClick={onStop}
          className={`${btnBase} ${btnSecondary}`}
          title={t("common.stop")}
          aria-label={t("common.stop")}
        >
          <StopIcon className={iconClass} />
        </button>
      )}
      {!omitLoop && (
        <button
          type="button"
          onClick={onLoop}
          title={loop ? t("common.loopOn") : t("common.loopOff")}
          className={`${btnBase} transition-colors ${
            loop ? "bg-accent text-foreground hover:bg-accent-hover" : btnSecondary
          }`}
          aria-pressed={loop}
        >
          <LoopIcon className={iconClass} />
        </button>
      )}
    </div>
  );
}
