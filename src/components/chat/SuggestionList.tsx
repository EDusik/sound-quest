"use client";

import { Music } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PlayIcon, PauseIcon } from "@/components/icons";
import { useTranslations } from "@/contexts/I18nContext";
import type { AiChatSuggestion } from "@/lib/api-client";
import { libraryStorageUrlFromAiSuggestion } from "@/lib/library-storage-url-from-ai-suggestion";
import { LibraryCategorySelect } from "@/components/chat/LibraryCategorySelect";
import { AUDIO_LIBRARY_TYPES } from "@/lib/validators/api";

interface SuggestionListProps {
  suggestions: AiChatSuggestion[];
  suggestionTypes: Record<number, (typeof AUDIO_LIBRARY_TYPES)[number]>;
  addedKeys?: Set<string>;
  onSetType: (index: number, type: (typeof AUDIO_LIBRARY_TYPES)[number]) => void;
  onAddToLibrary: (s: AiChatSuggestion, index: number) => Promise<void>;
  onAddToScene?: (name: string, url: string) => void;
  isAddingToLibrary: boolean;
  compact?: boolean;
}

function shortenDisplayUrl(url: string, maxLen = 48): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname + u.search;
    const combined = path && path !== "/" ? `${host}${path}` : host;
    if (combined.length <= maxLen) return combined;
    return `${combined.slice(0, maxLen - 1)}…`;
  } catch {
    if (url.length <= maxLen) return url;
    return `${url.slice(0, maxLen - 1)}…`;
  }
}

