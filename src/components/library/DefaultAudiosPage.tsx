"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { AddToSceneModal } from "@/components/audio/AddToSceneModal";
import { AudioRow } from "@/components/audio/AudioRow";
import { Navbar } from "@/components/layout/Navbar";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_AUDIO_CATEGORIES } from "@/lib/default-audio-categories";
import type { DefaultCatalogItem } from "@/lib/default-audio-catalog";
import { loadDefaultAudios } from "@/lib/default-audio-catalog";
import { audioItemFromDefaultCatalogItem } from "@/lib/default-item-to-audio-item";
import { DEFAULT_CATALOG_PLAYER_SCENE_ID } from "@/lib/default-item-to-audio-item";
import { useI18n } from "@/contexts/I18nContext";
import { getErrorMessage } from "@/lib/errors";
import type { AudioItem } from "@/lib/types";
import {
  useAddAudioToScenesMutation,
  useAdminFeatures,
  useLibraryDefaultFavoritesQuery,
  useScenesQuery,
} from "@/hooks/api";
import { queryKeys } from "@/hooks/api/queryKeys";

function matchesSearch(
  item: DefaultCatalogItem,
  query: string,
  t: (key: string) => string,
): boolean {
  const n = query.trim().toLowerCase();
  if (!n) return true;
  if (item.name.toLowerCase().includes(n)) return true;
  if (item.type.toLowerCase().includes(n)) return true;
  const title = t(`defaultAudioCategory.${item.type}.title`);
  const sub = t(`defaultAudioCategory.${item.type}.subtitle`);
  if (title.toLowerCase().includes(n)) return true;
  if (sub.toLowerCase().includes(n)) return true;
  return false;
}

function groupByCategory(items: DefaultCatalogItem[]): Map<string, DefaultCatalogItem[]> {
  const map = new Map<string, DefaultCatalogItem[]>();
  for (const { slug } of DEFAULT_AUDIO_CATEGORIES) {
    map.set(slug, []);
  }
  for (const item of items) {
    const list = map.get(item.type);
    if (list) list.push(item);
  }
  return map;
}

