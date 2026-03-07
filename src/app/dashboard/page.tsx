"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getRooms, reorderRooms, updateRoom, deleteRoom } from "@/lib/storage";
import type { Room, Label } from "@/lib/types";
import { RoomCard } from "@/components/RoomCard";
import { SoundTableLogo } from "@/components/SoundTableLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  validateRoomForm,
  TITLE_MAX,
  DESCRIPTION_MAX,
  LABEL_TEXT_MAX,
  LABELS_MAX,
} from "@/lib/roomSchema";

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

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
  const [editDescription, setEditDescription] = useState("");
  const [editLabels, setEditLabels] = useState<Label[]>([]);
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<
    Record<string, string>
  >({});
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
      setEditDescription(editingRoom.description ?? "");
      setEditLabels(editingRoom.labels ?? []);
      setNewLabelText("");
      setNewLabelColor(DEFAULT_COLORS[0]);
      setEditError(null);
      setEditFieldErrors({});
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
    setEditFieldErrors({});
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
    const t = newLabelText.trim().slice(0, LABEL_TEXT_MAX);
    if (!t) return;
    if (editLabels.length >= LABELS_MAX) return;
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
    setEditFieldErrors({});

    const validation = validateRoomForm({
      title: editTitle,
      description: editDescription,
      labels: editLabels,
    });
    if (!validation.success) {
      setEditFieldErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      const updated: Room = {
        ...editingRoom,
        title: validation.data.title,
        description: validation.data.description,
        labels: validation.data.labels,
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
            : "Failed to save.";
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
    <div className="bg-background">
      {editingRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-room-title"
        >
          <div
            className="w-full max-w-lg min-w-0 rounded-xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveEdit}>
              <div className="relative flex items-center justify-between border-b border-border px-5 py-4">
                <h2 id="edit-room-title" className="text-lg font-semibold">
                  Edit room
                </h2>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg p-1.5 text-muted hover:bg-border hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
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
              <div className="min-w-0 space-y-6 px-5 py-4 text-foreground">
                <div>
                  <label
                    htmlFor="edit-title"
                    className="block text-sm font-medium text-foreground"
                  >
                    Title
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id="edit-title"
                      type="text"
                      value={editTitle}
                      onChange={(e) =>
                        setEditTitle(e.target.value.slice(0, TITLE_MAX))
                      }
                      maxLength={TITLE_MAX}
                      required
                      className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="Room title"
                    />
                    <span className="text-xs text-muted tabular-nums shrink-0">
                      {editTitle.length}/{TITLE_MAX}
                    </span>
                  </div>
                  {editFieldErrors.title && (
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {editFieldErrors.title}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="edit-description"
                    className="block text-sm font-medium text-foreground"
                  >
                    Description
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id="edit-description"
                      type="text"
                      value={editDescription}
                      onChange={(e) =>
                        setEditDescription(
                          e.target.value.slice(0, DESCRIPTION_MAX),
                        )
                      }
                      maxLength={DESCRIPTION_MAX}
                      className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="Optional description"
                    />
                    <span className="text-xs text-muted tabular-nums shrink-0">
                      {editDescription.length}/{DESCRIPTION_MAX}
                    </span>
                  </div>
                  {editFieldErrors.description && (
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {editFieldErrors.description}
                    </p>
                  )}
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-foreground">
                    Labels ({editLabels.length}/{LABELS_MAX})
                  </label>
                  <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                    {editLabels.map((l) => (
                      <span
                        key={l.id}
                        className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-3 py-1 text-sm text-white"
                        style={{ backgroundColor: l.color }}
                      >
                        <span className="min-w-0 truncate">{l.text}</span>
                        <button
                          type="button"
                          onClick={() => removeEditLabel(l.id)}
                          className="shrink-0 rounded-full hover:bg-white/20"
                          aria-label={`Remove ${l.text}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={newLabelText}
                      onChange={(e) =>
                        setNewLabelText(e.target.value.slice(0, LABEL_TEXT_MAX))
                      }
                      maxLength={LABEL_TEXT_MAX}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addEditLabel())
                      }
                      className="h-9 min-w-[140px] flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder-muted focus:border-accent focus:outline-none"
                      placeholder="Label text"
                    />
                    <span className="text-xs text-muted tabular-nums shrink-0">
                      {newLabelText.length}/{LABEL_TEXT_MAX}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewLabelColor(color)}
                          className="h-6 w-6 shrink-0 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-card sm:h-9 sm:w-9"
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
                      disabled={editLabels.length >= LABELS_MAX}
                      className="rounded-lg bg-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-border/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add label
                    </button>
                  </div>
                  {(editFieldErrors.labels ??
                    Object.keys(editFieldErrors).some((k) =>
                      k.startsWith("labels."),
                    )) && (
                    <p className="mt-1 text-xs text-red-400" role="alert">
                      {editFieldErrors.labels ??
                        Object.entries(editFieldErrors)
                          .filter(([k]) => k.startsWith("labels."))
                          .map(([, v]) => v)[0]}
                    </p>
                  )}
                </div>
                {editError && (
                  <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-200">
                    {editError}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-4">
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
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-card"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent-hover disabled:opacity-50"
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
            className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-room-modal-title"
              className="text-lg font-semibold text-foreground"
            >
              Delete room
            </h2>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to delete this room{" "}
              <strong className="text-foreground">
                &quot;{editingRoom.title}&quot;
              </strong>
              ? All audio will be removed and this action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !deletingRoom && setShowDeleteConfirm(false)}
                disabled={deletingRoom}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-card disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={deletingRoom}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-foreground hover:bg-red-500 disabled:opacity-50"
              >
                {deletingRoom ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-10 w-full border-b border-border bg-background backdrop-blur">
        <div className="flex w-full items-center">
          <div className="mx-auto flex max-w-6xl flex-1 items-center justify-between px-4 py-4">
            <h1 className="text-xl font-semibold text-foreground">
              <SoundTableLogo />
            </h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/create-room"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-xl font-medium text-background transition hover:bg-accent-hover sm:h-auto sm:w-auto sm:px-4 sm:py-2.5 sm:text-sm"
                aria-label="New Room"
                title="New Room"
              >
                <span className="sm:hidden" aria-hidden>
                  +
                </span>
                <span className="hidden sm:inline">New Room</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground transition hover:bg-card sm:h-auto sm:w-auto sm:px-3 sm:py-2.5 sm:text-sm"
                aria-label="Sign out"
                title="Sign out"
              >
                <span className="sm:hidden" aria-hidden>
                  <SignOutIcon className="h-5 w-5" />
                </span>
                <span className="hidden sm:inline">Sign out</span>
              </button>

              {user ? (
                <span className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-1.5 py-1.5 sm:px-3 sm:py-1.5 text-sm text-foreground">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft/50 text-xs font-medium text-accent">
                      {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-[140px] truncate hidden sm:inline">
                    {user.displayName ?? user.email ?? "User"}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 px-4 py-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 pb-24 bg-background">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-500/20 p-4 text-red-200">
            {error}
          </div>
        )}
        {!loading && !error && rooms.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-muted">No rooms yet.</p>
            <Link
              href="/create-room"
              className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent-hover"
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
                  className="flex self-stretch cursor-grab active:cursor-grabbing touch-none flex-col justify-center rounded-l-xl border border-border/50 border-r-0 bg-card/50 py-2 pl-2 pr-1 text-muted hover:bg-border/50 hover:text-muted"
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