function SuggestionRow({
  s,
  index,
  compact,
  added,
  isPlaying,
  selectedType,
  onSetType,
  onAddToLibrary,
  onAddToScene,
  isAddingToLibrary,
  onPlay,
}: {
  s: AiChatSuggestion;
  index: number;
  compact: boolean;
  added: boolean;
  isPlaying: boolean;
  selectedType: (typeof AUDIO_LIBRARY_TYPES)[number];
  onSetType: (index: number, type: (typeof AUDIO_LIBRARY_TYPES)[number]) => void;
  onAddToLibrary: (s: AiChatSuggestion, index: number) => Promise<void>;
  onAddToScene?: (name: string, url: string) => void;
  isAddingToLibrary: boolean;
  onPlay: (previewUrl: string, index: number) => void;
}) {
  const t = useTranslations();

  const playBtn = s.previewUrl ? (
    <button
      type="button"
      onClick={() => onPlay(s.previewUrl!, index)}
      className={
        compact
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent shadow-inner ring-1 ring-accent/20 transition hover:bg-accent/25 hover:ring-accent/35 focus-visible:ring-2 focus-visible:ring-accent"
          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent shadow-sm ring-1 ring-accent/25 transition hover:scale-[1.03] hover:bg-accent/25 hover:ring-accent/40 focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
      }
      title={isPlaying ? t("common.stop") : t("aiLibrary.playPreview")}
      aria-label={isPlaying ? t("common.stop") : t("aiLibrary.playPreview")}
    >
      {isPlaying ? (
        <PauseIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : (
        <PlayIcon className={compact ? "h-3.5 w-3.5 pl-0.5" : "h-4 w-4 pl-0.5"} />
      )}
    </button>
  ) : (
    <div
      className={
        compact
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-border/80 text-muted-foreground"
          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-border/60 text-muted-foreground"
      }
      title={t("aiLibrary.playPreview")}
      aria-hidden
    >
      <Music className={compact ? "h-3.5 w-3.5 opacity-70" : "h-4 w-4 opacity-70"} />
    </div>
  );

  const primaryBtn = compact
    ? "rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-background shadow-sm transition hover:bg-accent-hover disabled:opacity-50"
    : "rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-background shadow-sm transition hover:bg-accent-hover disabled:opacity-50";

  const sceneBtn = compact
    ? "rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/18"
    : "rounded-lg border border-accent/45 bg-accent/10 px-3.5 py-2 text-xs font-medium text-accent transition hover:bg-accent/18";

  if (compact) {
    return (
      <li
        className={`group relative overflow-visible rounded-xl border bg-card/90 shadow-sm ring-1 transition duration-200 hover:shadow-md ${
          added
            ? "border-accent/35 ring-accent/15"
            : "border-border/70 ring-black/4 hover:border-accent/25 dark:ring-white/6"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl bg-linear-to-br from-accent/6 via-transparent to-primary/4 opacity-90 dark:from-accent/10 dark:to-primary/8"
          aria-hidden
        />
        <div className="relative p-3">
          <div className="flex gap-3">
            {playBtn}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold leading-snug text-foreground">
                  {s.name}
                </span>
                {s.source ? (
                  <span className="rounded-full bg-border/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {s.source}
                  </span>
                ) : null}
              </div>
              <a
                href={s.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate font-mono text-[11px] text-accent/90 underline decoration-accent/30 underline-offset-2 transition hover:text-accent hover:decoration-accent"
                title={s.sourceUrl}
              >
                {shortenDisplayUrl(s.sourceUrl, 44)}
              </a>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
            <LibraryCategorySelect
              label={t("aiLibrary.typeLabel")}
              value={selectedType}
              onChange={(ty) => onSetType(index, ty)}
              disabled={added}
              compact
            />
            <button
              type="button"
              disabled={isAddingToLibrary || added}
              onClick={() => onAddToLibrary(s, index)}
              className={primaryBtn}
            >
              {added ? t("libraryPage.suggestionAdded") : t("aiLibrary.addToLibrary")}
            </button>
            {onAddToScene && (
              <button
                type="button"
                onClick={() =>
                  onAddToScene(s.name, libraryStorageUrlFromAiSuggestion(s))
                }
                className={sceneBtn}
              >
                {t("aiLibrary.addToScene")}
              </button>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`group relative overflow-visible rounded-2xl border bg-card shadow-sm ring-1 transition duration-200 hover:shadow-lg ${
        added
          ? "border-accent/40 ring-accent/20"
          : "border-border/60 ring-black/4 hover:border-accent/30 dark:ring-white/6"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-linear-to-br from-accent/7 via-transparent to-primary/6 dark:from-accent/12 dark:to-primary/8"
        aria-hidden
      />
      <div className="relative p-5">
        <div className="flex gap-4">
          {playBtn}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5 gap-y-1">
              <h4 className="text-base font-semibold tracking-tight text-foreground">
                {s.name}
              </h4>
              {s.source ? (
                <span className="rounded-full border border-border/60 bg-background/50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.source}
                </span>
              ) : null}
            </div>
            <a
              href={s.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center rounded-lg bg-background/60 px-2.5 py-1 font-mono text-xs text-accent/95 ring-1 ring-border/40 transition hover:bg-background hover:ring-accent/25"
              title={s.sourceUrl}
            >
              <span className="truncate">{shortenDisplayUrl(s.sourceUrl, 56)}</span>
            </a>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <LibraryCategorySelect
            label={t("aiLibrary.typeLabel")}
            value={selectedType}
            onChange={(ty) => onSetType(index, ty)}
            disabled={added}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isAddingToLibrary || added}
              onClick={() => onAddToLibrary(s, index)}
              className={primaryBtn}
            >
              {added ? t("libraryPage.suggestionAdded") : t("aiLibrary.addToLibrary")}
            </button>
            {onAddToScene && (
              <button
                type="button"
                onClick={() =>
                  onAddToScene(s.name, libraryStorageUrlFromAiSuggestion(s))
                }
                className={sceneBtn}
              >
                {t("aiLibrary.addToScene")}
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function SuggestionList({
  suggestions,
  suggestionTypes,
  addedKeys,
  onSetType,
  onAddToLibrary,
  onAddToScene,
  isAddingToLibrary,
  compact,
}: SuggestionListProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const playingIndexRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      previewAudioRef.current?.pause();
    };
  }, []);

  const handlePlay = (previewUrl: string, index: number) => {
    if (playingIndexRef.current === index) {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
      playingIndexRef.current = null;
      setPlayingIndex(null);
      return;
    }

    previewAudioRef.current?.pause();

    const audio = new Audio(previewUrl);
    previewAudioRef.current = audio;
    playingIndexRef.current = index;
    setPlayingIndex(index);

    audio.play();

    audio.onended = () => {
      previewAudioRef.current = null;
      playingIndexRef.current = null;
      setPlayingIndex(null);
    };

    audio.onpause = () => {
      if (playingIndexRef.current !== index) return;
      setPlayingIndex(null);
    };
  };

  const suggestionKey = (s: AiChatSuggestion, index: number) =>
    `${s.sourceUrl}::${index}`;

  if (compact) {
    return (
      <ul className="space-y-3">
        {suggestions.map((s, index) => {
          const key = suggestionKey(s, index);
          const added = addedKeys?.has(key) ?? false;
          const isPlaying = playingIndex === index;

          return (
            <SuggestionRow
              key={key}
              s={s}
              index={index}
              compact
              added={added}
              isPlaying={isPlaying}
              selectedType={suggestionTypes[index] ?? "ambience"}
              onSetType={onSetType}
              onAddToLibrary={onAddToLibrary}
              onAddToScene={onAddToScene}
              isAddingToLibrary={isAddingToLibrary}
              onPlay={handlePlay}
            />
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="space-y-4">
      {suggestions.map((s, index) => {
        const key = suggestionKey(s, index);
        const added = addedKeys?.has(key) ?? false;
        const isPlaying = playingIndex === index;

        return (
          <SuggestionRow
            key={key}
            s={s}
            index={index}
            compact={false}
            added={added}
            isPlaying={isPlaying}
            selectedType={suggestionTypes[index] ?? "ambience"}
            onSetType={onSetType}
            onAddToLibrary={onAddToLibrary}
            onAddToScene={onAddToScene}
            isAddingToLibrary={isAddingToLibrary}
            onPlay={handlePlay}
          />
        );
      })}
    </ul>
  );
}
