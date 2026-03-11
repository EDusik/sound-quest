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
}

export function PlaybackControls({
  isPlaying,
  loop,
  disabled = false,
  onPlay,
  onPause,
  onStop,
  onLoop,
}: PlaybackControlsProps) {
  const t = useTranslations();
  const disabledClass = disabled ? "opacity-40 pointer-events-none" : "";
  const btnBase =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg";
  const btnPrimary =
    "bg-accent text-background hover:bg-accent-hover";
  const btnSecondary =
    "bg-border text-foreground hover:bg-border/80";

  return (
    <div className={`flex items-center gap-2 ${disabledClass}`}>
      {!isPlaying ? (
        <button
          type="button"
          onClick={onPlay}
          className={`${btnBase} ${btnPrimary}`}
          title={t("common.play")}
          aria-label={t("common.play")}
        >
          <PlayIcon className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onPause}
          className={`${btnBase} ${btnPrimary}`}
          title={t("common.pause")}
          aria-label={t("common.pause")}
        >
          <PauseIcon className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onStop}
        className={`${btnBase} ${btnSecondary}`}
        title={t("common.stop")}
        aria-label={t("common.stop")}
      >
        <StopIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onLoop}
        title={loop ? t("common.loopOn") : t("common.loopOff")}
        className={`${btnBase} transition-colors ${
          loop ? "bg-accent text-foreground hover:bg-accent-hover" : btnSecondary
        }`}
        aria-pressed={loop}
      >
        <LoopIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
