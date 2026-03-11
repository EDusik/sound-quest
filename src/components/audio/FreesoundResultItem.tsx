"use client";

import { useTranslations } from "@/contexts/I18nContext";
import { getPreviewUrl, type FreesoundSound } from "@/lib/freesound";
import { PlayIcon, PauseIcon } from "@/components/icons";

interface FreesoundResultItemProps {
  sound: FreesoundSound;
  isPlaying: boolean;
  isAdding: boolean;
  onPlay: () => void;
  onAdd: () => void;
}

export function FreesoundResultItem({
  sound,
  isPlaying,
  isAdding,
  onPlay,
  onAdd,
}: FreesoundResultItemProps) {
  const t = useTranslations();
  const previewUrl = getPreviewUrl(sound.previews);

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/50 bg-card/50 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{sound.name}</p>
        {sound.duration != null && (
          <p className="text-xs text-muted">{Math.round(sound.duration)}s</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPlay}
          disabled={!previewUrl}
          className="rounded bg-border p-2 text-foreground hover:bg-border/80 disabled:opacity-50"
          title={isPlaying ? t("common.stop") : t("common.playPreview")}
          aria-label={isPlaying ? t("common.stop") : t("common.playPreview")}
        >
          {isPlaying ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onAdd}
          disabled={!previewUrl || isAdding}
          className="rounded bg-accent px-3 py-2 text-sm font-medium text-background hover:bg-accent-hover disabled:opacity-50"
          aria-label={isAdding ? t("freesound.adding") : t("freesound.addToScene")}
          aria-busy={isAdding}
        >
          {isAdding ? t("freesound.adding") : t("freesound.addToScene")}
        </button>
      </div>
    </li>
  );
}
