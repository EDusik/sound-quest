"use client";

import { useState } from "react";
import { extractSpotifyId, toSpotifyUri } from "@/lib/spotify";
import { useTranslations } from "@/contexts/I18nContext";
import type { SpotifyTrack } from "@/lib/types";

interface SpotifyAddFormProps {
  /** Shared name from parent (used when embedded in AddSoundModal) */
  sharedName?: string;
  /** Controlled mode: when provided, input uses this value */
  spotifyUrl?: string;
  /** Called when Spotify URL changes (for parent to disable other inputs) */
  onSpotifyUrlChange?: (url: string) => void;
  /** When true, input and button are disabled */
  disabled?: boolean;
  /** When true, hide the submit button (parent provides single Add button) */
  hideSubmitButton?: boolean;
  onAdd: (track: SpotifyTrack) => void | Promise<void>;
  /** Optional error message from parent */
  error?: string | null;
  /** When true, submit button shows loading state (for async onAdd) */
  isAdding?: boolean;
}

function generateId(): string {
  return `spotify-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function SpotifyAddForm({
  sharedName = "",
  spotifyUrl: controlledUrl,
  onSpotifyUrlChange,
  disabled = false,
  hideSubmitButton = false,
  onAdd,
  error,
  isAdding = false,
}: SpotifyAddFormProps) {
  const t = useTranslations();
  const [internalUrl, setInternalUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const isControlled = controlledUrl !== undefined;
  const inputUrl = isControlled ? controlledUrl : internalUrl;

  const setInputUrl = (url: string) => {
    if (!isControlled) setInternalUrl(url);
    onSpotifyUrlChange?.(url);
  };

  const handleAdd = async () => {
    setLocalError(null);
    const parsed = extractSpotifyId(inputUrl);
    if (!parsed) {
      setLocalError(t("addSound.spotifyUrlInvalid"));
      return;
    }
    const spotifyUri = toSpotifyUri(parsed.id, parsed.type);
    const name = (sharedName ?? "").trim() || `${parsed.type} ${parsed.id}`;
    const track: SpotifyTrack = {
      id: generateId(),
      name,
      spotifyUri,
    };
    await onAdd(track);
    if (!isControlled) setInternalUrl("");
    setLocalError(null);
    onSpotifyUrlChange?.("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAdd();
  };

  const parsed = extractSpotifyId(inputUrl);
  const isValid = !!parsed;

  const content = (
    <>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <label
            htmlFor="spotify-url"
            className="block text-xs text-foreground"
          >
            {t("addSound.spotifyLabel")}
          </label>
          <input
            id="spotify-url"
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder={t("addSound.spotifyPlaceholder")}
            disabled={disabled}
            className="mt-1 w-full rounded border border-border bg-card px-3 py-2 text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>
      {!hideSubmitButton && (
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="submit"
            disabled={disabled || !isValid || isAdding}
            className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isAdding ? t("addSound.adding") : t("addSound.addAudioButton")}
          </button>
        </div>
      )}
      {!hideSubmitButton && (error || localError) && (
        <p className="text-destructive">{error ?? localError}</p>
      )}
    </>
  );

  if (hideSubmitButton) {
    return <div className="flex flex-col gap-4">{content}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {content}
    </form>
  );
}
