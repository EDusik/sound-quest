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

/** Format seconds as m:ss (e.g. 65 → "1:05") */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioBar() {
  const playing = usePlayingList();

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

  const toggleLoop = (id: string) => {
    const p = useAudioStore.getState().players.get(id);
    if (!p) return;
    const next = !p.loop;
    if (p.ref) p.ref.loop = next;
    useAudioStore.getState().setLoop(id, next);
  };

  const seekTo = (id: string, seconds: number) => {
    const p = useAudioStore.getState().players.get(id);
    if (!p) return;
    const duration = p.duration ?? 0;
    const time = Math.max(0, Math.min(seconds, duration));
    if (p.ref) {
      p.ref.currentTime = time;
      useAudioStore.getState().setTime(id, time, duration);
    } else {
      p.youtubeControl?.seekTo?.(time);
      useAudioStore.getState().setTime(id, time, duration);
    }
  };

  const handleProgressClick = (
    id: string,
    duration: number,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(id, fraction * duration);
  };

  if (playing.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300 border-t border-border bg-card/95 backdrop-blur"
      role="region"
      aria-label="Now playing"
    >
      <div className="flex w-full flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted">
            Playing ({playing.length})
          </p>
          <button
            type="button"
            onClick={stopAll}
            className="rounded-lg bg-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border/80"
            title="Stop all songs"
          >
            Stop all
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {playing.map((p) => {
            const current = p.currentTime ?? 0;
            const duration = p.duration ?? 0;
            const hasTime = duration > 0;
            return (
            <div
              key={p.id}
              className="flex w-full flex-col gap-1.5 rounded-lg border-2 border-accent bg-card px-4 py-3"
            >
              <div className="flex w-full items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {p.name}
                </span>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => pause(p.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-foreground hover:bg-accent-hover"
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-border text-foreground hover:bg-border/80"
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
                <button
                  type="button"
                  onClick={() => toggleLoop(p.id)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    p.loop
                      ? "bg-accent text-foreground hover:bg-accent-hover"
                      : "bg-border text-foreground hover:bg-border/80"
                  }`}
                  title={p.loop ? "Desativar loop" : "Ativar loop"}
                  aria-pressed={p.loop}
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                  </svg>
                </button>
              </div>
              </div>
              {hasTime && (
                <div className="flex w-full items-center gap-2">
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-hidden>
                    {formatTime(current)}
                  </span>
                  <div
                    className="h-3 min-w-0 flex-1 cursor-pointer overflow-hidden rounded-full bg-border"
                    role="progressbar"
                    aria-valuenow={current}
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-label={`Progress: ${formatTime(current)} of ${formatTime(duration)}. Click to seek.`}
                    onClick={(e) => handleProgressClick(p.id, duration, e)}
                  >
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-300 ease-linear pointer-events-none"
                      style={{ width: `${(current / duration) * 100}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-hidden>
                    {formatTime(duration)}
                  </span>
                </div>
              )}
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}
