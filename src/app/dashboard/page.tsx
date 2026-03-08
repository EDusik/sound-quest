"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getScenes, reorderScenes, updateScene, deleteScene, createScene } from "@/lib/storage";
import type { Scene, Label } from "@/lib/types";
import { SoundTableLogo } from "@/components/SoundTableLogo";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { ScenesBlock } from "@/components/ScenesBlock";
import { SceneFormModal } from "@/components/SceneFormModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Spinner } from "@/components/Spinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import { IconButton } from "@/components/IconButton";
import { LABEL_DEFAULT_COLORS } from "@/components/LabelEditor";
import { validateSceneForm } from "@/lib/sceneSchema";
import { getErrorMessage } from "@/lib/errors";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLabels, setEditLabels] = useState<Label[]>([]);
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_DEFAULT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingScene, setDeletingScene] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createLabels, setCreateLabels] = useState<Label[]>([]);
  const [createNewLabelText, setCreateNewLabelText] = useState("");
  const [createNewLabelColor, setCreateNewLabelColor] = useState(LABEL_DEFAULT_COLORS[0]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.uid) return;
    const cancelled = { current: false };
    getScenes(user.uid)
      .then((list) => {
        if (!cancelled.current) setScenes(list);
      })
      .catch((err) => {
        if (!cancelled.current)
          setError(getErrorMessage(err, "Failed to load scenes"));
      })
      .finally(() => {
        if (!cancelled.current) setLoading(false);
      });
    return () => {
      cancelled.current = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (editingScene) {
      setEditTitle(editingScene.title);
      setEditDescription(editingScene.description ?? "");
      setEditLabels(editingScene.labels ?? []);
      setNewLabelText("");
      setNewLabelColor(LABEL_DEFAULT_COLORS[0]);
      setEditError(null);
      setEditFieldErrors({});
    }
  }, [editingScene]);

  const closeEditModal = useCallback(() => {
    setEditingScene(null);
    setEditError(null);
    setEditFieldErrors({});
    setShowDeleteConfirm(false);
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setCreateError(null);
    setCreateFieldErrors({});
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      setCreateTitle("");
      setCreateDescription("");
      setCreateLabels([]);
      setCreateNewLabelText("");
      setCreateNewLabelColor(LABEL_DEFAULT_COLORS[0]);
      setCreateError(null);
      setCreateFieldErrors({});
    }
  }, [showCreateModal]);

  const openEditModal = (scene: Scene) => setEditingScene(scene);

  const handleDeleteScene = async () => {
    if (!editingScene) return;
    setDeletingScene(true);
    try {
      await deleteScene(editingScene.id);
      setScenes((prev) => prev.filter((r) => r.id !== editingScene.id));
      closeEditModal();
    } catch (err) {
      setEditError(getErrorMessage(err, "Failed to delete scene"));
    } finally {
      setDeletingScene(false);
    }
  };

  const openCreateModal = () => setShowCreateModal(true);

  const handleCreateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid) return;
    setCreateError(null);
    setCreateFieldErrors({});
    const validation = validateSceneForm({
      title: createTitle,
      description: createDescription,
      labels: createLabels,
    });
    if (!validation.success) {
      setCreateFieldErrors(validation.errors);
      return;
    }
    setCreateLoading(true);
    try {
      const scene = await createScene(user.uid, {
        title: validation.data.title,
        description: validation.data.description,
        labels: validation.data.labels,
      });
      setScenes((prev) => [scene, ...prev]);
      closeCreateModal();
      router.push(`/scene/${scene.id}`);
    } catch (err) {
      setCreateError(getErrorMessage(err, "Failed to create scene."));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSaveEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingScene) return;
    setEditError(null);
    setEditFieldErrors({});
    const validation = validateSceneForm({
      title: editTitle,
      description: editDescription,
      labels: editLabels,
    });
    if (!validation.success) {
      setEditFieldErrors(validation.errors);
      return;
    }
    setSaving(true);
    try {
      const updated: Scene = {
        ...editingScene,
        title: validation.data.title,
        description: validation.data.description,
        labels: validation.data.labels,
      };
      await updateScene(updated);
      setScenes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      closeEditModal();
    } catch (err) {
      setEditError(getErrorMessage(err, "Failed to save."));
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    setDraggedId(sceneId);
    e.dataTransfer.setData("sceneId", sceneId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => setDraggedId(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredScenes =
    q === ""
      ? scenes
      : scenes.filter((scene) => {
          const matchTitle = scene.title.toLowerCase().includes(q);
          const matchDesc = (scene.description ?? "").toLowerCase().includes(q);
          const matchLabels = (scene.labels ?? []).some((l) =>
            l.text.toLowerCase().includes(q),
          );
          return matchTitle || matchDesc || matchLabels;
        });

  const handleDrop = async (e: React.DragEvent, toIndexFull: number) => {
    e.preventDefault();
    const sceneId = e.dataTransfer.getData("sceneId");
    if (!sceneId || !draggedId || !user?.uid) return;
    const fromIndex = scenes.findIndex((r) => r.id === draggedId);
    if (fromIndex === -1 || toIndexFull === -1 || fromIndex === toIndexFull) {
      setDraggedId(null);
      return;
    }
    const previousScenes = scenes;
    const reordered = [...scenes];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndexFull, 0, removed);
    const newScenes = reordered.map((r, i) => ({ ...r, order: i }));
    setScenes(newScenes);
    setDraggedId(null);
    setReorderError(null);
    setReordering(true);
    try {
      await reorderScenes(
        user.uid,
        newScenes.map((r) => r.id),
      );
    } catch (err) {
      setScenes(previousScenes);
      setReorderError(getErrorMessage(err, "Failed to reorder scenes."));
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="bg-background">
      <SceneFormModal
        open={showCreateModal}
        onClose={closeCreateModal}
        title="New scene"
        titleId="create-scene-title"
        mode="create"
        formTitle={createTitle}
        onFormTitleChange={setCreateTitle}
        formDescription={createDescription}
        onFormDescriptionChange={setCreateDescription}
        labels={createLabels}
        onLabelsChange={setCreateLabels}
        newLabelText={createNewLabelText}
        onNewLabelTextChange={setCreateNewLabelText}
        newLabelColor={createNewLabelColor}
        onNewLabelColorChange={setCreateNewLabelColor}
        fieldErrors={createFieldErrors}
        submitError={createError}
        onSubmit={handleCreateSubmit}
        saving={createLoading}
        submitLabel="Create Scene"
        loadingLabel="Creating…"
      />

      <SceneFormModal
        open={!!editingScene}
        onClose={closeEditModal}
        title="Edit scene"
        titleId="edit-scene-title"
        mode="edit"
        formTitle={editTitle}
        onFormTitleChange={setEditTitle}
        formDescription={editDescription}
        onFormDescriptionChange={setEditDescription}
        labels={editLabels}
        onLabelsChange={setEditLabels}
        newLabelText={newLabelText}
        onNewLabelTextChange={setNewLabelText}
        newLabelColor={newLabelColor}
        onNewLabelColorChange={setNewLabelColor}
        fieldErrors={editFieldErrors}
        submitError={editError}
        onSubmit={handleSaveEdit}
        saving={saving}
        submitLabel="Save"
        loadingLabel="Saving…"
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <ConfirmModal
        open={showDeleteConfirm && !!editingScene}
        onClose={() => !deletingScene && setShowDeleteConfirm(false)}
        title="Delete scene"
        titleId="delete-scene-modal-title"
        message={
          <>
            Are you sure you want to delete this scene{" "}
            <strong className="text-foreground">
              &quot;{editingScene?.title}&quot;
            </strong>
            ? All audio will be removed and this action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loadingConfirmLabel="Deleting…"
        loading={deletingScene}
        onConfirm={handleDeleteScene}
      />

      <Navbar logo={<SoundTableLogo />} logoHref="/dashboard" />

      <section className="mx-auto max-w-6xl px-4 py-4 pb-24 bg-background" aria-label="Scenes list">
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}
        {error && <ErrorMessage message={error} />}
        {reorderError && (
          <ErrorMessage
            message={reorderError}
            onDismiss={() => setReorderError(null)}
          />
        )}
        {!loading && !error && scenes.length === 0 && (
          <EmptyState
            message="No scenes yet."
            actionLabel="Create your first scene"
            onAction={openCreateModal}
          />
        )}
        {!loading && !error && scenes.length > 0 && (
          <>
            <div className="mb-2 flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold text-accent" aria-label="Scenes">
              <span className="sm:hidden">🎬</span>
              <span className="hidden sm:inline">Scenes</span>
            </h1>
              <div className="flex items-center gap-1">
                <SearchBar
                  open={searchOpen}
                  onOpen={() => setSearchOpen(true)}
                  onClose={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by title, description or labels…"
                  aria-label="Search scenes"
                />
                <IconButton
                  onClick={openCreateModal}
                  aria-label="New scene"
                  variant="primary"
                >
                  +
                </IconButton>
              </div>
            </div>
            <ScenesBlock
              scenes={filteredScenes}
              sceneIds={scenes.map((s) => s.id)}
              draggedId={draggedId}
              reordering={reordering}
              onEdit={openEditModal}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
            {filteredScenes.length === 0 && q !== "" && (
              <p className="mt-6 text-center text-muted">
                No scenes match &quot;{searchQuery.trim()}&quot;.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
