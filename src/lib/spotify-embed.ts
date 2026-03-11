/**
 * Spotify iFrame API client.
 * @see https://developer.spotify.com/documentation/embeds
 */

export interface SpotifyEmbedController {
  loadUri: (uri: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  restart: () => void;
  seek: (seconds: number) => void;
  destroy: () => void;
  addListener: (
    event: string,
    cb: (e: {
      data?: {
        playingURI?: string;
        isPaused?: boolean;
        position?: number;
        duration?: number;
      };
    }) => void,
  ) => void;
}

export interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: number; height?: number },
    callback: (controller: SpotifyEmbedController) => void,
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

let spotifyApiPromise: Promise<SpotifyIFrameAPI> | null = null;

/**
 * Loads the Spotify iFrame API script and returns the API when ready.
 */
export function loadSpotifyIframeAPI(): Promise<SpotifyIFrameAPI> {
  if (spotifyApiPromise) return spotifyApiPromise;
  spotifyApiPromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null as unknown as SpotifyIFrameAPI);
      return;
    }
    const w = window;
    w.onSpotifyIframeApiReady = (api: SpotifyIFrameAPI) => {
      resolve(api);
    };
    const tag = document.createElement("script");
    tag.src = "https://open.spotify.com/embed/iframe-api/v1";
    tag.async = true;
    document.body.appendChild(tag);
  });
  return spotifyApiPromise;
}
