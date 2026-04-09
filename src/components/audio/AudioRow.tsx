"use client";

import { useRef, useEffect, useState } from "react";
import type { AudioItem } from "@/lib/types";
import { useAudioStore } from "@/store/audioStore";
import { useTranslations } from "@/contexts/I18nContext";
import { SpotifyAudioRow } from "@/components/audio/SpotifyAudioRow";
import { AudioRowHeader } from "@/components/audio/AudioRowHeader";
import { PlaybackControls } from "@/components/audio/PlaybackControls";
import { VolumeSlider } from "@/components/audio/VolumeSlider";
import {
  EditIcon,
  TrashIcon,
  PlusIcon,
  HeartIcon,
  PlayIcon,
} from "@/components/icons";
import { spotifyUriToOpenUrl } from "@/lib/spotify";
import { loadYouTubeIframeAPI } from "@/lib/youtube-embed";

interface AudioRowProps {
  audio: AudioItem;
  sceneId: string;
  isInactive?: boolean;
  onToggleActive?: (audio: AudioItem) => void;
  onDelete?: (audio: AudioItem) => void;
  onRename?: (audio: AudioItem, newName: string) => void;
  /** Open modal to add this audio to other scenes. */
  onAddToScene?: (audio: AudioItem) => void;
  /** When true, add-to-scene is visible but not clickable (e.g. user has no scenes yet). */
  addToSceneDisabled?: boolean;
  /** Save this scene audio to the AI library (shown only for allowlisted accounts). */
  onAddToLibrary?: (audio: AudioItem) => void;
  addToLibraryPending?: boolean;
  /** Optional class for the root card (e.g. rounded-tr-lg rounded-bl-lg when next to drag handle). */
  className?: string;
  /** Only PlaybackControls + volume (+ hidden media). Registers with global AudioBar. */
  playbackOnly?: boolean;
  /** With playbackOnly: hide pause and loop; play when stopped, stop to end. */
  simplifiedPlaybackControls?: boolean;
  /** With playbackOnly: hide pause while playing (e.g. library list cards). Loop unchanged unless simplifiedPlaybackControls. */
  playbackOmitPause?: boolean;
  /** With playbackOnly: hide stop control (e.g. default catalog cards). */
  playbackOmitStop?: boolean;
  /** With playbackOnly: hide volume slider (e.g. default catalog cards). */
  playbackOmitVolume?: boolean;
  /** With playbackOnly: smaller controls and tighter spacing (e.g. default catalog list). */
  compactPlayback?: boolean;
}

