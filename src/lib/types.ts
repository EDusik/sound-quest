export interface Label {
  id: string;
  text: string;
  color: string;
}

export interface Room {
  id: string;
  title: string;
  subtitle: string;
  labels: Label[];
  userId: string;
  createdAt: number;
  /** Optional display order; lower first. If missing, sort by createdAt (newest first). */
  order?: number;
}

export type AudioKind = "file" | "freesound" | "youtube";

export interface AudioItem {
  id: string;
  roomId: string;
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
}

export interface ActivePlayer {
  id: string;
  audioId: string;
  roomId: string;
  name: string;
  sourceUrl: string;
  state: PlaybackState;
  volume: number;
  loop: boolean;
  ref: HTMLAudioElement | null;
  /** For YouTube players; used by the bottom bar to pause/stop. */
  youtubeControl?: YouTubeControl | null;
}
