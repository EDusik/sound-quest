"use client";

import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { Navbar } from "@/components/layout/Navbar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Spinner } from "@/components/ui/Spinner";
import { AudioRow } from "@/components/audio/AudioRow";
import { EditableName } from "@/components/audio/EditableName";
import { EditIcon, TrashIcon } from "@/components/icons";
import { FavoriteToDefaultModal } from "@/components/library/FavoriteToDefaultModal";
import { useAuth, isRealUser } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  useAdminFeatures,
  useAddLibraryDefaultFavoriteMutation,
  useDeleteLibraryItemMutation,
  useLibraryDefaultFavoritesQuery,
  useLibraryQuery,
  useRemoveLibraryDefaultFavoriteMutation,
  useUpdateLibraryItemMutation,
} from "@/hooks/api";
import type { AudioLibraryItem } from "@/lib/audio-library-map";
import { DEFAULT_AUDIO_CATEGORIES } from "@/lib/default-audio-categories";
import { getErrorMessage } from "@/lib/errors";
import {
  audioItemFromLibraryItem,
  LIBRARY_PLAYER_SCENE_ID,
} from "@/lib/library-item-to-audio-item";
import { ApiError } from "@/lib/api-client";
import { AUDIO_LIBRARY_TYPES } from "@/lib/validators/api";

