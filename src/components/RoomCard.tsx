"use client";

import Link from "next/link";
import type { Room } from "@/lib/types";
import { Label } from "./Label";

export function RoomCard({
  room,
  onEdit,
}: {
  room: Room;
  onEdit?: (room: Room) => void;
}) {
  return (
    <Link
      href={`/room/${room.id}`}
      className="relative h-[126px] block rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5 pr-12 transition hover:border-amber-500/50 hover:bg-zinc-800"
    >
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(room);
          }}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white"
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
      <h2 className="text-lg font-semibold text-white">{room.title}</h2>
      {room.subtitle && (
        <p className="mt-1 text-sm text-zinc-400">{room.subtitle}</p>
      )}
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
