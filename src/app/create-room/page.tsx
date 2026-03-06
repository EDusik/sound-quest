"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createRoom } from "@/lib/storage";
import type { Label } from "@/lib/types";

const DEFAULT_COLORS = [
  "#f43f5e", // rose
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
];

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function CreateRoomPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [labels, setLabels] = useState<Label[]>([]);
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLabel = () => {
    const t = newLabelText.trim();
    if (!t) return;
    setLabels((prev) => [
      ...prev,
      { id: generateId(), text: t, color: newLabelColor },
    ]);
    setNewLabelText("");
    setNewLabelColor(DEFAULT_COLORS[0]);
  };

  const removeLabel = (id: string) => {
    setLabels((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid) return;
    setError(null);
    setLoading(true);
    try {
      const room = await createRoom(user.uid, { title, subtitle, labels });
      router.push(`/room/${room.id}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Failed to create room";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white">
              ← Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-white">New Room</h1>
            {user ? (
              <span className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-sm text-zinc-200">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/30 text-xs font-medium text-amber-200">
                    {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                  </span>
                )}
                <span className="max-w-[120px] truncate">
                  {user.displayName ?? user.email ?? "User"}
                </span>
              </span>
            ) : (
              <span className="w-20" />
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 flex-1">
        <form
          onSubmit={handleSubmit}
          className="border-b border-zinc-800 bg-zinc-950/90"
        >
          <div className="mx-auto max-w-4xl px-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">
                Title
              </span>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-9 w-40 rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Room title"
              />

              <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">
                Subtitle
              </span>
              <input
                id="subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="h-9 w-40 rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Optional subtitle"
              />

              <div className="flex flex-1 min-w-[260px] items-center gap-2">
                <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">
                  Labels
                </span>
                <input
                  type="text"
                  value={newLabelText}
                  onChange={(e) => setNewLabelText(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addLabel())
                  }
                  className="h-9 w-full min-w-[140px] rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                  placeholder="Label text"
                />
                <button
                  type="button"
                  onClick={addLabel}
                  className="shrink-0 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-4xl px-4 py-2 space-y-4">
            <div className="flex flex-wrap gap-4 md:items-end">
              <div className="flex-1 min-w-[260px]">
                <label className="block text-sm font-medium text-zinc-300">
                  Existing labels
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {labels.map((l) => (
                    <span
                      key={l.id}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm text-white"
                      style={{ backgroundColor: l.color }}
                    >
                      {l.text}
                      <button
                        type="button"
                        onClick={() => removeLabel(l.id)}
                        className="ml-1 rounded-full hover:bg-white/20"
                        aria-label={`Remove ${l.text}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex gap-1.5">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewLabelColor(color)}
                        className="h-9 w-9 shrink-0 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                        style={{
                          backgroundColor: color,
                          borderColor:
                            newLabelColor === color ? "white" : "transparent",
                          boxShadow:
                            newLabelColor === color
                              ? `0 0 0 1px ${color}`
                              : undefined,
                        }}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addLabel}
                    className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-white hover:bg-zinc-600"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col gap-3">
                {error && (
                  <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
                <div className="flex flex-col gap-3 md:flex-row">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-lg bg-amber-500 py-2 px-4 font-medium text-zinc-900 transition hover:bg-amber-400 disabled:opacity-50"
                  >
                    {loading ? "Creating…" : "Create Room"}
                  </button>
                  <Link
                    href="/dashboard"
                    className="rounded-lg border border-zinc-600 py-2.5 px-4 text-center text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