function YouTubeAudioRow({
  audio,
  sceneId,
  isInactive = false,
  onToggleActive,
  onDelete,
  onRename,
  onAddToScene,
  addToSceneDisabled = false,
  onAddToLibrary,
  addToLibraryPending,
  className,
  playbackOnly,
  simplifiedPlaybackControls = false,
  playbackOmitPause = false,
  playbackOmitStop = false,
  playbackOmitVolume = false,
  compactPlayback = false,
}: AudioRowProps) {
  const t = useTranslations();
  const compact = playbackOnly && compactPlayback;
  const actionBtn =
    "shrink-0 items-center justify-center text-muted hover:bg-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted";
  const actionBtnClass = compact
    ? `flex h-7 w-7 rounded-md ${actionBtn}`
    : `flex h-9 w-9 rounded-lg ${actionBtn}`;
  const actionIconClass = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  const videoId = audio.sourceUrl;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const register = useAudioStore((s) => s.register);
  const unregister = useAudioStore((s) => s.unregister);
  const setState = useAudioStore((s) => s.setState);
  const setYoutubeControl = useAudioStore((s) => s.setYoutubeControl);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (playbackOnly) {
      setIsInView(true);
    }
  }, [playbackOnly]);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(audio.name);

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
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const saveRename = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== audio.name && onRename) {
      onRename(audio, trimmed);
    }
    setIsEditingName(false);
  };

  const cancelRename = () => {
    setEditNameValue(audio.name);
    setIsEditingName(false);
  };

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
    const el = rowRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setIsInView(true);
      },
      { rootMargin: "100px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;
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
  }, [isInView, videoId, audio.id, setState, setYoutubeControl]);

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

  const handleLoop = () => {
    if (isInactive) return;
    setLoop((prev) => !prev);
  };

  const rightSlot = (
    <>
      {onAddToScene && (
        <button
          type="button"
          disabled={addToSceneDisabled}
          onClick={() => onAddToScene(audio)}
          className={actionBtnClass}
          title={
            addToSceneDisabled
              ? t("addToScene.noScenes")
              : t("common.addToScene")
          }
          aria-label={
            addToSceneDisabled
              ? t("addToScene.noScenes")
              : t("common.addToScene")
          }
        >
          <PlusIcon className={actionIconClass} />
        </button>
      )}
      <PlaybackControls
        isPlaying={isPlaying}
        loop={loop}
        disabled={isInactive}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onLoop={handleLoop}
        omitPause={
          playbackOnly && (simplifiedPlaybackControls || playbackOmitPause)
        }
        omitStop={playbackOnly && playbackOmitStop}
        omitLoop={playbackOnly && simplifiedPlaybackControls}
        compact={compact}
      />
      {onAddToLibrary && (
        <button
          type="button"
          disabled={addToLibraryPending}
          onClick={() => onAddToLibrary(audio)}
          className={`${actionBtnClass} text-accent hover:text-foreground disabled:opacity-50`}
          title={t("aiLibrary.addToLibrary")}
          aria-label={t("aiLibrary.addToLibrary")}
        >
          <HeartIcon className={actionIconClass} />
        </button>
      )}
      {onRename && (
        <button
          type="button"
          onClick={() => {
            setEditNameValue(audio.name);
            setIsEditingName(true);
          }}
          className={actionBtnClass}
          title={t("common.editSoundName")}
          aria-label={t("common.editSoundName")}
        >
          <EditIcon className={actionIconClass} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(audio)}
          className={`${actionBtnClass} text-red-400 hover:bg-red-500/20 hover:text-red-300`}
          title={t("common.deleteSound")}
          aria-label={t("common.deleteSound")}
        >
          <TrashIcon className={actionIconClass} />
        </button>
      )}
      {!(playbackOnly && playbackOmitVolume) && (
        <VolumeSlider
          value={volume}
          onChange={(v) => {
            setVolume(v);
            if (playerRef.current) {
              playerRef.current.setVolume(v * 100);
            }
            useAudioStore.getState().setVolume(audio.id, v);
          }}
          disabled={isInactive}
          compact={compact}
        />
      )}
    </>
  );

  if (playbackOnly) {
    return (
      <div
        className={`flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"} ${className ?? ""}`}
      >
        <div className="hidden" aria-hidden>
          <div ref={containerRef} />
        </div>
        {rightSlot}
      </div>
    );
  }

  return (
    <div
      ref={rowRef}
      className={`flex flex-col gap-2 rounded-lg border bg-card/50 px-4 py-2 sm:flex-row sm:items-center sm:gap-4 ${
        isPlaying ? "border-2 border-accent" : "border-border/50"
      } ${className ?? ""}`}
    >
      <div className="min-w-0 flex-1">
        <AudioRowHeader
          isInactive={isInactive}
          isEditingName={isEditingName}
          editNameValue={editNameValue}
          displayName={audio.name}
          linkUrl={watchUrl}
          onToggleActive={
            onToggleActive ? () => onToggleActive(audio) : undefined
          }
          onStartEditName={() => {
            setEditNameValue(audio.name);
            setIsEditingName(true);
          }}
          onNameChange={setEditNameValue}
          onSaveRename={saveRename}
          onCancelRename={cancelRename}
          nameInputRef={nameInputRef}
          rightSlot={rightSlot}
        />
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
  onRename,
  onAddToScene,
  addToSceneDisabled = false,
  onAddToLibrary,
  addToLibraryPending,
  className,
  playbackOnly,
  simplifiedPlaybackControls = false,
  playbackOmitPause = false,
  playbackOmitStop = false,
  playbackOmitVolume = false,
  compactPlayback = false,
}: AudioRowProps) {
  const t = useTranslations();
  const compact = playbackOnly && compactPlayback;
  const actionBtn =
    "shrink-0 items-center justify-center text-muted hover:bg-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted";
  const actionBtnClass = compact
    ? `flex h-7 w-7 rounded-md ${actionBtn}`
    : `flex h-9 w-9 rounded-lg ${actionBtn}`;
  const actionIconClass = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  const ref = useRef<HTMLAudioElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(audio.name);

  const register = useAudioStore((s) => s.register);
  const unregister = useAudioStore((s) => s.unregister);
  const setState = useAudioStore((s) => s.setState);
  const setRef = useAudioStore((s) => s.setRef);
  const setVolume = useAudioStore((s) => s.setVolume);
  const setLoop = useAudioStore((s) => s.setLoop);
  const setTime = useAudioStore((s) => s.setTime);
  const player = useAudioStore((s) => s.players.get(audio.id));

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const saveRename = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== audio.name && onRename) {
      onRename(audio, trimmed);
    }
    setIsEditingName(false);
  };

  const cancelRename = () => {
    setEditNameValue(audio.name);
    setIsEditingName(false);
  };

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

  const rightSlot = (
    <>
      {onAddToScene && (
        <button
          type="button"
          disabled={addToSceneDisabled}
          onClick={() => onAddToScene(audio)}
          className={actionBtnClass}
          title={
            addToSceneDisabled
              ? t("addToScene.noScenes")
              : t("common.addToScene")
          }
          aria-label={
            addToSceneDisabled
              ? t("addToScene.noScenes")
              : t("common.addToScene")
          }
        >
          <PlusIcon className={actionIconClass} />
        </button>
      )}
      <PlaybackControls
        isPlaying={!!isPlaying}
        loop={player?.loop ?? false}
        disabled={isInactive}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onLoop={handleLoop}
        omitPause={
          playbackOnly && (simplifiedPlaybackControls || playbackOmitPause)
        }
        omitStop={playbackOnly && playbackOmitStop}
        omitLoop={playbackOnly && simplifiedPlaybackControls}
        compact={compact}
      />
      {onAddToLibrary && (
        <button
          type="button"
          disabled={addToLibraryPending}
          onClick={() => onAddToLibrary(audio)}
          className={`${actionBtnClass} text-accent hover:text-foreground disabled:opacity-50`}
          title={t("aiLibrary.addToLibrary")}
          aria-label={t("aiLibrary.addToLibrary")}
        >
          <HeartIcon className={actionIconClass} />
        </button>
      )}
      {onRename && (
        <button
          type="button"
          onClick={() => {
            setEditNameValue(audio.name);
            setIsEditingName(true);
          }}
          className={actionBtnClass}
          title={t("common.editSoundName")}
          aria-label={t("common.editSoundName")}
        >
          <EditIcon className={actionIconClass} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(audio)}
          className={`${actionBtnClass} text-red-400 hover:bg-red-500/20 hover:text-red-300`}
          title={t("common.deleteSound")}
          aria-label={t("common.deleteSound")}
        >
          <TrashIcon className={actionIconClass} />
        </button>
      )}
      {!(playbackOnly && playbackOmitVolume) && (
        <VolumeSlider
          value={volume}
          onChange={(v) => {
            if (ref.current) ref.current.volume = v;
            setVolume(audio.id, v);
          }}
          disabled={isInactive}
          compact={compact}
        />
      )}
    </>
  );

  if (playbackOnly) {
    return (
      <div
        className={`flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"} ${className ?? ""}`}
      >
        <audio
          ref={(el) => {
            (ref as React.MutableRefObject<HTMLAudioElement | null>).current =
              el;
            if (el) setRef(audio.id, el);
          }}
          src={audio.sourceUrl}
          preload="metadata"
          loop={player?.loop ?? false}
          className="hidden"
        />
        {rightSlot}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border bg-card/50 px-4 py-2 sm:flex-row sm:items-center sm:gap-4 ${
        isPlaying ? "border-2 border-accent" : "border-border/50"
      } ${className ?? ""}`}
    >
      <div className="min-w-0 flex-1">
        <audio
          ref={(el) => {
            (ref as React.MutableRefObject<HTMLAudioElement | null>).current =
              el;
            if (el) setRef(audio.id, el);
          }}
          src={audio.sourceUrl}
          preload="metadata"
          loop={player?.loop ?? false}
          className="hidden"
        />
        <AudioRowHeader
          isInactive={isInactive}
          isEditingName={isEditingName}
          editNameValue={editNameValue}
          displayName={audio.name}
          linkUrl={audio.sourceUrl}
          onToggleActive={
            onToggleActive ? () => onToggleActive(audio) : undefined
          }
          onStartEditName={() => {
            setEditNameValue(audio.name);
            setIsEditingName(true);
          }}
          onNameChange={setEditNameValue}
          onSaveRename={saveRename}
          onCancelRename={cancelRename}
          nameInputRef={nameInputRef}
          rightSlot={rightSlot}
        />
      </div>
    </div>
  );
}

function SpotifyLibraryOpenButton({
  sourceUrl,
  className,
  compact = false,
}: {
  sourceUrl: string;
  className?: string;
  compact?: boolean;
}) {
  const t = useTranslations();
  const href = spotifyUriToOpenUrl(sourceUrl);
  const size = compact ? "flex h-7 w-7 rounded-md" : "flex h-9 w-9 rounded-lg";
  const icon = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${size} shrink-0 items-center justify-center border border-border bg-border text-foreground hover:bg-border/80 ${className ?? ""}`}
      title={t("libraryPage.openSpotify")}
      aria-label={t("libraryPage.openSpotify")}
    >
      <PlayIcon className={icon} />
    </a>
  );
}

