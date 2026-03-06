"use client";

import { useState, useRef } from "react";
import {
  searchFreesound,
  getPreviewUrl,
  isFreesoundConfigured,
  type FreesoundSound,
} from "@/lib/freesound";
import { addAudio } from "@/lib/storage";

interface FreesoundSearchProps {
  roomId: string;
  onAdded: () => void;
}

export function FreesoundSearch({ roomId, onAdded }: FreesoundSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FreesoundSound[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const configured = isFreesoundConfigured();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const data = await searchFreesound(q, 1, 20);
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (sound: FreesoundSound) => {
    const url = getPreviewUrl(sound.previews);
    if (!url) return;
    if (playingId === sound.id) {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
      setPlayingId(null);
      return;
    }
    previewAudioRef.current?.pause();
    const audio = new Audio(url);
    previewAudioRef.current = audio;
    audio.play();
    setPlayingId(sound.id);
    audio.onended = () => {
      previewAudioRef.current = null;
      setPlayingId(null);
    };
    audio.onpause = () => {
      if (playingId !== sound.id) return;
      setPlayingId(null);
    };
  };

  const handleAdd = async (sound: FreesoundSound) => {
    const url = getPreviewUrl(sound.previews);
    if (!url) return;
    setAddingId(sound.id);
    setError(null);
    try {
      await addAudio(roomId, {
        name: sound.name,
        sourceUrl: url,
        kind: "freesound",
      });
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setAddingId(null);
    }
  };

  if (!configured) {
    return (
      <details className="group rounded-lg border border-zinc-700 bg-zinc-800/50">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800/80 [&::-webkit-details-marker]:hidden">
          <span>Search Freesound</span>
          <svg
            className="h-5 w-5 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </summary>
        <div className="border-t border-zinc-700 p-4">
          <p className="text-sm text-zinc-400">
            Add{" "}
            <code className="rounded bg-zinc-700 px-1">
              NEXT_PUBLIC_FREESOUND_API_KEY
            </code>{" "}
            to search and add sounds from{" "}
            <a
              href="https://freesound.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline"
            >
              Freesound
            </a>
            . Get a token at{" "}
            <a
              href="https://freesound.org/apiv2/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline"
            >
              freesound.org/apiv2/apply
            </a>
            .
          </p>
        </div>
      </details>
    );
  }

  return (
    <details className="group rounded-lg border border-zinc-700 bg-zinc-800/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800/80 [&::-webkit-details-marker]:hidden">
        <span>Search Freesound</span>
        {results.length > 0 && (
          <span className="text-xs font-normal text-zinc-500">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </span>
        )}
        <svg
          className="h-5 w-5 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div className="border-t border-zinc-700 p-4">
        <form onSubmit={handleSearch} className="mb-3 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              if (!v.trim()) {
                setResults([]);
                setError(null);
              }
            }}
            placeholder="e.g. rain, piano, alarm…"
            className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            aria-label="Search Freesound"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>
        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
        {results.length > 0 && (
          <ul className="space-y-2">
            {results.map((sound) => {
              const previewUrl = getPreviewUrl(sound.previews);
              const isPlaying = playingId === sound.id;
              const isAdding = addingId === sound.id;
              return (
                <li
                  key={sound.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-600/50 bg-zinc-900/50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">
                      {sound.name}
                    </p>
                    {sound.duration != null && (
                      <p className="text-xs text-zinc-500">
                        {Math.round(sound.duration)}s
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlay(sound)}
                      disabled={!previewUrl}
                      className="rounded bg-zinc-600 p-2 text-white hover:bg-zinc-500 disabled:opacity-50"
                      title={isPlaying ? "Stop" : "Play preview"}
                    >
                      {isPlaying ? (
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdd(sound)}
                      disabled={!previewUrl || isAdding}
                      className="rounded bg-amber-500 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
                    >
                      {isAdding ? "Adding…" : "Add to room"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}
