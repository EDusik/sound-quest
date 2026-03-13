export interface Label {
  id: string;
  text: string;
  color: string;
}

export interface Scene {
  id: string;
  /** URL-friendly identifier derived from title (e.g. "My Scene" → "my-scene"). Used in routes. */
  slug?: string;
  title: string;
  description: string;
  labels: Label[];
  userId: string;
  createdAt: number;
  /** Optional display order; lower first. If missing, sort by createdAt (newest first). */
  order?: number;
}

export type AudioKind = "file" | "freesound" | "youtube" | "spotify";

export interface SpotifyTrack {
  id: string;
  name: string;
  spotifyUri: string;
}

export interface AudioItem {
  id: string;
  sceneId: string;
  name: string;
  sourceUrl: string;
  createdAt: number;
  /** Optional display order; lower first. If missing, sort by createdAt. */
  order?: number;
  /** Optional source kind; older items may not have this set. */
  kind?: AudioKind;
}

export type PlaybackState = "idle" | "playing" | "paused" | "stopped";

export interface YouTubeControl {
  pause: () => void;
  stop: () => void;
  /** Volume 0–1. */
  setVolume?: (v: number) => void;
  /** Seek to position in seconds. */
  seekTo?: (seconds: number) => void;
}

export interface ActivePlayer {
  id: string;
  audioId: string;
  sceneId: string;
  name: string;
  sourceUrl: string;
  state: PlaybackState;
  volume: number;
  loop: boolean;
  ref: HTMLAudioElement | null;
  /** For YouTube players; used by the bottom bar to pause/stop. */
  youtubeControl?: YouTubeControl | null;
  /** Current playback position in seconds (for bottom bar display). */
  currentTime?: number;
  /** Total duration in seconds (for bottom bar display). */
  duration?: number;
}
