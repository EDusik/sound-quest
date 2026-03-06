"use client";

import type { Room } from "@/lib/types";
import { Label as LabelChip } from "@/components/Label";

export function RoomTitleBlock({ room }: { room: Room }) {
  return (
    <div className="mt-4 flex flex-wrap items-baseline justify-start gap-4">
      <h1 className="text-xl font-semibold text-white">{room.title}</h1>
      {room.subtitle ? (
        <p className="text-sm text-zinc-400">{room.subtitle}</p>
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
