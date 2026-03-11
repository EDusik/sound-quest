"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  getPreviewUrl,
  type FreesoundSound,
  type FreesoundSearchResponse,
} from "@/lib/freesound";
import {
  useFreesoundConfiguredQuery,
  useFreesoundSearchQuery,
  useAddAudioMutation,
} from "@/hooks/api";
import { getErrorMessage, getTranslatedFreesoundError } from "@/lib/errors";
import { useTranslations } from "@/contexts/I18nContext";
import { Spinner } from "@/components/ui/Spinner";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { FreesoundResultItem } from "./FreesoundResultItem";

interface FreesoundSearchProps {
  sceneId: string;
  onAdded: () => void;
}

const PAGE_SIZE = 15;

function buildFilterParam(rawFilter: string): string | undefined {
  if (!rawFilter.trim()) return undefined;
  const trimmed = rawFilter.trim();
  return trimmed.includes(":")
    ? trimmed
    : trimmed
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => `tag:${t}`)
        .join(" ");
}

export function FreesoundSearch({ sceneId, onAdded }: FreesoundSearchProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [searchParams, setSearchParams] = useState<{
    query: string;
    filter?: string;
    page: number;
    pageSize: number;
  } | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const { data: configured = false, isLoading: configuredLoading } = useFreesoundConfiguredQuery();
  const searchQuery = useFreesoundSearchQuery(searchParams);
  const addAudioMutation = useAddAudioMutation(sceneId);

  const results: FreesoundSound[] = searchQuery.data?.results ?? [];
  const searchData: FreesoundSearchResponse | undefined = searchQuery.data;
  const currentPage = searchParams?.page ?? 1;
  const pageSize = searchParams?.pageSize ?? PAGE_SIZE;
  const hasNextPage =
    typeof searchData?.count === "number" &&
    searchData.count > currentPage * pageSize;
  const hasPreviousPage = currentPage > 1;
  const loading = searchParams !== null && searchQuery.isPending;
  const searchError = searchQuery.error
    ? getTranslatedFreesoundError(searchQuery.error, t, "freesound.searchFailed")
    : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchParams({
      query: q,
      filter: buildFilterParam(filter),
      page: 1,
      pageSize: PAGE_SIZE,
    });
  };

  const handlePageChange = (page: number) => {
    const q = query.trim();
    if (!q || !searchParams) return;
    setSearchParams({
      ...searchParams,
      page,
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
    } catch (err) {
      toast.warning(getErrorMessage(err, t("freesound.addFailed")));
    } finally {
      setAddingId(null);
    }
  };

  const addError = addAudioMutation.error
    ? getErrorMessage(addAudioMutation.error, t("freesound.addFailed"))
    : null;
  const error = addError ?? searchError;

  useEffect(() => {
    if (searchError) toast.warning(searchError);
  }, [searchError]);

  useEffect(() => {
    if (addError) toast.warning(addError);
  }, [addError]);

  if (!configuredLoading && !configured) {
    return (
      <CollapsibleSection summary={<span>{t("freesound.title")}</span>}>
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
      </CollapsibleSection>
    );
  }

  const summary = (
    <>
      <span>{t("freesound.title")}</span>
      {results.length > 0 && (
        <span className="text-xs font-normal text-muted">
          {results.length === 1
            ? t("freesound.resultCount", { count: 1 })
            : t("freesound.resultCountPlural", { count: results.length })}
        </span>
      )}
    </>
  );

  return (
    <CollapsibleSection summary={summary}>
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
                  setSearchParams(null);
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
              {results.map((sound) => (
                <FreesoundResultItem
                  key={sound.id}
                  sound={sound}
                  isPlaying={playingId === sound.id}
                  isAdding={addingId === sound.id}
                  onPlay={() => handlePlay(sound)}
                  onAdd={() => handleAdd(sound)}
                />
              ))}
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
    </CollapsibleSection>
  );
}
