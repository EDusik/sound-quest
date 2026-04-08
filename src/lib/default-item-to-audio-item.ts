import type { AudioItem } from "@/lib/types";
import type { DefaultCatalogItem } from "@/lib/default-audio-catalog";
import { extractSpotifyId, toSpotifyUri } from "@/lib/spotify";
import { extractYouTubeId } from "@/lib/youtube";

/** sceneId for players on the default catalog page (isolated from library playback). */
export const DEFAULT_CATALOG_PLAYER_SCENE_ID = "default-catalog-page";

/**
 * Maps a default catalog row to an {@link AudioItem} for {@link AudioRow}.
 */
export function audioItemFromDefaultCatalogItem(item: DefaultCatalogItem): AudioItem {
  const raw = item.sourceUrl.trim();
  const yt = extractYouTubeId(raw);
  if (yt) {
    return {
      id: `def-${item.id}`,
      sceneId: DEFAULT_CATALOG_PLAYER_SCENE_ID,
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
      sceneId: DEFAULT_CATALOG_PLAYER_SCENE_ID,
      name: item.name,
      sourceUrl: toSpotifyUri(sp.id, sp.type),
      createdAt: 0,
      kind: "spotify",
    };
  }
  return {
    id: `def-${item.id}`,
    sceneId: DEFAULT_CATALOG_PLAYER_SCENE_ID,
    name: item.name,
    sourceUrl: raw,
    createdAt: 0,
    kind: "file",
  };
}
