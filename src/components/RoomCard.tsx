"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import Link from "next/link";
import type { Room } from "@/lib/types";
import { Label } from "./Label";

const TITLE_MAX_CHARS = 32;
const DESCRIPTION_MAX_CHARS = 50;

function truncate(str: string, max: number) {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "…";
}

export function RoomCard({
  room,
  onEdit,
}: {
  room: Room;
  onEdit?: (room: Room) => void;
}) {
  const isNarrow = useMediaQuery("(max-width: 2024px)");
  const title = isNarrow ? truncate(room.title, TITLE_MAX_CHARS) : room.title;
  const description =
    room.description && isNarrow
      ? truncate(room.description, DESCRIPTION_MAX_CHARS)
      : (room.description ?? null);

  return (
    <Link
      href={`/room/${room.id}`}
      className="relative h-[150px] block rounded-xl border border-border/50 bg-card/50 p-5 pr-12 transition hover:border-accent/50 hover:bg-card overflow-hidden"
    >
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(room);
          }}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-border hover:text-foreground"
          aria-label="Edit room"
          title="Edit room"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      )}
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {room.labels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {room.labels.map((label) => (
            <Label key={label.id} {...label} />
          ))}
        </div>
      )}
    </Link>
  );
}