function matchesLibrarySearch(
  item: AudioLibraryItem,
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

function groupByType(items: AudioLibraryItem[]): Map<string, AudioLibraryItem[]> {
  const map = new Map<string, AudioLibraryItem[]>();
  for (const ty of AUDIO_LIBRARY_TYPES) {
    map.set(ty, []);
  }
  for (const item of items) {
    const list = map.get(item.type);
    if (list) list.push(item);
    else {
      const fallback = map.get("ambience") ?? [];
      fallback.push(item);
      map.set("ambience", fallback);
    }
  }
  return map;
}

const LIBRARY_EDITABLE_DISPLAY_CLASS =
  "truncate block text-sm font-medium text-foreground underline-offset-2 hover:underline";

const LIBRARY_EDITABLE_INPUT_CLASS =
  "w-full min-w-0 rounded border border-border bg-background px-2 py-1 text-sm font-medium text-foreground outline-none focus:border-accent";

const compactActionBtn =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition disabled:opacity-50";

export function LibraryBrowsePage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const realUser = isRealUser(user);
  const [search, setSearch] = useState("");
  const {
    allowed,
    forbidden,
    accessError,
    loading: accessLoading,
  } = useAdminFeatures();
  const {
    data: libraryItems = [],
    isLoading: libraryLoading,
    error: libraryError,
  } = useLibraryQuery({
    enabled: realUser && allowed,
  });
  const { data: defaultFavorites = [] } = useLibraryDefaultFavoritesQuery({
    enabled: realUser && allowed,
  });
  const deleteMutation = useDeleteLibraryItemMutation();
  const updateMutation = useUpdateLibraryItemMutation();
  const addDefaultFavoriteMutation = useAddLibraryDefaultFavoriteMutation();
  const removeDefaultFavoriteMutation = useRemoveLibraryDefaultFavoriteMutation();
  const [itemToDelete, setItemToDelete] = useState<AudioLibraryItem | null>(null);
  const [favoriteModalItem, setFavoriteModalItem] = useState<AudioLibraryItem | null>(
    null,
  );
  /** Inline rename (same pattern as scene audio rows). */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const filteredItems = useMemo(
    () => libraryItems.filter((item) => matchesLibrarySearch(item, search, t)),
    [libraryItems, search, t],
  );

  const byType = useMemo(() => groupByType(filteredItems), [filteredItems]);

  const displaySections = useMemo(() => {
    const sections = DEFAULT_AUDIO_CATEGORIES.map(({ slug, icon }) => {
      const items = [...(byType.get(slug) ?? [])].sort((a, b) =>
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
  }, [byType, locale, t]);

  const showNoSearchResults =
    libraryItems.length > 0 && filteredItems.length === 0 && search.trim().length > 0;

  const defaultFavoriteIds = useMemo(() => {
    return new Set(defaultFavorites.map((f) => f.libraryItemId));
  }, [defaultFavorites]);

  const libraryErrorMessage = useMemo(() => {
    if (!libraryError || forbidden) return null;
    return getErrorMessage(libraryError, t("aiLibrary.loadFailed"));
  }, [libraryError, forbidden, t]);

  const closeDeleteModal = useCallback(() => {
    if (!deleteMutation.isPending) setItemToDelete(null);
  }, [deleteMutation.isPending]);

  useEffect(() => {
    if (editingId && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingId]);

  const saveRename = useCallback(
    async (item: AudioLibraryItem) => {
      const trimmed = editNameValue.trim();
      if (trimmed && trimmed !== item.name) {
        try {
          await updateMutation.mutateAsync({ id: item.id, name: trimmed });
          toast.success(t("libraryPage.renameSuccess"));
        } catch (err) {
          toast.error(getErrorMessage(err, t("libraryPage.renameFailed")));
          return;
        }
      }
      setEditingId(null);
      setEditNameValue("");
    },
    [editNameValue, updateMutation, t],
  );

  const cancelRename = useCallback((item: AudioLibraryItem) => {
    setEditNameValue(item.name);
    setEditingId(null);
  }, []);

  useEffect(() => {
    document.title = `${t("libraryPage.documentTitle")} · ${t("brand.name")}`;
  }, [locale, t]);

  const closeFavoriteModal = useCallback(() => {
    if (!addDefaultFavoriteMutation.isPending) setFavoriteModalItem(null);
  }, [addDefaultFavoriteMutation.isPending]);

  const confirmAddToDefaultSounds = useCallback(
    async (payload: { displayName: string; category: string }) => {
      if (!favoriteModalItem) return;
      try {
        await addDefaultFavoriteMutation.mutateAsync({
          libraryItemId: favoriteModalItem.id,
          category: payload.category,
          displayName: payload.displayName,
        });
        toast.success(t("libraryPage.addToDefaultSoundsSuccess"));
        setFavoriteModalItem(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          toast.error(t("libraryPage.addToDefaultSoundsDuplicate"));
          return;
        }
        toast.error(getErrorMessage(err, t("libraryPage.addToDefaultSoundsError")));
      }
    },
    [addDefaultFavoriteMutation, favoriteModalItem, t],
  );

  const toggleDefaultFavorite = useCallback(
    async (item: AudioLibraryItem) => {
      if (defaultFavoriteIds.has(item.id)) {
        try {
          await removeDefaultFavoriteMutation.mutateAsync(item.id);
          toast.success(t("libraryPage.removeFromDefaultSoundsSuccess"));
        } catch (err) {
          toast.error(
            getErrorMessage(err, t("libraryPage.removeFromDefaultSoundsError")),
          );
        }
        return;
      }
      setFavoriteModalItem(item);
    },
    [defaultFavoriteIds, removeDefaultFavoriteMutation, t],
  );

  const confirmDeleteLibraryItem = useCallback(async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t("aiLibrary.removedFromLibrary"));
      setItemToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, t("aiLibrary.deleteFailed")));
    }
  }, [itemToDelete, deleteMutation, t]);

  if (!realUser) {
    return (
      <div className="bg-background">
        <Navbar
          logo={<SoundQuestLogo />}
          logoHref="/dashboard"
          logoAriaLabel={t("brand.name")}
        />
        <section className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-muted-foreground">{t("libraryPage.signInToView")}</p>
          <Link
            href="/login"
            className="mt-4 inline-block text-accent underline hover:opacity-90"
          >
            {t("nav.signIn")}
          </Link>
        </section>
      </div>
    );
  }

  if (accessLoading) {
    return (
      <div className="bg-background">
        <Navbar
          logo={<SoundQuestLogo />}
          logoHref="/dashboard"
          logoAriaLabel={t("brand.name")}
        />
        <section className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </section>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="bg-background">
        <Navbar
          logo={<SoundQuestLogo />}
          logoHref="/dashboard"
          logoAriaLabel={t("brand.name")}
        />
        <section className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-muted-foreground">{t("libraryPage.accessError")}</p>
        </section>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="bg-background">
        <Navbar
          logo={<SoundQuestLogo />}
          logoHref="/dashboard"
          logoAriaLabel={t("brand.name")}
        />
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-lg font-semibold text-foreground">
            {t("libraryPage.unavailableTitle")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("aiLibrary.forbidden")}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FavoriteToDefaultModal
        open={!!favoriteModalItem}
        item={favoriteModalItem}
        onClose={closeFavoriteModal}
        onConfirm={confirmAddToDefaultSounds}
        loading={addDefaultFavoriteMutation.isPending}
      />
      <ConfirmModal
        open={!!itemToDelete}
        onClose={closeDeleteModal}
        title={t("aiLibrary.removeLibraryTitle")}
        titleId="library-remove-modal-title"
        message={t("aiLibrary.removeLibraryConfirm", {
          name: itemToDelete?.name ?? "",
        })}
        confirmLabel={t("common.delete")}
        loadingConfirmLabel={t("dashboard.deleting")}
        loading={deleteMutation.isPending}
        onConfirm={confirmDeleteLibraryItem}
        confirmVariant="danger"
      />
      <Navbar
        logo={<SoundQuestLogo />}
        logoHref="/dashboard"
        logoAriaLabel={t("brand.name")}
      />
      <section
        className="mx-auto max-w-6xl px-4 py-6 pb-24"
        aria-label={t("libraryPage.title")}
      >
        {libraryErrorMessage ? (
          <p className="text-sm text-red-400" role="alert">
            {libraryErrorMessage}
          </p>
        ) : libraryLoading ? (
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
                <h1 className="text-xl font-semibold text-accent">{t("libraryPage.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("libraryPage.description")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href="/library/defaults"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-card"
                  aria-label={t("libraryPage.linkToDefaultsAria")}
                >
                  {t("libraryPage.linkToDefaults")}
                </Link>
                <Link
                  href="/library/ai"
                  className="rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition hover:bg-card"
                  aria-label={t("libraryPage.linkToAiAria")}
                >
                  {t("libraryPage.linkToAi")}
                </Link>
              </div>
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
                placeholder={t("libraryPage.searchPlaceholder")}
                aria-label={t("libraryPage.searchAria")}
                className="w-full rounded-lg border border-border bg-card/40 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {libraryItems.length === 0 ? (
              <div className="rounded-lg border border-border bg-card/30 p-8 text-center">
                <p className="text-muted-foreground">{t("aiLibrary.emptyLibrary")}</p>
                <Link
                  href="/library/ai"
                  className="mt-4 inline-block text-sm text-accent underline"
                >
                  {t("libraryPage.linkToAi")}
                </Link>
              </div>
            ) : showNoSearchResults ? (
              <div className="rounded-lg border border-border bg-card/30 p-8 text-center">
                <p className="text-muted-foreground">{t("libraryPage.noSearchResults")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-6 md:gap-y-8">
                {displaySections.map(({ slug, icon: Icon, items: sectionItems }) => (
                  <section
                    key={slug}
                    className="min-w-0"
                    aria-labelledby={`lib-cat-${slug}`}
                  >
                    <div className="mb-3 flex items-start gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card/80 text-accent">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <h2
                          id={`lib-cat-${slug}`}
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
                      {sectionItems.map((item) => {
                        const inDefaults = defaultFavoriteIds.has(item.id);
                        return (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border border-l-[3px] border-l-accent bg-card/30 px-2.5 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <EditableName
                                isEditing={editingId === item.id}
                                value={editNameValue}
                                displayText={item.name}
                                linkUrl={item.sourceUrl}
                                onChange={setEditNameValue}
                                onSave={() => void saveRename(item)}
                                onCancel={() => cancelRename(item)}
                                disabled={updateMutation.isPending}
                                inputRef={nameInputRef}
                                ariaLabel={t("common.editSoundName")}
                                displayClassName={LIBRARY_EDITABLE_DISPLAY_CLASS}
                                inputClassName={LIBRARY_EDITABLE_INPUT_CLASS}
                              />
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                disabled={
                                  deleteMutation.isPending ||
                                  updateMutation.isPending ||
                                  editingId === item.id ||
                                  removeDefaultFavoriteMutation.isPending ||
                                  addDefaultFavoriteMutation.isPending
                                }
                                onClick={() => void toggleDefaultFavorite(item)}
                                className={`${compactActionBtn} ${
                                  inDefaults
                                    ? "border-accent/60 bg-accent/15 text-accent"
                                    : "border-border text-muted-foreground hover:bg-border hover:text-foreground"
                                }`}
                                title={
                                  inDefaults
                                    ? t("libraryPage.removeFromDefaultSoundsHint")
                                    : t("libraryPage.addToDefaultSoundsHint")
                                }
                                aria-label={
                                  inDefaults
                                    ? t("libraryPage.removeFromDefaultSoundsAria")
                                    : t("libraryPage.addToDefaultSoundsAria")
                                }
                              >
                                <Heart
                                  className={`h-3.5 w-3.5 ${inDefaults ? "fill-current" : ""}`}
                                  aria-hidden
                                />
                              </button>
                              <AudioRow
                                playbackOnly
                                simplifiedPlaybackControls
                                playbackOmitStop
                                compactPlayback
                                audio={audioItemFromLibraryItem(item)}
                                sceneId={LIBRARY_PLAYER_SCENE_ID}
                                isInactive={
                                  editingId === item.id ||
                                  deleteMutation.isPending ||
                                  updateMutation.isPending
                                }
                                className="shrink-0"
                              />
                              <button
                                type="button"
                                disabled={
                                  deleteMutation.isPending ||
                                  updateMutation.isPending ||
                                  editingId === item.id
                                }
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditNameValue(item.name);
                                }}
                                className={`${compactActionBtn} border-border text-muted hover:bg-border hover:text-foreground disabled:hover:bg-transparent`}
                                title={t("common.editSoundName")}
                                aria-label={t("common.editSoundName")}
                              >
                                <EditIcon className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={
                                  deleteMutation.isPending ||
                                  updateMutation.isPending ||
                                  editingId === item.id
                                }
                                onClick={() => setItemToDelete(item)}
                                className={`${compactActionBtn} border-border text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:hover:bg-transparent`}
                                title={t("aiLibrary.removeFromLibrary")}
                                aria-label={t("libraryPage.removeItemAria")}
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
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