/** Spotify + playbackOnly: open-in-Spotify plus optional add-to-scene (e.g. default catalog). */
function SpotifyPlaybackOnlyBar({
  audio,
  className,
  onAddToScene,
  addToSceneDisabled = false,
  compact = false,
}: {
  audio: AudioItem;
  className?: string;
  onAddToScene?: (audio: AudioItem) => void;
  addToSceneDisabled?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations();
  const addBtn = compact
    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted"
    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted";
  const addIcon = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div
      className={`flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"} ${className ?? ""}`}
    >
      {onAddToScene && (
        <button
          type="button"
          disabled={addToSceneDisabled}
          onClick={() => onAddToScene(audio)}
          className={addBtn}
          title={
            addToSceneDisabled
              ? t("addToScene.noScenes")
              : t("common.addToScene")
          }
          aria-label={
            addToSceneDisabled
              ? t("addToScene.noScenes")
              : t("common.addToScene")
          }
        >
          <PlusIcon className={addIcon} />
        </button>
      )}
      <SpotifyLibraryOpenButton sourceUrl={audio.sourceUrl} compact={compact} />
    </div>
  );
}

export function AudioRow(props: AudioRowProps) {
  if (props.audio.kind === "youtube") {
    return <YouTubeAudioRow {...props} />;
  }
  if (props.audio.kind === "spotify") {
    if (props.playbackOnly) {
      return (
        <SpotifyPlaybackOnlyBar
          audio={props.audio}
          className={props.className}
          onAddToScene={props.onAddToScene}
          addToSceneDisabled={props.addToSceneDisabled}
          compact={props.compactPlayback}
        />
      );
    }
    return (
      <SpotifyAudioRow
        track={{
          id: props.audio.id,
          name: props.audio.name,
          spotifyUri: props.audio.sourceUrl,
        }}
        sceneId={props.sceneId}
        isInactive={props.isInactive}
        onToggleActive={
          props.onToggleActive
            ? () => props.onToggleActive?.(props.audio)
            : undefined
        }
        onRemove={
          props.onDelete ? () => props.onDelete?.(props.audio) : undefined
        }
        onRename={
          props.onRename
            ? (newName) => props.onRename?.(props.audio, newName)
            : undefined
        }
        onAddToScene={
          props.onAddToScene
            ? () => props.onAddToScene?.(props.audio)
            : undefined
        }
        addToSceneDisabled={props.addToSceneDisabled}
        onAddToLibrary={
          props.onAddToLibrary
            ? () => props.onAddToLibrary?.(props.audio)
            : undefined
        }
        addToLibraryPending={props.addToLibraryPending}
        className={props.className}
      />
    );
  }
  return <HtmlAudioRow {...props} />;
}
