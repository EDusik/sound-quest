/**
 * Spotify URL parsing utilities.
 * @see https://developer.spotify.com/documentation/embeds
 */

/** Spotify URI formats: spotify:track:ID, spotify:album:ID, spotify:playlist:ID, spotify:episode:ID */
export type SpotifyUriType = "track" | "album" | "playlist" | "episode";

/**
 * Extracts Spotify track/album/playlist/episode ID from a URL or URI.
 * Returns null if the input is not a valid Spotify link.
 */
export function extractSpotifyId(
  urlOrUri: string,
): { id: string; type: SpotifyUriType } | null {
  const trimmed = urlOrUri.trim();
  if (!trimmed) return null;

  // spotify:track:3n3Ppam7vgaVa1iaRUc9Lp
  const uriMatch = trimmed.match(
    /^spotify:(track|album|playlist|episode):([a-zA-Z0-9]+)$/,
  );
  if (uriMatch) {
    return { id: uriMatch[2], type: uriMatch[1] as SpotifyUriType };
  }

  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes("spotify.com")) return null;

    // /track/ID, /album/ID, /playlist/ID, /episode/ID
    const pathMatch = url.pathname.match(
      /\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/,
    );
    if (pathMatch) {
      return { id: pathMatch[2], type: pathMatch[1] as SpotifyUriType };
    }
  } catch {
    // Not a valid URL
  }

  return null;
}

/**
 * Converts a Spotify ID and type to a Spotify URI.
 */
export function toSpotifyUri(id: string, type: SpotifyUriType): string {
  return `spotify:${type}:${id}`;
}

/**
 * Converts a Spotify URI to an open.spotify.com URL.
 */
export function spotifyUriToOpenUrl(uri: string): string {
  const match = uri.match(
    /^spotify:(track|album|playlist|episode):([a-zA-Z0-9]+)$/,
  );
  if (!match) return "https://open.spotify.com";
  return `https://open.spotify.com/${match[1]}/${match[2]}`;
}