export function DefaultAudiosPage() {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const [audioToAddToScenes, setAudioToAddToScenes] = useState<AudioItem | null>(null);
  const { user } = useAuth();
  const { realUser, allowed, showMyAudioLibraryLink } = useAdminFeatures();
  const { data: scenes = [], isLoading: scenesLoading } = useScenesQuery(
    user?.uid,
  );
  const addToSceneDisabled =
    Boolean(user?.uid) && (scenesLoading || scenes.length === 0);
  const addAudioToScenesMutation = useAddAudioToScenesMutation();

  const {
    data: items,
    isPending: catalogPending,
    isSuccess: catalogSuccess,
    isError: isLoadError,
  } = useQuery({
    queryKey: queryKeys.defaultAudios,
    queryFn: loadDefaultAudios,
    staleTime: Infinity,
  });

  const favoritesEnabled = realUser && allowed;
  const {
    data: defaultFavorites = [],
    isPending: favoritesPending,
  } = useLibraryDefaultFavoritesQuery({
    enabled: favoritesEnabled,
  });

  const userCatalogItems: DefaultCatalogItem[] = useMemo(
    () =>
      defaultFavorites.map((f) => ({
        id: `uf-${f.id}`,
        name: f.displayName,
        sourceUrl: f.sourceUrl,
        type: f.category,
      })),
    [defaultFavorites],
  );

  const mergedItems = useMemo(
    () => [...(items ?? []), ...userCatalogItems],
    [items, userCatalogItems],
  );

  const filtered = useMemo(() => {
    return mergedItems.filter((item) => matchesSearch(item, search, t));
  }, [mergedItems, search, t]);

  const byCategory = useMemo(() => groupByCategory(filtered), [filtered]);

  /** Sections ordered A–Z by localized category title; items A–Z by name. */
  const displaySections = useMemo(() => {
    const sections = DEFAULT_AUDIO_CATEGORIES.map(({ slug, icon }) => {
      const items = [...(byCategory.get(slug) ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, locale, { sensitivity: "base" }),
      );
      return { slug, icon, items };
    }).filter((s) => s.items.length > 0);

    sections.sort((a, b) =>
      t(`defaultAudioCategory.${a.slug}.title`).localeCompare(
        t(`defaultAudioCategory.${b.slug}.title`),
        locale,
        { sensitivity: "base" },
      ),
    );

    return sections;
  }, [byCategory, locale, t]);

  useEffect(() => {
    document.title = `${t("defaultAudiosPage.documentTitle")} · ${t("brand.name")}`;
  }, [locale, t]);

  const hasAnyItems = mergedItems.length > 0;
  const showNoSearchResults =
    hasAnyItems && filtered.length === 0 && search.trim().length > 0;

  const catalogAndFavoritesReady =
    !catalogPending &&
    !isLoadError &&
    (!favoritesEnabled || !favoritesPending);

  /** Direct file URLs only; YouTube/Spotify rows mount after data is ready. */
  const fileUrlsSorted = useMemo(() => {
    const urls = new Set<string>();
    for (const item of mergedItems) {
      const a = audioItemFromDefaultCatalogItem(item);
      if (a.kind === "file") urls.add(a.sourceUrl);
    }
    return [...urls].sort();
  }, [mergedItems]);

  const fileUrlsKey = useMemo(() => JSON.stringify(fileUrlsSorted), [fileUrlsSorted]);

  /** Last key whose file URLs finished metadata preload (avoids one frame with stale `true`). */
  const [preloadedFileUrlsKey, setPreloadedFileUrlsKey] = useState<string | null>(null);

  const fileMetadataReady =
    !catalogAndFavoritesReady || isLoadError
      ? false
      : fileUrlsSorted.length === 0
        ? true
        : preloadedFileUrlsKey === fileUrlsKey;

  useEffect(() => {
    if (!catalogAndFavoritesReady || isLoadError) {
      return;
    }

    if (fileUrlsSorted.length === 0) {
      return;
    }

    const urls = fileUrlsSorted;
    let cancelled = false;
    const disposers: Array<() => void> = [];
    const TIMEOUT_MS = 15_000;
    let settled = 0;
    const settle = () => {
      if (cancelled) return;
      settled += 1;
      if (settled >= urls.length) setPreloadedFileUrlsKey(fileUrlsKey);
    };

    for (const src of urls) {
      const a = new Audio();
      a.preload = "metadata";
      let done = false;
      const finish = () => {
        if (done || cancelled) return;
        done = true;
        window.clearTimeout(timer);
        a.removeEventListener("loadedmetadata", finish);
        a.removeEventListener("error", finish);
        settle();
      };
      const timer = window.setTimeout(finish, TIMEOUT_MS);
      a.addEventListener("loadedmetadata", finish);
      a.addEventListener("error", finish);
      a.src = src;
      a.load();
      disposers.push(() => {
        window.clearTimeout(timer);
        a.removeEventListener("loadedmetadata", finish);
        a.removeEventListener("error", finish);
        a.src = "";
      });
    }

    return () => {
      cancelled = true;
      for (const d of disposers) d();
    };
  }, [catalogAndFavoritesReady, isLoadError, fileUrlsKey, fileUrlsSorted]);

  const showPageLoader =
    !isLoadError &&
    (catalogPending ||
      (favoritesEnabled && favoritesPending) ||
      !fileMetadataReady);

  const showEmptyCatalog =
    catalogAndFavoritesReady &&
    fileMetadataReady &&
    catalogSuccess &&
    !hasAnyItems;

  const handleAddToScenes = useCallback(
    async (sceneIds: string[]) => {
      if (!audioToAddToScenes || sceneIds.length === 0) return;
      try {
        await addAudioToScenesMutation.mutateAsync({
          sceneIds,
          data: {
            name: audioToAddToScenes.name,
            sourceUrl: audioToAddToScenes.sourceUrl,
            kind: audioToAddToScenes.kind,
          },
        });
        toast.success(t("libraryPage.suggestionAdded"));
        setAudioToAddToScenes(null);
      } catch (err) {
        toast.error(getErrorMessage(err, t("defaultAudiosPage.addToSceneFailed")));
      }
    },
    [audioToAddToScenes, addAudioToScenesMutation, t],
  );

  const openAddToScene = useCallback((audio: AudioItem) => {
    setAudioToAddToScenes(audio);
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <AddToSceneModal
        key={audioToAddToScenes?.id ?? "closed"}
        open={!!audioToAddToScenes}
        onClose={() => !addAudioToScenesMutation.isPending && setAudioToAddToScenes(null)}
        audio={audioToAddToScenes}
        currentSceneId=""
        scenes={scenes}
        loading={addAudioToScenesMutation.isPending}
        onAdd={handleAddToScenes}
      />
      <Navbar
        logo={<SoundQuestLogo />}
        logoHref="/dashboard"
        logoAriaLabel={t("brand.name")}
      />
      <section
        className="mx-auto max-w-6xl px-4 py-6 pb-24"
        aria-label={t("defaultAudiosPage.title")}
      >
        {isLoadError ? (
          <p className="text-sm text-red-400" role="alert">
            {t("defaultAudiosPage.loadError")}
          </p>
        ) : showPageLoader ? (
          <div
            className="flex min-h-[min(60vh,calc(100dvh-10rem))] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-4 py-16 text-muted-foreground"
            role="status"
            aria-live="polite"
            aria-label={t("common.loading")}
          >
            <div className="flex items-center">
              <Spinner />
              <span className="ml-2 text-sm">{t("common.loading")}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-accent">{t("defaultAudiosPage.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("defaultAudiosPage.description")}</p>
              </div>
              {showMyAudioLibraryLink && (
                <Link
                  href="/library"
                  className="shrink-0 rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition hover:bg-card"
                >
                  {t("defaultAudiosPage.linkToLibrary")}
                </Link>
              )}
            </div>

            <div className="relative mb-8">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("defaultAudiosPage.searchPlaceholder")}
                aria-label={t("defaultAudiosPage.searchAria")}
                className="w-full rounded-lg border border-border bg-card/40 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {showEmptyCatalog ? (
              <div className="rounded-lg border border-border bg-card/30 p-8 text-center">
                <p className="text-muted-foreground">{t("defaultAudiosPage.emptyCatalog")}</p>
              </div>
            ) : showNoSearchResults ? (
              <div className="rounded-lg border border-border bg-card/30 p-8 text-center">
                <p className="text-muted-foreground">{t("defaultAudiosPage.noSearchResults")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-6 md:gap-y-8">
                {displaySections.map(({ slug, icon: Icon, items: sectionItems }) => (
                  <section
                    key={slug}
                    className="min-w-0"
                    aria-labelledby={`default-cat-${slug}`}
                  >
                    <div className="mb-3 flex items-start gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card/80 text-accent">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <h2
                          id={`default-cat-${slug}`}
                          className="text-sm font-semibold text-foreground"
                        >
                          {t(`defaultAudioCategory.${slug}.title`)}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {t(`defaultAudioCategory.${slug}.subtitle`)}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {sectionItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border border-l-[3px] border-l-accent bg-card/30 px-2.5 py-2"
                        >
                          <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                            {item.name}
                          </span>
                          <AudioRow
                            playbackOnly
                            simplifiedPlaybackControls
                            playbackOmitStop
                            compactPlayback
                            audio={audioItemFromDefaultCatalogItem(item)}
                            sceneId={DEFAULT_CATALOG_PLAYER_SCENE_ID}
                            className="shrink-0"
                            onAddToScene={
                              user?.uid ? (a) => openAddToScene(a) : undefined
                            }
                            addToSceneDisabled={addToSceneDisabled}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
