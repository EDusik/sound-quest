"use client";

import { useRef, useEffect, useState } from "react";
import type { AudioItem } from "@/lib/types";
import { useAudioStore } from "@/store/audioStore";

interface AudioRowProps {
  audio: AudioItem;
  sceneId: string;
  isInactive?: boolean;
  onToggleActive?: (audio: AudioItem) => void;
  onDelete?: (audio: AudioItem) => void;
  /** Optional class for the root card (e.g. rounded-tr-lg rounded-bl-lg when next to drag handle). */
  className?: string;
}

let youtubeApiPromise: Promise<unknown> | null = null;

function loadYouTubeIframeAPI(): Promise<unknown> {
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const w = window as typeof window & {
      YT?: {
        Player: new (el: HTMLElement, opts: unknown) => unknown;
        PlayerState?: { PLAYING: number; PAUSED: number; ENDED: number };
      };
      onYouTubeIframeAPIReady?: () => void;
    };
    if (w.YT?.Player) {
      resolve(w.YT);
      return;
    }
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return youtubeApiPromise;
}

function YouTubeAudioRow({
  audio,
  sceneId,
  isInactive = false,
  onToggleActive,
  onDelete,
  className,
}: AudioRowProps) {
  const videoId = audio.sourceUrl;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const register = useAudioStore((s) => s.register);
  const unregister = useAudioStore((s) => s.unregister);
  const setState = useAudioStore((s) => s.setState);
  const setYoutubeControl = useAudioStore((s) => s.setYoutubeControl);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<{
    playVideo: () => void;
    pauseVideo: () => void;
    stopVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    setVolume: (v: number) => void;
    getDuration: () => number;
    getCurrentTime: () => number;
    destroy: () => void;
  } | null>(null);
  const loopRef = useRef(false);
  const timeCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loop, setLoop] = useState(false);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    register({
      id: audio.id,
      audioId: audio.id,
      sceneId,
      name: audio.name,
      sourceUrl: watchUrl,
      youtubeControl: null,
    });
    return () => unregister(audio.id);
  }, [audio.id, audio.name, sceneId, watchUrl, register, unregister]);

  useEffect(() => {
    let cancelled = false;
    if (typeof window === "undefined") return;
    loadYouTubeIframeAPI().then((YTLoaded) => {
      const YT = YTLoaded as {
        Player: new (
          el: HTMLElement,
          opts: unknown,
        ) => {
          playVideo: () => void;
          pauseVideo: () => void;
          stopVideo: () => void;
          seekTo: (seconds: number, allowSeekAhead: boolean) => void;
          setVolume: (v: number) => void;
          getDuration: () => number;
          getCurrentTime: () => number;
          destroy: () => void;
        };
        PlayerState?: { PLAYING: number; PAUSED: number; ENDED: number };
      } | null;
      if (cancelled || !YT || !containerRef.current) return;
      if (playerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        events: {
          onStateChange: (e: { data: number }) => {
            if (!YT?.PlayerState) return;
            switch (e.data) {
              case YT.PlayerState.PLAYING: {
                if (timeCheckInterval.current !== null) {
                  clearInterval(timeCheckInterval.current);
                  timeCheckInterval.current = null;
                }
                setIsPlaying(true);
                setState(audio.id, "playing");
                const player = playerRef.current;
                if (player) {
                  timeCheckInterval.current = setInterval(() => {
                    const ct = player.getCurrentTime();
                    const d = player.getDuration();
                    if (Number.isFinite(ct) && Number.isFinite(d) && d > 0) {
                      useAudioStore.getState().setTime(audio.id, ct, d);
                    }
                  }, 500);
                }
                break;
              }
              case YT.PlayerState.PAUSED:
                if (timeCheckInterval.current !== null) {
                  clearInterval(timeCheckInterval.current);
                  timeCheckInterval.current = null;
                }
                setIsPlaying(false);
                setState(audio.id, "paused");
                break;
              case YT.PlayerState.ENDED:
                if (timeCheckInterval.current !== null) {
                  clearInterval(timeCheckInterval.current);
                  timeCheckInterval.current = null;
                }
                setIsPlaying(false);
                setState(audio.id, "stopped");
                if (loopRef.current && playerRef.current) {
                  playerRef.current.playVideo();
                }
                break;
              default:
                break;
            }
          },
        },
      });
      if (playerRef.current) {
        setYoutubeControl(audio.id, {
          pause: () => playerRef.current?.pauseVideo(),
          stop: () => {
            playerRef.current?.stopVideo();
            setIsPlaying(false);
            setState(audio.id, "stopped");
          },
          setVolume: (v: number) => {
            setVolume(v);
            playerRef.current?.setVolume(Math.round(v * 100));
            useAudioStore.getState().setVolume(audio.id, v);
          },
          seekTo: (seconds: number) => {
            playerRef.current?.seekTo(seconds, true);
          },
        });
      }
    });
    return () => {
      cancelled = true;
      setYoutubeControl(audio.id, null);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [videoId, audio.id, setState, setYoutubeControl]);

  const handlePlay = () => {
    if (isInactive || !playerRef.current) return;
    playerRef.current.seekTo(0, true);
    setVolume(1);
    playerRef.current.setVolume(100);
    useAudioStore.getState().setVolume(audio.id, 1);
    playerRef.current.playVideo();
  };

  const handlePause = () => {
    if (isInactive || !playerRef.current) return;
    playerRef.current.pauseVideo();
  };

  const handleStop = () => {
    if (isInactive || !playerRef.current) return;
    if (timeCheckInterval.current !== null) {
      clearInterval(timeCheckInterval.current);
      timeCheckInterval.current = null;
    }
    playerRef.current.stopVideo();
    setIsPlaying(false);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isInactive) return;
    const v = Number(e.target.value);
    setVolume(v);
    if (playerRef.current) {
      playerRef.current.setVolume(v * 100);
    }
  };

  const handleLoop = () => {
    if (isInactive) return;
    setLoop((prev) => !prev);
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border bg-card/50 px-4 py-2 sm:flex-row sm:items-center sm:gap-4 ${
        isPlaying ? "border-2 border-accent" : "border-border/50"
      } ${className ?? ""}`}
    >
      <div className="flex items-center gap-3 sm:flex-1">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={!isInactive}
            onChange={() => onToggleActive?.(audio)}
            className="h-4 w-4 cursor-pointer accent-accent"
            aria-label={isInactive ? "Re-enable audio" : "Disable audio"}
          />
        </label>
        <div
          className={`min-w-0 flex-1 ${isInactive ? "opacity-40" : ""}`}
          aria-hidden={isInactive}
        >
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate block font-medium text-accent hover:underline"
          >
            {audio.name}
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 ${isInactive ? "opacity-40 pointer-events-none" : ""}`}
          >
            {!isPlaying ? (
              <button
                type="button"
                onClick={handlePlay}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-background hover:bg-accent-hover"
                title="Play"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-background hover:bg-accent-hover"
                title="Pause"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={handleStop}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-border text-foreground hover:bg-border/80"
              title="Stop"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleLoop}
              title={loop ? "Loop on" : "Loop off"}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                loop
                  ? "bg-accent text-foreground hover:bg-accent-hover"
                  : "bg-border text-foreground hover:bg-border/80"
              }`}
              aria-pressed={loop}
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
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(audio)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300"
              title="Delete sound"
              aria-label="Delete sound"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          ) : null}
        </div>
        <label
          className={`flex w-full items-center gap-1 text-xs text-muted sm:w-auto ${isInactive ? "opacity-40 pointer-events-none" : ""}`}
        >
          <span>Vol</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolume}
            className="w-20 flex-1 min-w-0 sm:flex-initial accent-accent border-0 outline-none"
          />
        </label>
      </div>
      <div className="hidden">
        <div ref={containerRef} />
      </div>
    </div>
  );
}

function HtmlAudioRow({
  audio,
  sceneId,
  isInactive = false,
  onToggleActive,
  onDelete,
  className,
}: AudioRowProps) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const register = useAudioStore((s) => s.register);
  const unregister = useAudioStore((s) => s.unregister);
  const setState = useAudioStore((s) => s.setState);
  const setRef = useAudioStore((s) => s.setRef);
  const setVolume = useAudioStore((s) => s.setVolume);
  const setLoop = useAudioStore((s) => s.setLoop);
  const setTime = useAudioStore((s) => s.setTime);
  const player = useAudioStore((s) => s.players.get(audio.id));

  useEffect(() => {
    register({
      id: audio.id,
      audioId: audio.id,
      sceneId,
      name: audio.name,
      sourceUrl: audio.sourceUrl,
    });
    return () => unregister(audio.id);
  }, [audio.id, audio.name, audio.sourceUrl, sceneId, register, unregister]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onEnded = () => setState(audio.id, "stopped");
    const onPlay = () => setState(audio.id, "playing");
    const onPause = () => setState(audio.id, "paused");
    const syncTime = () => {
      const d = el.duration;
      const t = el.currentTime;
      if (Number.isFinite(d) && d >= 0 && Number.isFinite(t)) {
        useAudioStore.getState().setTime(audio.id, t, d);
      }
    };
    const onDurationChange = () => syncTime();
    const onTimeUpdate = () => syncTime();
    el.addEventListener("ended", onEnded);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [audio.id, setState, setTime]);

  const handlePlay = () => {
    if (isInactive) return;
    const el = ref.current;
    if (!el) return;
    el.currentTime = 0;
    el.volume = 1;
    useAudioStore.getState().setVolume(audio.id, 1);
    el.play();
  };
  const handlePause = () => {
    if (isInactive) return;
    ref.current?.pause();
  };
  const handleStop = () => {
    if (isInactive) return;
    if (!ref.current) return;
    ref.current.pause();
    ref.current.currentTime = 0;
    setState(audio.id, "stopped");
  };
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isInactive) return;
    const v = Number(e.target.value);
    if (ref.current) ref.current.volume = v;
    setVolume(audio.id, v);
  };
  const handleLoop = () => {
    if (isInactive) return;
    const el = ref.current;
    if (!el) return;
    const next = !player?.loop;
    el.loop = next;
    setLoop(audio.id, next);
  };

  const isPlaying = player?.state === "playing";
  const volume = player?.volume ?? 1;

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border bg-card/50 px-4 py-2 sm:flex-row sm:items-center sm:gap-4 ${
        isPlaying ? "border-2 border-accent" : "border-border/50"
      } ${className ?? ""}`}
    >
      <audio
        ref={(el) => {
          (ref as React.MutableRefObject<HTMLAudioElement | null>).current = el;
          if (el) setRef(audio.id, el);
        }}
        src={audio.sourceUrl}
        preload="metadata"
        loop={player?.loop ?? false}
        className="hidden"
      />
      <div className="flex items-center gap-3 sm:flex-1">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={!isInactive}
            onChange={() => onToggleActive?.(audio)}
            className="h-4 w-4 cursor-pointer accent-accent"
            aria-label={isInactive ? "Re-enable audio" : "Disable audio"}
          />
        </label>
        <div
          className={`min-w-0 flex-1 ${isInactive ? "opacity-40" : ""}`}
          aria-hidden={isInactive}
        >
          <a
            href={audio.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate block font-medium text-accent hover:underline"
          >
            {audio.name}
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 ${isInactive ? "opacity-40 pointer-events-none" : ""}`}
          >
            {!isPlaying ? (
              <button
                type="button"
                onClick={handlePlay}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-background hover:bg-accent-hover"
                title="Play"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-background hover:bg-accent-hover"
                title="Pause"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={handleStop}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-border text-foreground hover:bg-border/80"
              title="Stop"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleLoop}
              title={player?.loop ? "Loop on" : "Loop off"}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                player?.loop
                  ? "bg-accent text-foreground hover:bg-accent-hover"
                  : "bg-border text-foreground hover:bg-border/80"
              }`}
              aria-pressed={player?.loop}
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
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(audio)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300"
              title="Delete sound"
              aria-label="Delete sound"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          ) : null}
        </div>
        <label
          className={`flex w-full items-center gap-1 text-xs text-muted sm:w-auto ${isInactive ? "opacity-40 pointer-events-none" : ""}`}
        >
          <span>Vol</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolume}
            className="w-20 flex-1 min-w-0 sm:flex-initial accent-accent border-0 outline-none"
          />
        </label>
      </div>
    </div>
  );
}

export function AudioRow(props: AudioRowProps) {
  if (props.audio.kind === "youtube") {
    return <YouTubeAudioRow {...props} />;
  }
  return <HtmlAudioRow {...props} />;
}
