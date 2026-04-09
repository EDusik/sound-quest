import type { AudioLibraryItem } from "@/lib/audio/mappers/audio-library-map";
import type { AudioItem } from "@/lib/utils/types";
import { extractSpotifyId, toSpotifyUri } from "@/lib/audio/providers/spotify";
import { extractYouTubeId } from "@/lib/audio/providers/youtube";

/** sceneId stored on library playback players (AudioBar / audioStore). */
export const LIBRARY_PLAYER_SCENE_ID = "library-page";

/**
 * Maps a saved library row to an {@link AudioItem} so {@link AudioRow} can register with the global player.
 */
export function audioItemFromLibraryItem(item: AudioLibraryItem): AudioItem {
  const raw = item.sourceUrl.trim();
  const yt = extractYouTubeId(raw);
  if (yt) {
    return {
      id: `lib-${item.id}`,
      sceneId: LIBRARY_PLAYER_SCENE_ID,
      name: item.name,
      sourceUrl: yt,
      createdAt: 0,
      kind: "youtube",
    };
  }
  const sp = extractSpotifyId(raw);
  if (sp) {
    return {
      id: `lib-${item.id}`,
      sceneId: LIBRARY_PLAYER_SCENE_ID,
      name: item.name,
      sourceUrl: toSpotifyUri(sp.id, sp.type),
      createdAt: 0,
      kind: "spotify",
    };
  }
  return {
    id: `lib-${item.id}`,
    sceneId: LIBRARY_PLAYER_SCENE_ID,
    name: item.name,
    sourceUrl: raw,
    createdAt: 0,
    kind: "file",
  };
}
