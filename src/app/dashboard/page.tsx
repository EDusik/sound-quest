"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getRooms, reorderRooms, updateRoom, deleteRoom } from "@/lib/storage";
import type { Room, Label } from "@/lib/types";
import { RoomCard } from "@/components/RoomCard";

const DEFAULT_COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
];

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editLabels, setEditLabels] = useState<Label[]>([]);
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    getRooms(user.uid)
      .then((list) => {
        if (!cancelled) setRooms(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load rooms");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (editingRoom) {
      setEditTitle(editingRoom.title);
      setEditSubtitle(editingRoom.subtitle ?? "");
      setEditLabels(editingRoom.labels ?? []);
      setNewLabelText("");
      setNewLabelColor(DEFAULT_COLORS[0]);
      setEditError(null);
    }
  }, [editingRoom]);

  useEffect(() => {
    if (!editingRoom) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingRoom]);

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
  };

  const closeEditModal = () => {
    setEditingRoom(null);
    setEditError(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteRoom = async () => {
    if (!editingRoom) return;
    setDeletingRoom(true);
    try {
      await deleteRoom(editingRoom.id);
      setRooms((prev) => prev.filter((r) => r.id !== editingRoom.id));
      closeEditModal();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to delete room",
      );
    } finally {
      setDeletingRoom(false);
    }
  };

  const addEditLabel = () => {
    const t = newLabelText.trim();
    if (!t) return;
    setEditLabels((prev) => [
      ...prev,
      { id: generateId(), text: t, color: newLabelColor },
    ]);
    setNewLabelText("");
    setNewLabelColor(DEFAULT_COLORS[0]);
  };

  const removeEditLabel = (id: string) => {
    setEditLabels((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSaveEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRoom) return;
    setEditError(null);
    setSaving(true);
    try {
      const updated: Room = {
        ...editingRoom,
        title: editTitle.trim(),
        subtitle: editSubtitle.trim(),
        labels: editLabels,
      };
      await updateRoom(updated);
      setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      closeEditModal();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Failed to save";
      setEditError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, roomId: string) => {
    setDraggedId(roomId);
    e.dataTransfer.setData("roomId", roomId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const roomId = e.dataTransfer.getData("roomId");
    if (!roomId || !draggedId || !user?.uid) return;
    const fromIndex = rooms.findIndex((r) => r.id === draggedId);
    if (fromIndex === -1 || fromIndex === toIndex) {
      setDraggedId(null);
      return;
    }
    const reordered = [...rooms];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const newRooms = reordered.map((r, i) => ({ ...r, order: i }));
    setRooms(newRooms);
    setDraggedId(null);
    setReordering(true);
    try {
      await reorderRooms(
        user.uid,
        newRooms.map((r) => r.id),
      );
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="bg-zinc-950">
      {editingRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-room-title"
        >
          <div
            className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveEdit}>
              <div className="relative flex items-center justify-between border-b border-zinc-700 px-5 py-4">
                <h2
                  id="edit-room-title"
                  className="text-lg font-semibold text-white"
                >
                  Edit room
                </h2>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-4 px-5 py-4">
                <div>
                  <label
                    htmlFor="edit-title"
                    className="block text-sm font-medium text-zinc-300"
                  >
                    Title
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="mt-1.5 h-10 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Room title"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-subtitle"
                    className="block text-sm font-medium text-zinc-300"
                  >
                    Subtitle
                  </label>
                  <input
                    id="edit-subtitle"
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Optional subtitle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300">
                    Labels
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {editLabels.map((l) => (
                      <span
                        key={l.id}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm text-white"
                        style={{ backgroundColor: l.color }}
                      >
                        {l.text}
                        <button
                          type="button"
                          onClick={() => removeEditLabel(l.id)}
                          className="ml-1 rounded-full hover:bg-white/20"
                          aria-label={`Remove ${l.text}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={newLabelText}
                      onChange={(e) => setNewLabelText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addEditLabel())
                      }
                      className="h-9 min-w-[140px] flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-3 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                      placeholder="Label text"
                    />
                    <div className="flex gap-1.5">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewLabelColor(color)}
                          className="h-9 w-9 shrink-0 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                          style={{
                            backgroundColor: color,
                            borderColor:
                              newLabelColor === color ? "white" : "transparent",
                          }}
                          aria-label={`Color ${color}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addEditLabel}
                      className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600"
                    >
                      Add label
                    </button>
                  </div>
                </div>
                {editError && (
                  <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-200">
                    {editError}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-zinc-700 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
                >
                  Delete room
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && editingRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-room-modal-title"
          onClick={() => !deletingRoom && setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-room-modal-title"
              className="text-lg font-semibold text-white"
            >
              Delete room
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Are you sure you want to delete this room{" "}
              <strong className="text-white">
                &quot;{editingRoom.title}&quot;
              </strong>
              ? All audio will be removed and this action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !deletingRoom && setShowDeleteConfirm(false)}
                disabled={deletingRoom}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={deletingRoom}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deletingRoom ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold text-white">🎲 SoundTable</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/create-room"
              className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-amber-400"
            >
              New Room
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg border border-zinc-600 px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
            >
              Sign out
            </button>

            {user ? (
              <span className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-sm text-zinc-200">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/30 text-xs font-medium text-amber-200">
                    {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                  </span>
                )}
                <span className="max-w-[140px] truncate">
                  {user.displayName ?? user.email ?? "User"}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 pb-24">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-500/20 p-4 text-red-200">
            {error}
          </div>
        )}
        {!loading && !error && rooms.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
            <p className="text-zinc-400">No rooms yet.</p>
            <Link
              href="/create-room"
              className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-amber-400"
            >
              Create your first room
            </Link>
          </div>
        )}
        {!loading && !error && rooms.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {rooms.map((room, index) => (
              <li
                key={room.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-stretch gap-2 rounded-xl transition-opacity ${
                  draggedId === room.id ? "opacity-50" : ""
                } ${reordering ? "pointer-events-none" : ""}`}
              >
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, room.id)}
                  className="flex cursor-grab active:cursor-grabbing touch-none flex-col justify-center rounded-l-xl border border-zinc-700/50 border-r-0 bg-zinc-800/50 py-2 pl-2 pr-1 text-zinc-500 hover:bg-zinc-700/50 hover:text-zinc-400"
                  title="Drag to reorder"
                  aria-label="Drag to reorder"
                >
                  <svg
                    className="h-5 w-5 pointer-events-none"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <RoomCard room={room} onEdit={openEditModal} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
