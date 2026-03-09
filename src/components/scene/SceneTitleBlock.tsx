"use client";

import type { Scene } from "@/lib/types";
import { Label as LabelChip } from "@/components/ui/Label";

function Dot() {
  return (
    <span
      className="mx-2 inline-block size-[6px] shrink-0 rounded-full bg-muted"
      aria-hidden
    />
  );
}

export function SceneTitleBlock({ scene }: { scene: Scene }) {
  const hasDescription = !!scene.description;
  const hasLabels = scene.labels.length > 0;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-start gap-0">
      <h1 className="text-xl font-semibold text-foreground">{scene.title}</h1>
      {hasDescription && (
        <>
          <Dot />
          <p className="text-sm text-muted">{scene.description}</p>
        </>
      )}
      {hasLabels && (
        <>
          <Dot />
          <div className="flex flex-wrap gap-1.5">
            {scene.labels.map((l) => (
              <LabelChip key={l.id} {...l} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
