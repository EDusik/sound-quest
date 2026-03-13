"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/I18nContext";
import {
  useScenesQuery,
  useCreateSceneMutation,
  useUpdateSceneMutation,
  useDeleteSceneMutation,
  useReorderScenesMutation,
} from "@/hooks/api";
import type { Scene, Label } from "@/lib/types";
import { SoundQuestLogo } from "@/components/branding/SoundQuestLogo";
import { Navbar } from "@/components/layout/Navbar";
import { SearchBar } from "@/components/search/SearchBar";
import { ScenesBlock } from "@/components/scene/ScenesBlock";
import { DashboardSkeleton } from "@/components/scene/DashboardSkeleton";
import { SceneFormModal } from "@/components/scene/SceneFormModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { LABEL_DEFAULT_COLORS } from "@/components/editor/LabelEditor";
import { validateSceneForm } from "@/lib/sceneSchema";
import { getErrorMessage } from "@/lib/errors";
import { useFocusEntryOnce } from "@/hooks/useFocusEntryOnce";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    data: scenes = [],
    isLoading: loading,
    error: queryError,
  } = useScenesQuery(user?.uid);
  const createSceneMutation = useCreateSceneMutation(user?.uid);
  const updateSceneMutation = useUpdateSceneMutation(user?.uid);
  const deleteSceneMutation = useDeleteSceneMutation(user?.uid);
  const reorderScenesMutation = useReorderScenesMutation(user?.uid);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLabels, setEditLabels] = useState<Label[]>([]);
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_DEFAULT_COLORS[0]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createLabels, setCreateLabels] = useState<Label[]>([]);
  const [createNewLabelText, setCreateNewLabelText] = useState("");
  const [createNewLabelColor, setCreateNewLabelColor] = useState(LABEL_DEFAULT_COLORS[0]);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const showFocusEntry = useFocusEntryOnce("dashboard");
  const t = useTranslations();

  const error = queryError ? getErrorMessage(queryError, t("errors.loadScenes")) : null;

  const closeEditModal = useCallback(() => {
    setEditingScene(null);
    setEditError(null);
    setEditFieldErrors({});
    setShowDeleteConfirm(false);
  }, [setShowDeleteConfirm]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    createSceneMutation.reset();
    setCreateFieldErrors({});
  }, [createSceneMutation]);

  const openEditModal = (scene: Scene) => {
    setEditingScene(scene);
    setEditTitle(scene.title);
    setEditDescription(scene.description ?? "");
    setEditLabels(scene.labels ?? []);
    setNewLabelText("");
    setNewLabelColor(LABEL_DEFAULT_COLORS[0]);
    setEditError(null);
    setEditFieldErrors({});
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateTitle("");
    setCreateDescription("");
    setCreateLabels([]);
    setCreateNewLabelText("");
    setCreateNewLabelColor(LABEL_DEFAULT_COLORS[0]);
    createSceneMutation.reset();
    setCreateFieldErrors({});
  };

  const handleDeleteScene = async () => {
    if (!editingScene) return;
    try {
      await deleteSceneMutation.mutateAsync(editingScene.id);
      closeEditModal();
    } catch (err) {
      setEditError(getErrorMessage(err, t("errors.deleteScene")));
    }
  };

  const createError = createSceneMutation.error
    ? getErrorMessage(createSceneMutation.error, t("errors.createScene"))
    : null;

  const handleCreateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid) return;
    createSceneMutation.reset();
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
    try {
      const scene = await createSceneMutation.mutateAsync({
        title: validation.data.title,
        description: validation.data.description,
        labels: validation.data.labels,
      });
      closeCreateModal();
      router.push(`/scene/${scene.slug ?? scene.id}`);
    } catch {
      // Error handled via createSceneMutation.error
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
    try {
      const updated: Scene = {
        ...editingScene,
        title: validation.data.title,
        description: validation.data.description,
        labels: validation.data.labels,
      };
      await updateSceneMutation.mutateAsync(updated);
      closeEditModal();
    } catch (err) {
      setEditError(getErrorMessage(err, t("errors.saveScene")));
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
    const reordered = [...scenes];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndexFull, 0, removed);
    const orderedIds = reordered.map((r) => r.id);
    setDraggedId(null);
    setReorderError(null);
    try {
      await reorderScenesMutation.mutateAsync(orderedIds);
    } catch (err) {
      setReorderError(getErrorMessage(err, t("errors.reorderScenes")));
    }
  };

  return (
    <div className="bg-background">
      <SceneFormModal
        open={showCreateModal}
        onClose={closeCreateModal}
        title={t("dashboard.newScene")}
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
        saving={createSceneMutation.isPending}
        submitLabel={t("dashboard.createScene")}
        loadingLabel={t("dashboard.creating")}
      />

      <SceneFormModal
        open={!!editingScene}
        onClose={closeEditModal}
        title={t("dashboard.editScene")}
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
        saving={updateSceneMutation.isPending}
        submitLabel={t("common.save")}
        loadingLabel={t("dashboard.saving")}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <ConfirmModal
        open={showDeleteConfirm && !!editingScene}
        onClose={() => !deleteSceneMutation.isPending && setShowDeleteConfirm(false)}
        title={t("dashboard.deleteScene")}
        titleId="delete-scene-modal-title"
        message={
          <>
            {t("dashboard.deleteSceneConfirm", { title: editingScene?.title ?? "" })}
          </>
        }
        confirmLabel={t("common.delete")}
        loadingConfirmLabel={t("dashboard.deleting")}
        loading={deleteSceneMutation.isPending}
        onConfirm={handleDeleteScene}
      />

      <Navbar logo={<SoundQuestLogo />} logoHref="/dashboard" logoAriaLabel="SoundQuest" />

      <section
        className={`mx-auto max-w-6xl px-4 py-4 pb-24 bg-background ${loading ? "min-h-[60vh]" : ""}`}
        aria-label={t("dashboard.scenesListAria")}
        aria-busy={loading}
      >
        {loading && (
          <div role="status" aria-live="polite" aria-label={t("common.loading")}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <div className="h-7 w-24 rounded bg-border/40 animate-pulse" aria-hidden />
              <div className="flex items-center gap-1">
                <div className="h-9 w-32 rounded bg-border/30 animate-pulse" aria-hidden />
                <div className="h-9 w-9 rounded bg-border/30 animate-pulse" aria-hidden />
              </div>
            </div>
            <DashboardSkeleton />
            <span className="sr-only">{t("common.loading")}</span>
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
            message={t("dashboard.noScenes")}
            actionLabel={t("dashboard.createFirstScene")}
            onAction={openCreateModal}
          />
        )}
        {!loading && !error && scenes.length > 0 && (
          <>
            <div className="mb-2 flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold text-accent" aria-label={t("dashboard.scenes")}>
              <span className="sm:hidden">🎬</span>
              <span className="hidden sm:inline">{t("dashboard.scenes")}</span>
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
                  placeholder={t("dashboard.searchPlaceholder")}
                  aria-label={t("dashboard.searchScenes")}
                />
                <IconButton
                  onClick={openCreateModal}
                  aria-label={t("dashboard.newScene")}
                  variant="primary"
                  className={showFocusEntry ? "animate-focus-on-entry" : ""}
                >
                  +
                </IconButton>
              </div>
            </div>
            <ScenesBlock
              scenes={filteredScenes}
              sceneIds={scenes.map((s) => s.id)}
              draggedId={draggedId}
              reordering={reorderScenesMutation.isPending}
              onEdit={openEditModal}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
            {filteredScenes.length === 0 && q !== "" && (
              <p className="mt-6 text-center text-muted">
                {t("dashboard.noScenesMatch", { query: searchQuery.trim() })}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
