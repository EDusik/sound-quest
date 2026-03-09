"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  getScene,
  getAudios,
  reorderAudios,
  removeAudio,
  updateAudio,
} from "@/lib/storage";
import type { Scene, AudioItem } from "@/lib/types";
import { SceneTitleBlock } from "@/components/scene/SceneTitleBlock";
import { SoundTableLogo } from "@/components/branding/SoundTableLogo";
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
  const sceneId = Array.isArray(params.sceneId)
    ? params.sceneId[0] ?? ""
    : (params.sceneId ?? "");
  const [scene, setScene] = useState<Scene | null>(null);
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [audioToDelete, setAudioToDelete] = useState<AudioItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [inactiveAudioIds, setInactiveAudioIds] = useState<string[]>([]);
  const [showAddSoundModal, setShowAddSoundModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const showFocusEntry = useFocusEntryOnce("scene");

  useEffect(() => {
    if (!sceneId) {
      setLoading(false);
      setScene(null);
      setError("Scene not found");
      return;
    }
    const cancelled = { current: false };
    Promise.all([getScene(sceneId), getAudios(sceneId)])
      .then(([s, a]) => {
        if (!cancelled.current) {
          setScene(s ?? null);
          setAudios(a);
        }
      })
      .catch((err) => {
        if (!cancelled.current)
          setError(getErrorMessage(err, "Failed to load"));
      })
      .finally(() => {
        if (!cancelled.current) setLoading(false);
      });
    return () => {
      cancelled.current = true;
    };
  }, [sceneId]);

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
    const list = await getAudios(sceneId);
    setAudios(list);
    setShowAddSoundModal(false);
  }, [sceneId]);

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
    const previousAudios = audios;
    const reordered = [...filteredAudios];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const rest = audios.filter((a) => !reordered.some((r) => r.id === a.id));
    const newAudios = reordered.map((a, i) => ({ ...a, order: i }));
    const restWithOrder = rest.map((a, i) => ({
      ...a,
      order: reordered.length + i,
    }));
    setAudios([...newAudios, ...restWithOrder]);
    setDraggedId(null);
    setReorderError(null);
    setReordering(true);
    try {
      await reorderAudios(sceneId, [
        ...newAudios.map((a) => a.id),
        ...rest.map((a) => a.id),
      ]);
    } catch (err) {
      setAudios(previousAudios);
      setReorderError(getErrorMessage(err, "Failed to reorder audios."));
    } finally {
      setReordering(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!audioToDelete) return;
    const id = audioToDelete.id;
    setDeleting(true);
    try {
      const p = useAudioStore.getState().players.get(id);
      if (p?.ref) {
        p.ref.pause();
        p.ref.currentTime = 0;
      }
      useAudioStore.getState().setState(id, "stopped");
      await removeAudio(id);
      setAudios((prev) => prev.filter((a) => a.id !== id));
      setAudioToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = useCallback(() => {
    if (!deleting) setAudioToDelete(null);
  }, [deleting]);

  const handleRename = useCallback(
    async (audio: AudioItem, newName: string) => {
      setRenameError(null);
      try {
        await updateAudio({ ...audio, name: newName });
        setAudios((prev) =>
          prev.map((a) => (a.id === audio.id ? { ...a, name: newName } : a))
        );
      } catch (err) {
        setRenameError(getErrorMessage(err, "Failed to rename sound."));
      }
    },
    []
  );

  useEffect(() => {
    if (!audioToDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDeleteModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [audioToDelete, closeDeleteModal]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (error || !scene) {
    return (
      <ErrorPage
        message={error ?? "Scene not found"}
        backHref="/dashboard"
        backLabel="← Dashboard"
      />
    );
  }

  return (
    <div className="bg-background pb-32">
      <ConfirmModal
        open={!!audioToDelete}
        onClose={closeDeleteModal}
        title="Delete sound"
        titleId="delete-modal-title"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong className="text-foreground">
              &quot;{audioToDelete?.name}&quot;
            </strong>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loadingConfirmLabel="Deleting…"
        loading={deleting}
        onConfirm={handleConfirmDelete}
      />
      <AddSoundModal
        open={showAddSoundModal}
        onClose={handleAddSoundClose}
        sceneId={sceneId}
        onAdded={handleAddSoundAdded}
      />
      <Navbar logo={<SoundTableLogo />} logoHref="/dashboard" />

      <div className="mx-auto max-w-6xl px-4">
        <SceneTitleBlock scene={scene} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-4 bg-background" aria-label="Scene audios">
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
          <h1 className="text-xl font-semibold text-accent" aria-label="Audios">
          <span className="sm:hidden">🎵</span>
          <span className="hidden sm:inline">Audios</span>
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
              placeholder="Filter by audio name…"
              aria-label="Filter audios in this scene"
            />
            <IconButton
              onClick={() => setShowAddSoundModal(true)}
              aria-label="Add sound"
              variant="primary"
              className={showFocusEntry ? "animate-focus-on-entry" : ""}
            >
              +
            </IconButton>
          </div>
        </div>

        <AudiosBlock
          activeAudios={activeAudios}
          inactiveAudios={inactiveAudios}
          filteredAudios={filteredAudios}
          sceneId={sceneId}
          draggedId={draggedId}
          reordering={reordering}
          hasAnyAudios={audios.length > 0}
          emptyMessage="No audios in this scene. Use the + button to add one."
          emptySearchMessage="No audios match your search."
          onToggleActive={toggleAudioActive}
          onDelete={setAudioToDelete}
          onRename={handleRename}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </section>
    </div>
  );
}
