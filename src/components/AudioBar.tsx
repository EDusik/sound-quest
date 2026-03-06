"use client";

import { useShallow } from "zustand/react/shallow";
import { useAudioStore } from "@/store/audioStore";

function usePlayingList() {
  return useAudioStore(
    useShallow((s) =>
      Array.from(s.players.values()).filter((p) => p.state === "playing"),
    ),
  );
}

export function AudioBar() {
  const playing = usePlayingList();

  if (playing.length === 0) return null;

  const stopAll = () => useAudioStore.getState().stopAll();

  const pause = (id: string) => {
    const p = useAudioStore.getState().players.get(id);
    if (p?.ref) p.ref.pause();
    else p?.youtubeControl?.pause();
  };

  const stop = (id: string) => {
    const p = useAudioStore.getState().players.get(id);
    if (p?.ref) {
      p.ref.pause();
      p.ref.currentTime = 0;
    } else {
      p?.youtubeControl?.stop();
    }
    useAudioStore.getState().setState(id, "stopped");
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300 border-t border-zinc-700 bg-zinc-900/95 backdrop-blur"
      role="region"
      aria-label="Now playing"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-zinc-400">
            Playing ({playing.length})
          </p>
          <button
            type="button"
            onClick={stopAll}
            className="rounded-lg bg-zinc-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-500"
            title="Parar todos os sons"
          >
            Parar todos
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {playing.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2"
            >
              <span className="max-w-[120px] truncate text-sm text-white sm:max-w-[200px]">
                {p.name}
              </span>
              <button
                type="button"
                onClick={() => pause(p.id)}
                className="rounded bg-amber-500/80 p-1.5 text-zinc-900 hover:bg-amber-400"
                title="Pause"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => stop(p.id)}
                className="rounded bg-zinc-600 p-1.5 text-white hover:bg-zinc-500"
                title="Stop"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
