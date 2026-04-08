"use client";

import type { AudioItem } from "@/lib/types";
import { AudioRow } from "@/components/audio/AudioRow";
import { DragHandle } from "@/components/ui/DragHandle";
import { useTranslations } from "@/contexts/I18nContext";

interface AudiosBlockProps {
  activeAudios: AudioItem[];
  inactiveAudios: AudioItem[];
  filteredAudios: AudioItem[];
  sceneId: string;
  draggedId: string | null;
  reordering: boolean;
  /** When true, show emptySearchMessage when list is empty; otherwise emptyMessage. */
  hasAnyAudios: boolean;
  emptyMessage: string;
  emptySearchMessage: string;
  onToggleActive: (audio: AudioItem) => void;
  onDelete: (audio: AudioItem) => void;
  onRename?: (audio: AudioItem, newName: string) => void;
  onAddToScene?: (audio: AudioItem) => void;
  onAddToLibrary?: (audio: AudioItem) => void;
  addToLibraryPending?: boolean;
  onDragStart: (e: React.DragEvent, audioId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, toIndex: number) => void;
}

export function AudiosBlock({
  activeAudios,
  inactiveAudios,
  filteredAudios,
  sceneId,
  draggedId,
  reordering,
  hasAnyAudios,
  emptyMessage,
  emptySearchMessage,
  onToggleActive,
  onDelete,
  onRename,
  onAddToScene,
  onAddToLibrary,
  addToLibraryPending,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: AudiosBlockProps) {
  const t = useTranslations();
  const isEmpty = filteredAudios.length === 0;

  return (
    <>
      <ul className="space-y-3">
        {isEmpty && (
          <li className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-muted">
            {hasAnyAudios ? emptySearchMessage : emptyMessage}
          </li>
        )}
        {activeAudios.map((audio) => (
          <li
            key={audio.id}
            onDragOver={onDragOver}
            onDrop={(e) =>
              onDrop(
                e,
                filteredAudios.findIndex((a) => a.id === audio.id),
              )
            }
            onDragEnd={onDragEnd}
            className={`flex items-stretch rounded-lg transition-opacity ${
              draggedId === audio.id ? "opacity-50" : ""
            } ${reordering ? "pointer-events-none" : ""}`}
          >
            <DragHandle
              onDragStart={(e) => onDragStart(e, audio.id)}
              onDragEnd={onDragEnd}
              className="rounded-l-lg bg-card/60"
            />
            <div className="min-w-0 flex-1">
              <AudioRow
                audio={audio}
                sceneId={sceneId}
                isInactive={false}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
                onRename={onRename}
                onAddToScene={onAddToScene}
                onAddToLibrary={onAddToLibrary}
                addToLibraryPending={addToLibraryPending}
                className="rounded-tr-lg rounded-br-lg rounded-tl-none rounded-bl-none"
              />
            </div>
          </li>
        ))}
      </ul>
      {inactiveAudios.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted">
            {t("audiosBlock.disabledAudio")}
          </h2>
          <ul className="space-y-3">
            {inactiveAudios.map((audio) => (
              <li key={audio.id} className="flex items-stretch rounded-lg">
                <div className="min-w-0 flex-1">
                  <AudioRow
                    audio={audio}
                    sceneId={sceneId}
                    isInactive
                    onToggleActive={onToggleActive}
                    onDelete={onDelete}
                    onRename={onRename}
                    onAddToScene={onAddToScene}
                    onAddToLibrary={onAddToLibrary}
                    addToLibraryPending={addToLibraryPending}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
