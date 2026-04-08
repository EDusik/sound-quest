import type { AudioItem } from "@/lib/types";
import type { DefaultCatalogItem } from "@/lib/default-audio-catalog";
import { extractSpotifyId, toSpotifyUri } from "@/lib/spotify";
import { extractYouTubeId } from "@/lib/youtube";

/** sceneId for players on the default catalog page (isolated from library playback). */
export const DEFAULT_CATALOG_PLAYER_SCENE_ID = "default-catalog-page";

/** Landing home preview player (separate from catalog page to avoid shared playback state). */
export const HOME_DEFAULT_SOUNDS_SCENE_ID = "home-default-sounds";

/**
 * Maps a default catalog row to an {@link AudioItem} for {@link AudioRow}.
 */
export function audioItemFromDefaultCatalogItem(
  item: DefaultCatalogItem,
  sceneId: string = DEFAULT_CATALOG_PLAYER_SCENE_ID,
): AudioItem {
  const raw = item.sourceUrl.trim();
  const yt = extractYouTubeId(raw);
  if (yt) {
    return {
      id: `def-${item.id}`,
      sceneId,
      name: item.name,
      sourceUrl: yt,
      createdAt: 0,
      kind: "youtube",
    };
  }
  const sp = extractSpotifyId(raw);
  if (sp) {
    return {
      id: `def-${item.id}`,
      sceneId,
      name: item.name,
      sourceUrl: toSpotifyUri(sp.id, sp.type),
      createdAt: 0,
      kind: "spotify",
    };
  }
  return {
    id: `def-${item.id}`,
    sceneId,
    name: item.name,
    sourceUrl: raw,
    createdAt: 0,
    kind: "file",
  };
}
