"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioItem } from "@/lib/types";
import type { Scene } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { ChevronDownIcon } from "@/components/icons";
import { useTranslations } from "@/contexts/I18nContext";

export interface AddToSceneModalProps {
  open: boolean;
  onClose: () => void;
  audio: AudioItem | null;
  currentSceneId: string;
  scenes: Scene[];
  loading?: boolean;
  onAdd: (sceneIds: string[]) => Promise<void>;
}

export function AddToSceneModal({
  open,
  onClose,
  audio,
  currentSceneId,
  scenes,
  loading = false,
  onAdd,
}: AddToSceneModalProps) {
  const t = useTranslations();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const otherScenes = scenes.filter((s) => s.id !== currentSceneId);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setDropdownOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [dropdownOpen]);

  const toggleScene = (sceneId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !audio) return;
    await onAdd(ids);
    onClose();
  };

  if (!open) return null;

  const title = t("addToScene.title");
  const isSingular = selectedIds.size === 1;
  const messageKey = isSingular
    ? "addToScene.messageToScene"
    : "addToScene.messageToScenes";
  const messageRaw = t(messageKey, { name: audio?.name ?? "" });
  const message =
    audio && messageRaw !== messageKey
      ? messageRaw
      : audio
        ? isSingular
          ? `Add "${audio.name}" to scene:`
          : `Add "${audio.name}" to scenes:`
        : "";

  const selectedSceneNames = otherScenes
    .filter((s) => selectedIds.has(s.id))
    .map((s) => s.title);
  const selectedSuffix =
    selectedSceneNames.length > 0
      ? ` (${selectedSceneNames.join(", ")})`
      : "";

  const dropdownTriggerLabel = t("addToScene.scenes");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      titleId="add-to-scene-modal-title"
      maxWidth="max-w-lg"
      panelClassName="min-h-[240px] overflow-visible"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-4">
        <p className="text-sm text-muted" id="add-to-scene-modal-desc">
          {message}
          {selectedSuffix}
        </p>

        {otherScenes.length === 0 ? (
          <p className="text-sm text-muted">
            {t("addToScene.noOtherScenes")}
          </p>
        ) : (
          <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground shadow-sm hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                aria-labelledby="add-to-scene-scenes-label"
                id="add-to-scene-dropdown-trigger"
              >
                <span id="add-to-scene-scenes-label" className="truncate">
                  {dropdownTriggerLabel}
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 text-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {dropdownOpen && (
                <div
                  role="listbox"
                  aria-multiselectable="true"
                  aria-label={t("addToScene.selectScenes")}
                  className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg"
                >
                {otherScenes.map((scene) => (
                  <label
                    key={scene.id}
                    role="option"
                    aria-selected={selectedIds.has(scene.id)}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(scene.id)}
                      onChange={() => toggleScene(scene.id)}
                      className="h-4 w-4 accent-accent"
                      aria-label={scene.title}
                    />
                    <span className="truncate text-sm text-foreground">
                      {scene.title}
                    </span>
                  </label>
                ))}
                </div>
              )}
            </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-card disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || otherScenes.length === 0 || selectedIds.size === 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent-hover disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {loading ? t("addToScene.adding") : t("addToScene.add")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
