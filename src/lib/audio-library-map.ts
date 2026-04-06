export type AudioLibraryRow = {
  id: string;
  user_id: string;
  name: string;
  source_url: string;
  type: string;
  created_at: string;
  order: number | null;
};

export type AudioLibraryItem = {
  id: string;
  userId: string;
  name: string;
  sourceUrl: string;
  type: string;
  createdAt: string;
  order: number | null;
};

export function rowToItem(row: AudioLibraryRow): AudioLibraryItem {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    sourceUrl: row.source_url,
    type: row.type,
    createdAt: row.created_at,
    order: row.order,
  };
}
