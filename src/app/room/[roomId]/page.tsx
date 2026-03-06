"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getRoom,
  getAudios,
  addAudio,
  reorderAudios,
  removeAudio,
} from "@/lib/storage";
import type { Room, AudioItem } from "@/lib/types";
import { RoomTitleBlock } from "@/components/RoomTitleBlock";
import { AudioRow } from "@/components/AudioRow";
import { FreesoundSearch } from "@/components/FreesoundSearch";
import { useAudioStore } from "@/store/audioStore";
import { useAuth } from "@/contexts/AuthContext";
import { extractYouTubeId } from "@/lib/youtube";

export default function RoomPage() {
  const params = useParams();
  const { user } = useAuth();
  const roomId = params.roomId as string;
  const [room, setRoom] = useState<Room | null>(null);
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addYoutubeUrl, setAddYoutubeUrl] = useState("");
  const [addingYoutube, setAddingYoutube] = useState(false);
  const [addYoutubeError, setAddYoutubeError] = useState<string | null>(null);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [audioToDelete, setAudioToDelete] = useState<AudioItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [inactiveAudioIds, setInactiveAudioIds] = useState<string[]>([]);
  const [showAddSoundModal, setShowAddSoundModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getRoom(roomId), getAudios(roomId)])
      .then(([r, a]) => {
        if (!cancelled) {
          setRoom(r ?? null);
          setAudios(a);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const filteredAudios = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return audios;
    return audios.filter((a) => a.name.toLowerCase().includes(q));
  }, [audios, search]);

  const activeAudios = useMemo(
    () => filteredAudios.filter((a) => !inactiveAudioIds.includes(a.id)),
    [filteredAudios, inactiveAudioIds],
  );

  const inactiveAudios = useMemo(
    () => filteredAudios.filter((a) => inactiveAudioIds.includes(a.id)),
    [filteredAudios, inactiveAudioIds],
  );

  const toggleAudioActive = (audio: AudioItem) => {
    setInactiveAudioIds((prev) =>
      prev.includes(audio.id)
        ? prev.filter((id) => id !== audio.id)
        : [...prev, audio.id],
    );
  };

  const handleAddAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = addName.trim();
    const sourceUrl = addUrl.trim();
    if (!name || !sourceUrl) {
      setAddError("Name and URL are required");
      return;
    }
    setAddError(null);
    setAdding(true);
    try {
      const audio = await addAudio(roomId, { name, sourceUrl, kind: "file" });
      setAudios((prev) => [...prev, audio]);
      setAddName("");
      setAddUrl("");
      setShowAddSoundModal(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add audio");
    } finally {
      setAdding(false);
    }
  };

  const handleAddYouTubeAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = addYoutubeUrl.trim();
    if (!raw) {
      setAddYoutubeError("YouTube link is required");
      return;
    }
    const id = extractYouTubeId(raw);
    if (!id) {
      setAddYoutubeError("Invalid YouTube link or ID");
      return;
    }
    setAddYoutubeError(null);
    setAddingYoutube(true);
    try {
      // Try to fetch the real video title via oEmbed
      let name = `YouTube audio`;
      try {
        const watchUrl = `https://www.youtube.com/watch?v=${id}`;
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
          watchUrl,
        )}&format=json`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = (await res.json()) as { title?: string };
          if (data.title) name = data.title;
        }
      } catch {
        // If it fails, keep the generic name
      }
      const audio = await addAudio(roomId, {
        name,
        sourceUrl: id,
        kind: "youtube",
      });
      setAudios((prev) => [...prev, audio]);
      setAddYoutubeUrl("");
      setShowAddSoundModal(false);
    } catch (err) {
      setAddYoutubeError(
        err instanceof Error ? err.message : "Failed to add YouTube audio",
      );
    } finally {
      setAddingYoutube(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, audioId: string) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, [role='button'], a")) return;
    setDraggedId(audioId);
    e.dataTransfer.setData("audioId", audioId);
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
    const audioId = e.dataTransfer.getData("audioId");
    if (!audioId || !draggedId) return;
    const fromIndex = filteredAudios.findIndex((a) => a.id === draggedId);
    if (fromIndex === -1 || fromIndex === toIndex) {
      setDraggedId(null);
      return;
    }
    useAudioStore.getState().stopAll();
    const reordered = [...filteredAudios];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const rest = audios.filter((a) => !reordered.some((r) => r.id === a.id));
    const newAudios = reordered.map((a, i) => ({ ...a, order: i }));
    const restWithOrder = rest.map((a, i) => ({
      ...a,
      order: reordered.length + i,
    }));
    setAudios([...newAudios, ...restWithOrder]);
    setDraggedId(null);
    setReordering(true);
    try {
      await reorderAudios(roomId, [
        ...newAudios.map((a) => a.id),
        ...rest.map((a) => a.id),
      ]);
    } finally {
      setReordering(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!audioToDelete) return;
    const id = audioToDelete.id;
    setDeleting(true);
    try {
      const p = useAudioStore.getState().players.get(id);
      if (p?.ref) {
        p.ref.pause();
        p.ref.currentTime = 0;
      }
      useAudioStore.getState().setState(id, "stopped");
      await removeAudio(id);
      setAudios((prev) => prev.filter((a) => a.id !== id));
      setAudioToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = useCallback(() => {
    if (!deleting) setAudioToDelete(null);
  }, [deleting]);

  useEffect(() => {
    if (!audioToDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDeleteModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [audioToDelete, closeDeleteModal]);

  useEffect(() => {
    if (!showAddSoundModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAddSoundModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAddSoundModal]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-8">
        <div className="mx-auto max-w-xl rounded-lg bg-red-500/20 p-4 text-red-200">
          {error ?? "Room not found"}
        </div>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-amber-400 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 pb-32">
      {audioToDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          onClick={closeDeleteModal}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-modal-title"
              className="text-lg font-semibold text-white"
            >
              Delete sound
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Are you sure you want to delete{" "}
              <strong className="text-white">
                &quot;{audioToDelete.name}&quot;
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showAddSoundModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-sound-modal-title"
          onClick={() => setShowAddSoundModal(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="add-sound-modal-title"
                className="text-lg font-semibold text-white"
              >
                Add sound
              </h2>
              <button
                type="button"
                onClick={() => setShowAddSoundModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
            <div className="space-y-4">
              <div>
                <FreesoundSearch
                  roomId={roomId}
                  onAdded={async () => {
                    const list = await getAudios(roomId);
                    setAudios(list);
                    setShowAddSoundModal(false);
                  }}
                />
              </div>
              <details className="rounded-lg border border-zinc-700 bg-zinc-800/50">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-300">
                  Add Audio
                </summary>
                <form
                  onSubmit={handleAddAudio}
                  className="space-y-3 border-t border-zinc-700 p-4"
                >
                  <div>
                    <label className="block text-xs text-zinc-400">Name</label>
                    <input
                      type="text"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="mt-1 w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-white"
                      placeholder="e.g. Rain ambience"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400">
                      Source URL (public MP3/audio)
                    </label>
                    <input
                      type="url"
                      value={addUrl}
                      onChange={(e) => setAddUrl(e.target.value)}
                      className="mt-1 w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-white"
                      placeholder="https://…"
                    />
                  </div>
                  {addError && (
                    <p className="text-sm text-red-400">{addError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={adding}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50"
                  >
                    {adding ? "Adding…" : "Add"}
                  </button>
                </form>
              </details>
              <details className="rounded-lg border border-zinc-700 bg-zinc-800/50">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-300">
                  Add YouTube Audio
                </summary>
                <form
                  onSubmit={handleAddYouTubeAudio}
                  className="space-y-3 border-t border-zinc-700 p-4"
                >
                  <div>
                    <label className="block text-xs text-zinc-400">
                      YouTube link or ID
                    </label>
                    <input
                      type="text"
                      value={addYoutubeUrl}
                      onChange={(e) => setAddYoutubeUrl(e.target.value)}
                      className="mt-1 w-full rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-white"
                      placeholder="https://www.youtube.com/watch?v=…"
                    />
                  </div>
                  {addYoutubeError && (
                    <p className="text-sm text-red-400">{addYoutubeError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={addingYoutube}
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50"
                  >
                    {addingYoutube ? "Adding…" : "Add"}
                  </button>
                </form>
              </details>
            </div>
          </div>
        </div>
      ) : null}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-white"
            >
              ← Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddSoundModal(true)}
                className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Add sound
              </button>
              {user ? (
                <span className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-2 text-sm text-zinc-200">
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
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4">
        <RoomTitleBlock room={room} />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-4">
        <div className="mb-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by audio name…"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            aria-label="Filter audios in this room"
          />
        </div>

        <ul className="space-y-3">
          {filteredAudios.length === 0 && (
            <li className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center text-zinc-500">
              {audios.length === 0
                ? "No audios in this room. Use Add sound to add one."
                : "No audios match your search."}
            </li>
          )}
          {activeAudios.map((audio) => (
            <li
              key={audio.id}
              onDragOver={handleDragOver}
              onDrop={(e) =>
                handleDrop(
                  e,
                  filteredAudios.findIndex((a) => a.id === audio.id),
                )
              }
              onDragEnd={handleDragEnd}
              className={`flex items-stretch gap-2 rounded-lg transition-opacity ${
                draggedId === audio.id ? "opacity-50" : ""
              } ${reordering ? "pointer-events-none" : ""}`}
            >
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, audio.id)}
                className="flex cursor-grab active:cursor-grabbing touch-none flex-col justify-center rounded-l-lg border border-zinc-700/50 border-r-0 bg-zinc-900/60 px-2 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
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
                <AudioRow
                  audio={audio}
                  roomId={roomId}
                  isInactive={false}
                  onToggleActive={toggleAudioActive}
                  onDelete={(a) => setAudioToDelete(a)}
                />
              </div>
            </li>
          ))}
        </ul>

        {inactiveAudios.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-zinc-400">
              Disabled audio
            </h2>
            <ul className="space-y-3">
              {inactiveAudios.map((audio) => (
                <li
                  key={audio.id}
                  className="flex items-stretch gap-2 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <AudioRow
                      audio={audio}
                      roomId={roomId}
                      isInactive
                      onToggleActive={toggleAudioActive}
                      onDelete={(a) => setAudioToDelete(a)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
