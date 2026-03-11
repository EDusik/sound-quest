/**
 * YouTube iFrame API loader.
 * @see https://developers.google.com/youtube/iframe_api_reference
 */

export interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (v: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  destroy: () => void;
}

export interface YouTubePlayerState {
  PLAYING: number;
  PAUSED: number;
  ENDED: number;
}

export interface YouTube {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      events?: {
        onStateChange?: (e: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState?: YouTubePlayerState;
}

declare global {
  interface Window {
    YT?: YouTube;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTube | null> | null = null;

/**
 * Loads the YouTube iFrame API script and returns the YT object when ready.
 */
export function loadYouTubeIframeAPI(): Promise<YouTube | null> {
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const w = window;
    if (w.YT?.Player) {
      resolve(w.YT);
      return;
    }
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT ?? null);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return youtubeApiPromise;
}
