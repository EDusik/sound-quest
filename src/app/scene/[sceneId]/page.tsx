"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useSceneQuery,
  useScenesQuery,
  useAudiosQuery,
  useReorderAudiosMutation,
  useRemoveAudioMutation,
  useUpdateAudioMutation,
  useAddAudioToScenesMutation,
  useAdminFeatures,
  useCreateLibraryItemMutation,
} from "@/hooks/api";
import type { AudioItem } from "@/lib/utils/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/I18nContext";
import { SceneTitleBlock } from "@/features/scenes/components/SceneTitleBlock";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { Navbar } from "@/components/layout/Navbar";
import { SearchBar } from "@/components/search/SearchBar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AddSoundModal } from "@/components/audio/AddSoundModal";
import { AddToSceneModal } from "@/components/audio/AddToSceneModal";
import { AudiosBlock } from "@/components/audio/AudiosBlock";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { IconButton } from "@/components/ui/IconButton";
import { useAudioStore } from "@/store/audioStore";
import { getErrorMessage } from "@/lib/utils/errors";
import { getLibrarySourceUrlForAudio } from "@/lib/audio/mappers/audio-item-library-url";
import { ApiError } from "@/lib/api/api-client";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useFocusEntryOnce } from "@/hooks/useFocusEntryOnce";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { toast } from "sonner";

const INACTIVE_AUDIOS_STORAGE_KEY = "soundquest-inactive-audios";

function getInactiveAudiosKey(sceneId: string): string {
  return `${INACTIVE_AUDIOS_STORAGE_KEY}-${sceneId}`;
}

