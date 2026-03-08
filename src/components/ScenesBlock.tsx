"use client";

import type { Scene } from "@/lib/types";
import { SceneCard } from "@/components/SceneCard";
import { DragHandle } from "@/components/DragHandle";

interface ScenesBlockProps {
  /** Scenes to display (e.g. filtered list). */
  scenes: Scene[];
  /** Full list of scene ids in order (for drop index mapping). */
  sceneIds: string[];
  draggedId: string | null;
  reordering: boolean;
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
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ScenesBlockProps) {
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
          className={`flex items-stretch gap-2 rounded-xl transition-opacity ${
            draggedId === scene.id ? "opacity-50" : ""
          } ${reordering ? "pointer-events-none" : ""}`}
        >
          <DragHandle
            onDragStart={(e) => onDragStart(e, scene.id)}
            onDragEnd={onDragEnd}
            className="rounded-l-xl"
          />
          <div className="min-w-0 flex-1">
            <SceneCard scene={scene} onEdit={onEdit} />
          </div>
        </li>
      ))}
    </ul>
  );
}
