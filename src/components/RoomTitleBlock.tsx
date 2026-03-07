"use client";

import type { Room } from "@/lib/types";
import { Label as LabelChip } from "@/components/Label";

export function RoomTitleBlock({ room }: { room: Room }) {
  return (
    <div className="mt-4 flex flex-wrap items-baseline justify-start gap-4">
      <h1 className="text-xl font-semibold text-foreground">{room.title}</h1>
      {room.description ? (
        <p className="text-sm text-muted">{room.description}</p>
      ) : null}
      {room.labels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {room.labels.map((l) => (
            <LabelChip key={l.id} {...l} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
