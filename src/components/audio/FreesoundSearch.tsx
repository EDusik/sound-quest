"use client";

import { useState, useRef } from "react";
import {
  getPreviewUrl,
  type FreesoundSound,
  type FreesoundSearchResponse,
} from "@/lib/freesound";
import {
  useFreesoundConfiguredQuery,
  useFreesoundSearchMutation,
  useAddAudioMutation,
} from "@/hooks/api";
import { getErrorMessage } from "@/lib/errors";
import { useTranslations } from "@/contexts/I18nContext";
import { Spinner } from "@/components/ui/Spinner";

interface FreesoundSearchProps {
  sceneId: string;
  onAdded: () => void;
}

export function FreesoundSearch({ sceneId, onAdded }: FreesoundSearchProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const { data: configured = false, isLoading: configuredLoading } = useFreesoundConfiguredQuery();
  const searchMutation = useFreesoundSearchMutation();
  const addAudioMutation = useAddAudioMutation(sceneId);

  const results: FreesoundSound[] = searchMutation.data?.results ?? [];
  const searchData: FreesoundSearchResponse | undefined = searchMutation.data;
  const currentPage = searchMutation.variables?.page ?? 1;
  const pageSize = searchMutation.variables?.pageSize ?? 15;
  const hasNextPage =
    typeof searchData?.count === "number" &&
    searchData.count > currentPage * pageSize;
  const hasPreviousPage = currentPage > 1;
  const loading = searchMutation.isPending;
  const searchError = searchMutation.error
    ? getErrorMessage(searchMutation.error, t("freesound.searchFailed"))
    : null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const rawFilter = filter.trim();
    const filterParam =
      rawFilter &&
      (rawFilter.includes(":")
        ? rawFilter
        : rawFilter
            .split(/\s+/)
            .filter(Boolean)
            .map((t) => `tag:${t}`)
            .join(" "));
    searchMutation.mutate({
      query: q,
      filter: filterParam || undefined,
      page: 1,
      pageSize,
    });
  };

  const handlePageChange = (page: number) => {
    const q = query.trim();
    if (!q) return;
    const rawFilter = filter.trim();
    const filterParam =
      rawFilter &&
      (rawFilter.includes(":")
        ? rawFilter
        : rawFilter
            .split(/\s+/)
            .filter(Boolean)
            .map((t) => `tag:${t}`)
            .join(" "));
    searchMutation.mutate({
      query: q,
      filter: filterParam || undefined,
      page,
      pageSize,
    });
  };

  const handlePlay = (sound: FreesoundSound) => {
    const url = getPreviewUrl(sound.previews);
    if (!url) return;
    if (playingId === sound.id) {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
      setPlayingId(null);
      return;
    }
    previewAudioRef.current?.pause();
    const audio = new Audio(url);
    previewAudioRef.current = audio;
    audio.play();
    setPlayingId(sound.id);
    audio.onended = () => {
      previewAudioRef.current = null;
      setPlayingId(null);
    };
    audio.onpause = () => {
      if (playingId !== sound.id) return;
      setPlayingId(null);
    };
  };

  const handleAdd = async (sound: FreesoundSound) => {
    const url = getPreviewUrl(sound.previews);
    if (!url) return;
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    setPlayingId(null);
    setAddingId(sound.id);
    try {
      await addAudioMutation.mutateAsync({
        name: sound.name,
        sourceUrl: url,
        kind: "freesound",
      });
      onAdded();
    } catch {
      // Error shown via addAudioMutation.error - could add toast/display
    } finally {
      setAddingId(null);
    }
  };

  const addError = addAudioMutation.error
    ? getErrorMessage(addAudioMutation.error, t("freesound.addFailed"))
    : null;
  const error = addError ?? searchError;

  if (configuredLoading) {
    return (
      <details className="group rounded-lg border border-border bg-card/50">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-card/80 [&::-webkit-details-marker]:hidden">
          <span>{t("freesound.title")}</span>
          <span className="text-xs text-muted">{t("freesound.searching")}</span>
          <svg
            className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </summary>
      </details>
    );
  }

  if (!configured) {
    return (
      <details className="group rounded-lg border border-border bg-card/50">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-card/80 [&::-webkit-details-marker]:hidden">
          <span>{t("freesound.title")}</span>
          <svg
            className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </summary>
        <div className="border-t border-border p-4">
          <p className="text-sm text-muted">
            {t("freesound.notConfiguredPrefix")}
            <code className="rounded bg-border px-1">{t("freesound.notConfiguredCode")}</code>
            {t("freesound.notConfiguredMiddle")}
            <a
              href="https://freesound.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {t("freesound.freesoundLink")}
            </a>
            {t("freesound.notConfiguredSuffix")}
            <a
              href="https://freesound.org/apiv2/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {t("freesound.applyLink")}
            </a>
            .
          </p>
        </div>
      </details>
    );
  }

  return (
    <details className="group rounded-lg border border-border bg-card/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-card/80 [&::-webkit-details-marker]:hidden">
        <span>{t("freesound.title")}</span>
        {results.length > 0 && (
          <span className="text-xs font-normal text-muted">
            {results.length === 1
              ? t("freesound.resultCount", { count: 1 })
              : t("freesound.resultCountPlural", { count: results.length })}
          </span>
        )}
        <svg
          className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div className="border-t border-border p-4">
        <p className="mb-2 text-xs text-muted">
          {t("freesound.queryHelp")}
        </p>
        <form onSubmit={handleSearch} className="mb-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (!v.trim()) {
                  searchMutation.reset();
                }
              }}
              placeholder={t("freesound.queryPlaceholder")}
              className="min-w-0 flex-1 basis-full rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder-muted focus:border-accent focus:outline-none sm:basis-0"
              aria-label={t("freesound.searchAria")}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-50 sm:w-auto"
            >
              {loading ? t("freesound.searching") : t("freesound.search")}
            </button>
          </div>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("freesound.filterPlaceholder")}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none"
            aria-label={t("freesound.filterAria")}
          />
        </form>
        {error && (
          <p className="mb-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {loading && results.length === 0 && (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        )}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
            <ul className="space-y-2">
              {results.map((sound) => {
                const previewUrl = getPreviewUrl(sound.previews);
                const isPlaying = playingId === sound.id;
                const isAdding = addingId === sound.id;
                return (
                  <li
                    key={sound.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/50 bg-card/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {sound.name}
                      </p>
                      {sound.duration != null && (
                        <p className="text-xs text-muted">
                          {Math.round(sound.duration)}s
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlay(sound)}
                        disabled={!previewUrl}
                        className="rounded bg-border p-2 text-foreground hover:bg-border/80 disabled:opacity-50"
                        title={isPlaying ? t("common.stop") : t("common.playPreview")}
                        aria-label={isPlaying ? t("common.stop") : t("common.playPreview")}
                      >
                        {isPlaying ? (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdd(sound)}
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
              })}
            </ul>
            <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted">
              <span>
                {t("freesound.pageInfo", {
                  page: currentPage,
                  pageSize,
                  total: searchData?.count ?? results.length,
                })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!hasPreviousPage || loading}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="flex items-center justify-center rounded border border-border p-1 text-xs disabled:opacity-50"
                  aria-label={t("common.prev")}
                  title={t("common.prev")}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={!hasNextPage || loading}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="flex items-center justify-center rounded border border-border p-1 text-xs disabled:opacity-50"
                  aria-label={t("common.next")}
                  title={t("common.next")}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
