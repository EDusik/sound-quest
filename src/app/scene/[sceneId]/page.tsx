"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useSceneQuery,
  useAudiosQuery,
  useReorderAudiosMutation,
  useRemoveAudioMutation,
  useUpdateAudioMutation,
} from "@/hooks/api";
import type { AudioItem } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/I18nContext";
import { SceneTitleBlock } from "@/components/scene/SceneTitleBlock";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { Navbar } from "@/components/layout/Navbar";
import { SearchBar } from "@/components/search/SearchBar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AddSoundModal } from "@/components/audio/AddSoundModal";
import { AudiosBlock } from "@/components/audio/AudiosBlock";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { IconButton } from "@/components/ui/IconButton";
import { useAudioStore } from "@/store/audioStore";
import { getErrorMessage } from "@/lib/errors";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useFocusEntryOnce } from "@/hooks/useFocusEntryOnce";

export default function ScenePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sceneIdOrSlug = Array.isArray(params.sceneId)
    ? params.sceneId[0] ?? ""
    : (params.sceneId ?? "");
  const {
    data: sceneData,
    isLoading: sceneLoading,
    error: sceneError,
  } = useSceneQuery(sceneIdOrSlug, user?.uid);
  const scene = sceneData ?? null;
  const sceneId = scene?.id ?? "";
  const { data: audios = [], isLoading: audiosLoading } = useAudiosQuery(sceneId);
  const loading = sceneLoading;
  const reorderAudiosMutation = useReorderAudiosMutation(sceneId);
  const removeAudioMutation = useRemoveAudioMutation(sceneId);
  const updateAudioMutation = useUpdateAudioMutation(sceneId);
  const t = useTranslations();
  const error =
    !sceneIdOrSlug
      ? t("scene.sceneNotFound")
      : sceneError
        ? getErrorMessage(sceneError, t("scene.failedToLoad"))
        : null;
  const [search, setSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [audioToDelete, setAudioToDelete] = useState<AudioItem | null>(null);
  const [inactiveAudioIds, setInactiveAudioIds] = useState<string[]>([]);
  const [showAddSoundModal, setShowAddSoundModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const showFocusEntry = useFocusEntryOnce("scene");

  const filteredAudios = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return audios;
    return audios.filter((a) => a.name.toLowerCase().includes(q));
  }, [audios, search]);

  const activeAudios = useMemo(
    () => filteredAudios.filter((a) => !inactiveAudioIds.includes(a.id)),
    [filteredAudios, inactiveAudioIds],
  );

  const inactiveAudios = useMemo(
    () => filteredAudios.filter((a) => inactiveAudioIds.includes(a.id)),
    [filteredAudios, inactiveAudioIds],
  );

  const toggleAudioActive = (audio: AudioItem) => {
    setInactiveAudioIds((prev) =>
      prev.includes(audio.id)
        ? prev.filter((id) => id !== audio.id)
        : [...prev, audio.id],
    );
  };

  const handleAddSoundClose = useCallback(() => {
    setShowAddSoundModal(false);
  }, []);

  const handleAddSoundAdded = useCallback(async () => {
    setShowAddSoundModal(false);
  }, []);

  const handleDragStart = (e: React.DragEvent, audioId: string) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, [role='button'], a")) return;
    setDraggedId(audioId);
    e.dataTransfer.setData("audioId", audioId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const audioId = e.dataTransfer.getData("audioId");
    if (!audioId || !draggedId) return;
    const fromIndex = filteredAudios.findIndex((a) => a.id === draggedId);
    if (fromIndex === -1 || fromIndex === toIndex) {
      setDraggedId(null);
      return;
    }
    useAudioStore.getState().stopAll();
    const reordered = [...filteredAudios];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const rest = audios.filter((a) => !reordered.some((r) => r.id === a.id));
    const newAudios = reordered.map((a, i) => ({ ...a, order: i }));
    const orderedIds = [
      ...newAudios.map((a) => a.id),
      ...rest.map((a) => a.id),
    ];
    setDraggedId(null);
    setReorderError(null);
    try {
      await reorderAudiosMutation.mutateAsync(orderedIds);
    } catch (err) {
      setReorderError(getErrorMessage(err, t("scene.failedReorder")));
    }
  };

  const handleConfirmDelete = async () => {
    if (!audioToDelete) return;
    const id = audioToDelete.id;
    try {
      const p = useAudioStore.getState().players.get(id);
      if (p?.ref) {
        p.ref.pause();
        p.ref.currentTime = 0;
      }
      useAudioStore.getState().setState(id, "stopped");
      await removeAudioMutation.mutateAsync(id);
      setAudioToDelete(null);
    } catch {
      // Error could be shown via mutation.error
    }
  };

  const closeDeleteModal = useCallback(() => {
    if (!removeAudioMutation.isPending) setAudioToDelete(null);
  }, [removeAudioMutation.isPending]);

  const handleRename = useCallback(
    async (audio: AudioItem, newName: string) => {
      setRenameError(null);
      try {
        await updateAudioMutation.mutateAsync({ ...audio, name: newName });
      } catch (err) {
        setRenameError(getErrorMessage(err, t("scene.failedRename")));
      }
    },
    [updateAudioMutation, t],
  );

  useEffect(() => {
    if (!audioToDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDeleteModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [audioToDelete, closeDeleteModal]);

  // When opening by id, replace URL with slug so the bar shows the scene name
  useEffect(() => {
    if (!scene?.slug || sceneIdOrSlug === scene.slug) return;
    if (sceneIdOrSlug === scene.id) {
      router.replace(`/scene/${scene.slug}`, { scroll: false });
    }
  }, [scene?.id, scene?.slug, sceneIdOrSlug, router]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        role="status"
        aria-live="polite"
        aria-label={t("common.loading")}
      >
        <Spinner />
        <span className="sr-only">{t("common.loading")}</span>
      </div>
    );
  }

  if (error || !scene) {
    return (
      <ErrorPage
        message={error ?? t("scene.sceneNotFound")}
        backHref="/dashboard"
        backLabel={t("scene.backToDashboard")}
      />
    );
  }

  return (
    <div className="bg-background pb-32">
      <ConfirmModal
        open={!!audioToDelete}
        onClose={closeDeleteModal}
        title={t("scene.deleteSoundTitle")}
        titleId="delete-modal-title"
        message={t("scene.deleteSoundConfirm", { name: audioToDelete?.name ?? "" })}
        confirmLabel={t("common.delete")}
        loadingConfirmLabel={t("dashboard.deleting")}
        loading={removeAudioMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
      <AddSoundModal
        open={showAddSoundModal}
        onClose={handleAddSoundClose}
        sceneId={sceneId}
        onAdded={handleAddSoundAdded}
      />
      <Navbar logo={<SoundQuestLogo />} logoHref="/dashboard" logoAriaLabel="SoundQuest" />

      <div className="mx-auto max-w-6xl px-4">
        <SceneTitleBlock scene={scene} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-4 bg-background" aria-label={t("scene.audiosAria")}>
        {(reorderError || renameError) && (
          <ErrorMessage
            message={reorderError ?? renameError ?? ""}
            onDismiss={() => {
              setReorderError(null);
              setRenameError(null);
            }}
            className="mb-4"
          />
        )}
        <div className="mb-2 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-accent" aria-label={t("scene.audios")}>
          <span className="sm:hidden">🎵</span>
          <span className="hidden sm:inline">{t("scene.audios")}</span>
        </h1>
          <div className="flex items-center gap-1">
            <SearchBar
              open={searchOpen}
              onOpen={() => setSearchOpen(true)}
              onClose={() => {
                setSearchOpen(false);
                setSearch("");
              }}
              value={search}
              onChange={setSearch}
              placeholder={t("scene.filterPlaceholder")}
              aria-label={t("scene.filterAudios")}
            />
            <IconButton
              onClick={() => setShowAddSoundModal(true)}
              aria-label={t("scene.addSound")}
              variant="primary"
              className={showFocusEntry ? "animate-focus-on-entry" : ""}
            >
              +
            </IconButton>
          </div>
        </div>

        {audiosLoading ? (
          <ul className="space-y-3">
            <li
              className="flex items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-8 text-muted"
              role="status"
              aria-label={t("common.loading")}
            >
              <Spinner />
              <span className="ml-2">{t("common.loading")}</span>
            </li>
          </ul>
        ) : (
          <AudiosBlock
            activeAudios={activeAudios}
            inactiveAudios={inactiveAudios}
            filteredAudios={filteredAudios}
            sceneId={sceneId}
            draggedId={draggedId}
            reordering={reorderAudiosMutation.isPending}
            hasAnyAudios={audios.length > 0}
            emptyMessage={t("scene.noAudios")}
            emptySearchMessage={t("scene.noAudiosMatch")}
            onToggleActive={toggleAudioActive}
            onDelete={setAudioToDelete}
            onRename={handleRename}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        )}
      </section>
    </div>
  );
}