function loadInactiveAudioIds(sceneId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getInactiveAudiosKey(sceneId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function saveInactiveAudioIds(sceneId: string, ids: string[]): void {
  try {
    localStorage.setItem(getInactiveAudiosKey(sceneId), JSON.stringify(ids));
  } catch {
    void 0;
  }
}

export default function ScenePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const sceneIdOrSlug = Array.isArray(params.sceneId)
    ? (params.sceneId[0] ?? "")
    : (params.sceneId ?? "");
  const {
    data: sceneData,
    isLoading: sceneLoading,
    error: sceneError,
  } = useSceneQuery(sceneIdOrSlug, user?.uid);
  const scene = sceneData ?? null;
  const sceneId = scene?.id ?? "";
  const { data: audios = [], isLoading: audiosLoading } =
    useAudiosQuery(sceneId);
  const { data: scenes = [] } = useScenesQuery(user?.uid);
  const loading = authLoading || sceneLoading;
  const reorderAudiosMutation = useReorderAudiosMutation(sceneId);
  const removeAudioMutation = useRemoveAudioMutation(sceneId);
  const updateAudioMutation = useUpdateAudioMutation(sceneId);
  const addAudioToScenesMutation = useAddAudioToScenesMutation();
  const createLibraryMutation = useCreateLibraryItemMutation();
  const { showSaveToLibraryOnScene: showSceneLibrarySave } = useAdminFeatures();
  const t = useTranslations();
  const error = !sceneIdOrSlug
    ? t("scene.sceneNotFound")
    : sceneError
      ? getErrorMessage(sceneError, t("scene.failedToLoad"))
      : null;
  const [search, setSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [audioToDelete, setAudioToDelete] = useState<AudioItem | null>(null);
  const [audioToAddToScenes, setAudioToAddToScenes] =
    useState<AudioItem | null>(null);
  const [inactiveAudioIds, setInactiveAudioIds] = useState<string[]>([]);
  const [showAddSoundModal, setShowAddSoundModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const showFocusEntry = useFocusEntryOnce("scene");
  const coarsePointer = useCoarsePointer();

  const hydratedInactiveForScene = useRef<string | null>(null);
  useEffect(() => {
    if (!sceneId || audios.length === 0) return;
    if (hydratedInactiveForScene.current === sceneId) return;
    hydratedInactiveForScene.current = sceneId;
    const stored = loadInactiveAudioIds(sceneId);
    const audioIds = new Set(audios.map((a) => a.id));
    const valid = stored.filter((id) => audioIds.has(id));
    if (valid.length > 0) {
      queueMicrotask(() => setInactiveAudioIds(valid));
    }
  }, [sceneId, audios]);

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
    setInactiveAudioIds((prev) => {
      const next = prev.includes(audio.id)
        ? prev.filter((id) => id !== audio.id)
        : [...prev, audio.id];
      if (sceneId) saveInactiveAudioIds(sceneId, next);
      return next;
    });
  };

  const handleAddSoundClose = useCallback(() => {
    setShowAddSoundModal(false);
  }, []);

  const handleAddSoundAdded = useCallback(async () => {
    setShowAddSoundModal(false);
  }, []);

  const handleAddToScenes = useCallback(
    async (sceneIds: string[]) => {
      if (!audioToAddToScenes || sceneIds.length === 0) return;
      await addAudioToScenesMutation.mutateAsync({
        sceneIds,
        data: {
          name: audioToAddToScenes.name,
          sourceUrl: audioToAddToScenes.sourceUrl,
          kind: audioToAddToScenes.kind,
        },
      });
      setAudioToAddToScenes(null);
    },
    [audioToAddToScenes, addAudioToScenesMutation],
  );

  const handleDragStart = (e: React.DragEvent, audioId: string) => {
    const target = e.target as HTMLElement;
    const isDragHandle = target.closest("[data-drag-handle]");
    if (!isDragHandle && target.closest("button, input, [role='button'], a"))
      return;
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

  const commitAudioReorder = useCallback(
    async (audioId: string, toIndex: number) => {
      const fromIndex = filteredAudios.findIndex((a) => a.id === audioId);
      if (fromIndex === -1 || fromIndex === toIndex) return;
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
      setReorderError(null);
      try {
        await reorderAudiosMutation.mutateAsync(orderedIds);
      } catch (err) {
        setReorderError(getErrorMessage(err, t("scene.failedReorder")));
      }
    },
    [filteredAudios, audios, reorderAudiosMutation, t],
  );

  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const audioId = e.dataTransfer.getData("audioId");
    if (!audioId || !draggedId) return;
    const fromIndex = filteredAudios.findIndex((a) => a.id === draggedId);
    if (fromIndex === -1 || fromIndex === toIndex) {
      setDraggedId(null);
      return;
    }
    setDraggedId(null);
    await commitAudioReorder(audioId, toIndex);
  };

  const handleCoarseReorderStep = useCallback(
    async (audioId: string, delta: -1 | 1) => {
      const actives = activeAudios;
      const ai = actives.findIndex((a) => a.id === audioId);
      if (ai === -1) return;
      const ni = ai + delta;
      if (ni < 0 || ni >= actives.length) return;
      const neighborId = actives[ni].id;
      const fromIndex = filteredAudios.findIndex((a) => a.id === audioId);
      const toIndex = filteredAudios.findIndex((a) => a.id === neighborId);
      if (fromIndex === -1 || toIndex === -1) return;
      await commitAudioReorder(audioId, toIndex);
    },
    [activeAudios, filteredAudios, commitAudioReorder],
  );

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
      void 0;
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

  const handleAddSceneAudioToLibrary = useCallback(
    async (audio: AudioItem) => {
      const sourceUrl = getLibrarySourceUrlForAudio(audio);
      try {
        new URL(sourceUrl);
      } catch {
        toast.error(t("scene.addToLibraryBadUrl"));
        return;
      }
      try {
        await createLibraryMutation.mutateAsync({
          name: audio.name,
          sourceUrl,
          type: "ambience",
        });
        toast.success(t("aiLibrary.savedToLibrary"));
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          toast.error(t("aiLibrary.forbidden"));
        } else {
          toast.error(getErrorMessage(err, t("aiLibrary.saveFailed")));
        }
      }
    },
    [createLibraryMutation, t],
  );

  useEffect(() => {
    if (!audioToDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDeleteModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [audioToDelete, closeDeleteModal]);

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
        message={t("scene.deleteSoundConfirm", {
          name: audioToDelete?.name ?? "",
        })}
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
      <AddToSceneModal
        key={audioToAddToScenes?.id ?? "closed"}
        open={!!audioToAddToScenes}
        onClose={() =>
          !addAudioToScenesMutation.isPending && setAudioToAddToScenes(null)
        }
        audio={audioToAddToScenes}
        currentSceneId={sceneId}
        scenes={scenes}
        loading={addAudioToScenesMutation.isPending}
        onAdd={handleAddToScenes}
      />
      <Navbar
        logo={<SoundQuestLogo />}
        logoHref="/dashboard"
        logoAriaLabel="SoundQuest"
      />

      <div className="mx-auto max-w-6xl px-4">
        <SceneTitleBlock scene={scene} />
      </div>

      <section
        className="mx-auto max-w-6xl px-4 py-4 bg-background"
        aria-label={t("scene.audiosAria")}
      >
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
          <h1
            className="text-xl font-semibold text-accent"
            aria-label={t("scene.audios")}
          >
            {t("scene.audios")}
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
            coarseReorder={coarsePointer}
            onCoarseReorderStep={handleCoarseReorderStep}
            hasAnyAudios={audios.length > 0}
            emptyMessage={t("scene.noAudios")}
            emptySearchMessage={t("scene.noAudiosMatch")}
            onToggleActive={toggleAudioActive}
            onDelete={setAudioToDelete}
            onRename={handleRename}
            onAddToScene={setAudioToAddToScenes}
            onAddToLibrary={
              showSceneLibrarySave ? handleAddSceneAudioToLibrary : undefined
            }
            addToLibraryPending={createLibraryMutation.isPending}
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
