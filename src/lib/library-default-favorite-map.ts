import type { DefaultAudioCategorySlug } from "@/lib/default-audio-category-slugs";

export type AudioLibraryDefaultFavoriteRow = {
  id: string;
  user_id: string;
  library_item_id: string;
  category: string;
  display_name: string;
  created_at: string;
};

export type LibraryDefaultFavoriteItem = {
  id: string;
  libraryItemId: string;
  category: DefaultAudioCategorySlug;
  displayName: string;
  sourceUrl: string;
};

export function rowToFavoriteItem(
  row: AudioLibraryDefaultFavoriteRow,
  sourceUrl: string,
): LibraryDefaultFavoriteItem {
  return {
    id: row.id,
    libraryItemId: row.library_item_id,
    category: row.category as DefaultAudioCategorySlug,
    displayName: row.display_name,
    sourceUrl,
  };
}
