"use client";

import type { Scene } from "@/shared/lib/types";
import { useTranslations } from "@/contexts/I18nContext";
import { DragHandle } from "@/shared/ui/DragHandle";
import { ReorderStepButtons } from "@/shared/ui/ReorderStepButtons";
import { SceneCard } from "./SceneCard";

interface ScenesBlockProps {
  /** Scenes to display (e.g. filtered list). */
  scenes: Scene[];
  /** Full list of scene ids in order (for drop index mapping). */
  sceneIds: string[];
  draggedId: string | null;
  reordering: boolean;
  coarseReorder?: boolean;
  onCoarseReorderStep?: (sceneId: string, delta: -1 | 1) => void | Promise<void>;
  onEdit: (scene: Scene) => void;
  onDragStart: (e: React.DragEvent, sceneId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, toIndex: number) => void;
}

export function ScenesBlock({
  scenes,
  sceneIds,
  draggedId,
  reordering,
  coarseReorder = false,
  onCoarseReorderStep,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ScenesBlockProps) {
  const t = useTranslations();
  const getToIndexInFullList = (filteredIndex: number) => {
    const scene = scenes[filteredIndex];
    if (!scene) return -1;
    return sceneIds.indexOf(scene.id);
  };

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {scenes.map((scene, index) => (
        <li
          key={scene.id}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, getToIndexInFullList(index))}
          onDragEnd={onDragEnd}
          className={`flex items-stretch rounded-xl transition-opacity ${
            draggedId === scene.id ? "opacity-50" : ""
          }`}
        >
          <div className="flex shrink-0 items-stretch self-stretch">
            {coarseReorder && onCoarseReorderStep && (
              <ReorderStepButtons
                className="rounded-l-xl"
                disabled={reordering}
                moveUpDisabled={index <= 0}
                moveDownDisabled={index >= scenes.length - 1}
                onMoveUp={() => void onCoarseReorderStep(scene.id, -1)}
                onMoveDown={() => void onCoarseReorderStep(scene.id, 1)}
                moveUpLabel={t("common.moveItemUp")}
                moveDownLabel={t("common.moveItemDown")}
              />
            )}
            <DragHandle
              onDragStart={(e) => onDragStart(e, scene.id)}
              onDragEnd={onDragEnd}
              dragDisabled={reordering}
              className={`self-stretch ${coarseReorder ? "rounded-l-none" : "rounded-l-xl"}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <SceneCard scene={scene} onEdit={onEdit} />
          </div>
        </li>
      ))}
    </ul>
  );
}

